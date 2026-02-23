"use client";
/**
 * useMonitor.ts
 * React hook that:
 *  1. Continuously polls the search endpoint on a fixed interval
 *  2. Records every response into a module-level RollingWindow (survives re-renders)
 *  3. Derives MetricsSnapshot, HealthState, TimeSeriesPoints, Histogram, TrendAnalysis
 *     for the currently selected time window (1m / 5m / 15m)
 *  4. Exposes start / stop / reset controls
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  RollingWindow,
  Sample,
  MetricsSnapshot,
  TimeSeriesPoint,
  HistogramBucket,
  HealthState,
  TrendAnalysis,
  computeMetrics,
  classifyHealth,
  buildHistogram,
  analyzeTrend,
} from "@/lib/metrics";

export const ENDPOINT =
  "https://api.itamba.net/search?q=cameroon&page=0&page_size=50";

export type WindowDuration = "1m" | "5m" | "15m";

export const WINDOW_MS: Record<WindowDuration, number> = {
  "1m":  60_000,
  "5m":  5 * 60_000,
  "15m": 15 * 60_000,
};

export interface MonitorState {
  metrics:     MetricsSnapshot;
  health:      HealthState;
  timeSeries:  TimeSeriesPoint[];
  histogram:   HistogramBucket[];
  trend:       TrendAnalysis;
  isRunning:   boolean;
  sampleCount: number;
  window:      WindowDuration;
  setWindow:   (w: WindowDuration) => void;
  start:       () => void;
  stop:        () => void;
  reset:       () => void;
}

// Module-level singletons — persist across React re-renders and HMR
const globalWindow    = new RollingWindow(15 * 60_000);
const globalSeries:   TimeSeriesPoint[] = [];

export function useMonitor(pollIntervalMs = 2_000): MonitorState {
  const [isRunning, setIsRunning] = useState(false);
  const [windowKey, setWindowKey] = useState<WindowDuration>("5m");
  // Dummy counter: incrementing it forces React to re-read derived state
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep windowKey accessible inside the probe closure without stale reads
  const windowKeyRef = useRef(windowKey);
  useEffect(() => { windowKeyRef.current = windowKey; }, [windowKey]);

  /** Send one request, record the sample, append a time-series point */
  const probe = useCallback(async () => {
    const t0        = performance.now();
    const timestamp = Date.now();
    let success     = true;
    let statusCode: number | undefined;

    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      statusCode = res.status;
      success    = res.ok;
    } catch {
      success = false;
    }

    const duration = performance.now() - t0;
    globalWindow.push({ timestamp, duration, success, statusCode });

    // Build a snapshot from the current window and append a chart point
    const wMs     = WINDOW_MS[windowKeyRef.current];
    const recent  = globalWindow.getWindow(wMs);
    const snap    = computeMetrics(recent, wMs);

    globalSeries.push({
      time:       timestamp,
      avg:        snap.avg,
      p50:        snap.p50,
      p95:        snap.p95,
      p99:        snap.p99,
      errorRate:  snap.errorRate,
      throughput: snap.throughput,
    });
    // Cap at 300 points ≈ 10 min at 2 s interval
    if (globalSeries.length > 300) globalSeries.shift();

    forceUpdate((n) => n + 1);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    probe();
    intervalRef.current = setInterval(probe, pollIntervalMs);
  }, [probe, pollIntervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    globalWindow.clear();
    globalSeries.splice(0, globalSeries.length);
    forceUpdate((n) => n + 1);
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Derive all state on every render (cheap — just array ops)
  const wMs      = WINDOW_MS[windowKey];
  const samples  = globalWindow.getWindow(wMs);
  const metrics  = computeMetrics(samples, wMs);
  const health   = classifyHealth(metrics);
  const histogram = buildHistogram(samples);
  const trend    = analyzeTrend(globalSeries.slice(-40));

  return {
    metrics,
    health,
    timeSeries:  [...globalSeries],
    histogram,
    trend,
    isRunning,
    sampleCount: globalWindow.size,
    window:      windowKey,
    setWindow:   setWindowKey,
    start,
    stop,
    reset,
  };
}
