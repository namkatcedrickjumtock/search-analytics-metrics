"use client";
/**
 * useMonitor.ts
 * Continuous polling hook.
 *
 * Accepts a SearchConfig so the dashboard can change the query,
 * filters, and ordering at runtime. The endpoint URL is rebuilt
 * via buildSearchUrl() on every config change.
 *
 * Module-level singletons (RollingWindow + timeSeries array) survive
 * React re-renders. Calling reset() clears both.
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
import {
  SearchConfig,
  SearchResponse,
  DEFAULT_SEARCH_CONFIG,
  buildSearchUrl,
} from "@/lib/api";

export type WindowDuration = "1m" | "5m" | "15m";

export const WINDOW_MS: Record<WindowDuration, number> = {
  "1m":  60_000,
  "5m":  5 * 60_000,
  "15m": 15 * 60_000,
};

export interface MonitorState {
  metrics:         MetricsSnapshot;
  health:          HealthState;
  timeSeries:      TimeSeriesPoint[];
  histogram:       HistogramBucket[];
  trend:           TrendAnalysis;
  isRunning:       boolean;
  sampleCount:     number;
  window:          WindowDuration;
  searchConfig:    SearchConfig;
  lastResultCount: number;
  currentUrl:      string;
  setWindow:       (w: WindowDuration) => void;
  setSearchConfig: (cfg: SearchConfig) => void;
  start:           () => void;
  stop:            () => void;
  reset:           () => void;
}

// Module-level singletons — persist across re-renders
const globalRollingWindow = new RollingWindow(15 * 60_000);
const globalTimeSeries: TimeSeriesPoint[] = [];

export function useMonitor(pollIntervalMs = 2_000): MonitorState {
  const [isRunning,       setIsRunning]       = useState(false);
  const [windowKey,       setWindowKey]        = useState<WindowDuration>("5m");
  const [searchConfig,    setSearchConfigState] = useState<SearchConfig>(DEFAULT_SEARCH_CONFIG);
  const [lastResultCount, setLastResultCount]  = useState(0);
  const [, forceUpdate] = useState(0);

  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const windowKeyRef    = useRef(windowKey);
  const searchConfigRef = useRef(searchConfig);

  useEffect(() => { windowKeyRef.current    = windowKey;    }, [windowKey]);
  useEffect(() => { searchConfigRef.current = searchConfig; }, [searchConfig]);

  const probe = useCallback(async () => {
    const url       = buildSearchUrl(searchConfigRef.current);
    const t0        = performance.now();
    const timestamp = Date.now();
    let success     = true;
    let statusCode: number | undefined;
    let resultCount = 0;

    try {
      const res = await fetch(url, { cache: "no-store" });
      statusCode = res.status;
      success    = res.ok;
      if (res.ok) {
        const data: SearchResponse = await res.json();
        resultCount = data.search_results?.length ?? 0;
      }
    } catch {
      success = false;
    }

    const duration = performance.now() - t0;
    globalRollingWindow.push({ timestamp, duration, success, statusCode } as Sample);
    setLastResultCount(resultCount);

    const wMs    = WINDOW_MS[windowKeyRef.current];
    const recent = globalRollingWindow.getWindow(wMs);
    const snap   = computeMetrics(recent, wMs);

    globalTimeSeries.push({
      time:       timestamp,
      avg:        snap.avg,
      p50:        snap.p50,
      p95:        snap.p95,
      p99:        snap.p99,
      errorRate:  snap.errorRate,
      throughput: snap.throughput,
    });
    if (globalTimeSeries.length > 300) globalTimeSeries.shift();
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
    globalRollingWindow.clear();
    globalTimeSeries.splice(0, globalTimeSeries.length);
    setLastResultCount(0);
    forceUpdate((n) => n + 1);
  }, [stop]);

  const setSearchConfig = useCallback((cfg: SearchConfig) => {
    setSearchConfigState(cfg);
    // Clear stale metrics when query/filters change
    globalRollingWindow.clear();
    globalTimeSeries.splice(0, globalTimeSeries.length);
    setLastResultCount(0);
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const wMs       = WINDOW_MS[windowKey];
  const samples   = globalRollingWindow.getWindow(wMs);
  const metrics   = computeMetrics(samples, wMs);
  const health    = classifyHealth(metrics);
  const histogram = buildHistogram(samples);
  const trend     = analyzeTrend(globalTimeSeries.slice(-40));

  return {
    metrics,
    health,
    timeSeries:      [...globalTimeSeries],
    histogram,
    trend,
    isRunning,
    sampleCount:     globalRollingWindow.size,
    window:          windowKey,
    searchConfig,
    lastResultCount,
    currentUrl:      buildSearchUrl(searchConfig),
    setWindow:       setWindowKey,
    setSearchConfig,
    start,
    stop,
    reset,
  };
}
