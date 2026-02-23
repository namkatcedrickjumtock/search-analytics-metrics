/**
 * metrics.ts
 * Core metrics computation module — pure functions, no UI dependencies.
 *
 * Concepts:
 *  - RollingWindow: time-bounded in-memory sample buffer (max 15 min)
 *  - percentile():  dynamic P-th percentile via linear interpolation
 *  - computeMetrics(): full snapshot derived from a sample array
 *  - classifyHealth(): three-tier health state (healthy / degrading / critical)
 *  - buildHistogram(): latency distribution buckets
 *  - analyzeTrend():   OLS linear regression slope over time-series points
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Sample {
  /** Wall-clock timestamp (ms since epoch) when the request was dispatched */
  timestamp: number;
  /** Round-trip time in milliseconds measured with performance.now() */
  duration: number;
  /** true = HTTP 2xx with no network error */
  success: boolean;
  statusCode?: number;
}

export interface MetricsSnapshot {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  /** Error percentage 0–100 */
  errorRate: number;
  /** Requests per second over the measured window */
  throughput: number;
  sampleCount: number;
  windowMs: number;
}

export type HealthState = "healthy" | "degrading" | "critical";

export interface TimeSeriesPoint {
  time: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughput: number;
}

export interface HistogramBucket {
  label: string;
  count: number;
  start: number;
  end: number;
}

export interface TrendAnalysis {
  /** ms per data-point — positive = latency rising over time */
  slope: number;
  direction: "improving" | "stable" | "degrading";
  /** Coefficient of determination R²: 1.0 = perfectly linear relationship */
  r2: number;
  /** true if R² > 0.80, meaning behaviour is predictably linear */
  isLinear: boolean;
}

// ─── Rolling Window ───────────────────────────────────────────────────────────

/**
 * RollingWindow keeps a chronological array of Samples.
 *
 * On each call to getWindow(ms) it prunes entries older than `maxWindowMs`
 * from the front, then filters to the requested window.
 *
 * maxWindowMs defaults to 15 min so that the user can switch between
 * 1m / 5m / 15m views without discarding historical data.
 */
export class RollingWindow {
  private samples: Sample[] = [];
  private readonly maxWindowMs: number;

  constructor(maxWindowMs = 15 * 60_000) {
    this.maxWindowMs = maxWindowMs;
  }

  push(sample: Sample): void {
    this.samples.push(sample);
  }

  getWindow(windowMs?: number): Sample[] {
    const now = Date.now();
    // Hard-prune anything older than the absolute max window
    const hardCutoff = now - this.maxWindowMs;
    while (this.samples.length > 0 && this.samples[0].timestamp < hardCutoff) {
      this.samples.shift();
    }
    if (!windowMs) return [...this.samples];
    const cutoff = now - windowMs;
    return this.samples.filter((s) => s.timestamp >= cutoff);
  }

  clear(): void {
    this.samples = [];
  }

  get size(): number {
    return this.samples.length;
  }
}

// ─── Percentile ───────────────────────────────────────────────────────────────

/**
 * Computes the p-th percentile of a sorted ascending array using
 * linear interpolation (same algorithm as NumPy's np.percentile).
 *
 * The array MUST be pre-sorted ascending before calling this function.
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const frac = rank - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

// ─── Metrics Snapshot ────────────────────────────────────────────────────────

/**
 * Derives a full MetricsSnapshot from a sample array.
 * windowMs is only used to compute throughput (req/sec = count / seconds).
 */
export function computeMetrics(
  samples: Sample[],
  windowMs: number
): MetricsSnapshot {
  if (samples.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0, min: 0, errorRate: 0, throughput: 0, sampleCount: 0, windowMs };
  }

  const durations = samples.map((s) => s.duration).sort((a, b) => a - b);
  const errors = samples.filter((s) => !s.success).length;
  const windowSec = windowMs / 1000;

  return {
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    max: durations[durations.length - 1],
    min: durations[0],
    errorRate: (errors / samples.length) * 100,
    throughput: samples.length / windowSec,
    sampleCount: samples.length,
    windowMs,
  };
}

// ─── Health Classification ────────────────────────────────────────────────────

/**
 * Classifies current endpoint health:
 *
 *  HEALTHY   → P95 < 300ms  AND errorRate < 1%
 *  DEGRADING → 300 ≤ P95 ≤ 800ms  OR  1% ≤ errorRate ≤ 5%
 *  CRITICAL  → P95 > 800ms  OR  errorRate > 5%
 */
export function classifyHealth(metrics: MetricsSnapshot): HealthState {
  const { p95, errorRate } = metrics;
  if (p95 > 800 || errorRate > 5) return "critical";
  if (p95 > 300 || errorRate > 1) return "degrading";
  return "healthy";
}

// ─── Latency Histogram ────────────────────────────────────────────────────────

// Boundaries chosen to highlight the two critical thresholds: 300ms and 800ms
const BOUNDARIES = [0, 50, 100, 150, 200, 300, 500, 800, 1200, 2000, Infinity];

/** Builds a latency distribution histogram from an array of Samples. */
export function buildHistogram(samples: Sample[]): HistogramBucket[] {
  return BOUNDARIES.slice(0, -1).map((start, i) => {
    const end = BOUNDARIES[i + 1];
    const label = end === Infinity ? `>${start}` : `${start}–${end}`;
    const count = samples.filter((s) => s.duration >= start && s.duration < end).length;
    return { label, count, start, end };
  });
}

// ─── Trend Analysis ──────────────────────────────────────────────────────────

/**
 * Runs OLS linear regression over the last N time-series points (P95 values).
 *
 * Returns:
 *  slope     – positive = latency rising, negative = falling
 *  r2        – how well a straight line fits (0–1)
 *  isLinear  – R² > 0.80 → behaviour is predictably linear
 *  direction – human-readable summary
 */
export function analyzeTrend(points: TimeSeriesPoint[]): TrendAnalysis {
  if (points.length < 5) {
    return { slope: 0, direction: "stable", r2: 0, isLinear: false };
  }
  const n = points.length;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.p95);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - xMean) * (ys[i] - yMean);
    ssXX += (xs[i] - xMean) ** 2;
    ssYY += (ys[i] - yMean) ** 2;
  }
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const r2 = ssYY === 0 ? 1 : ssXY ** 2 / (ssXX * ssYY);
  return {
    slope,
    r2,
    isLinear: r2 > 0.8,
    direction: slope > 3 ? "degrading" : slope < -3 ? "improving" : "stable",
  };
}
