"use client";
/**
 * useLoadTest.ts
 * Manages synthetic load tests against the search endpoint.
 * Now uses the dynamic SearchConfig/URL from useMonitor context.
 */
import { useState, useRef, useCallback } from "react";
import {
  Sample,
  MetricsSnapshot,
  HealthState,
  computeMetrics,
  classifyHealth,
} from "@/lib/metrics";
import { SearchConfig, buildSearchUrl } from "@/lib/api";

export interface LoadTestConfig {
  requestsPerSecond: number;
  concurrency:       number;
  durationSec:       number;
}

export interface LoadTestResult {
  config:          LoadTestConfig;
  searchConfig:    SearchConfig;
  endpointUrl:     string;
  samples:         Sample[];
  metrics:         MetricsSnapshot;
  health:          HealthState;
  totalDurationMs: number;
  scalingAnalysis: string;
}

export interface LoadTestState {
  isRunning:    boolean;
  progress:     number;
  liveRps:      number;
  liveInflight: number;
  result:       LoadTestResult | null;
  error:        string | null;
  start:        (loadConfig: LoadTestConfig, searchConfig: SearchConfig) => Promise<void>;
  stop:         () => void;
}

export function useLoadTest(): LoadTestState {
  const [isRunning,    setIsRunning]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [liveRps,      setLiveRps]      = useState(0);
  const [liveInflight, setLiveInflight] = useState(0);
  const [result,       setResult]       = useState<LoadTestResult | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const abortRef    = useRef(false);
  const inflightRef = useRef(0);

  const stop = useCallback(() => { abortRef.current = true; }, []);

  const start = useCallback(async (loadConfig: LoadTestConfig, searchConfig: SearchConfig) => {
    abortRef.current    = false;
    inflightRef.current = 0;
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setError(null);

    const url            = buildSearchUrl(searchConfig);
    const samples: Sample[] = [];
    const startMs        = Date.now();
    const endMs          = startMs + loadConfig.durationSec * 1_000;
    const intervalMs     = 1_000 / loadConfig.requestsPerSecond;
    const rpsWindow: number[] = [];

    const fireOne = () => {
      if (abortRef.current) return;
      inflightRef.current++;
      setLiveInflight(inflightRef.current);
      const t0        = performance.now();
      const timestamp = Date.now();
      fetch(url, { cache: "no-store" })
        .then((res) => {
          samples.push({ timestamp, duration: performance.now() - t0, success: res.ok, statusCode: res.status });
        })
        .catch(() => {
          samples.push({ timestamp, duration: performance.now() - t0, success: false });
        })
        .finally(() => {
          inflightRef.current--;
          setLiveInflight(inflightRef.current);
          rpsWindow.push(Date.now());
          const cut = Date.now() - 1_000;
          while (rpsWindow.length && rpsWindow[0] < cut) rpsWindow.shift();
          setLiveRps(rpsWindow.length);
        });
    };

    try {
      while (Date.now() < endMs && !abortRef.current) {
        setProgress(Math.min(99, ((Date.now() - startMs) / (loadConfig.durationSec * 1_000)) * 100));
        if (inflightRef.current < loadConfig.concurrency) fireOne();
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      const drainEnd = Date.now() + 15_000;
      while (inflightRef.current > 0 && Date.now() < drainEnd) {
        await new Promise((r) => setTimeout(r, 150));
      }
      setProgress(100);

      const totalDurationMs = Date.now() - startMs;
      const metrics         = computeMetrics(samples, totalDurationMs);
      const health          = classifyHealth(metrics);

      const half  = Math.floor(samples.length / 2);
      const m1    = computeMetrics(samples.slice(0, half), totalDurationMs / 2);
      const m2    = computeMetrics(samples.slice(half),    totalDurationMs / 2);
      const ratio = m1.avg > 0 ? m2.avg / m1.avg : 1;

      let scalingAnalysis: string;
      if (half < 3) {
        scalingAnalysis = "Insufficient samples for scaling analysis.";
      } else if (ratio < 1.25) {
        scalingAnalysis = `Latency is stable under load. First-half avg: ${m1.avg.toFixed(0)}ms → Second-half avg: ${m2.avg.toFixed(0)}ms (ratio ${ratio.toFixed(2)}×). The endpoint scales linearly with no measurable degradation.`;
      } else if (ratio < 2.0) {
        scalingAnalysis = `Moderate latency growth detected. First-half avg: ${m1.avg.toFixed(0)}ms → Second-half avg: ${m2.avg.toFixed(0)}ms (ratio ${ratio.toFixed(2)}×). Behaviour suggests linear scaling with mild queue build-up.`;
      } else {
        scalingAnalysis = `Exponential degradation detected! First-half avg: ${m1.avg.toFixed(0)}ms → Second-half avg: ${m2.avg.toFixed(0)}ms (ratio ${ratio.toFixed(2)}×). Requests are queuing — reduce RPS or concurrency.`;
      }

      setResult({ config: loadConfig, searchConfig, endpointUrl: url, samples, metrics, health, totalDurationMs, scalingAnalysis });
    } catch (e) {
      setError(String(e));
    } finally {
      setIsRunning(false);
      setLiveRps(0);
      setLiveInflight(0);
    }
  }, []);

  return { isRunning, progress, liveRps, liveInflight, result, error, start, stop };
}
