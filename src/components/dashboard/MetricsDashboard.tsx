"use client";
import { motion } from "framer-motion";
import { useMonitor } from "@/hooks/useMonitor";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { WindowSelector } from "@/components/dashboard/WindowSelector";
import { TrendIndicator } from "@/components/dashboard/TrendIndicator";
import { LatencyChart } from "@/components/charts/LatencyChart";
import { PercentileChart } from "@/components/charts/PercentileChart";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { ThroughputChart } from "@/components/charts/ThroughputChart";
import { ErrorRateChart } from "@/components/charts/ErrorRateChart";
import { LoadTestPanel } from "@/components/loadtest/LoadTestPanel";

export function MetricsDashboard() {
  const {
    metrics, health, timeSeries, histogram, trend,
    isRunning, sampleCount, window: win,
    setWindow, start, stop, reset,
  } = useMonitor(2_000);

  const { avg, p50, p95, p99, max, min, errorRate, throughput } = metrics;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 font-mono text-xs font-bold text-white">
              OB
            </span>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-tight text-slate-100">
                itamba.net / search
              </h1>
              <p className="font-mono text-[10px] text-slate-500">
                api.itamba.net &middot; q=cameroon &middot; page_size=50
              </p>
            </div>
          </div>

          {/* Center: health + trend */}
          <div className="hidden items-center gap-3 md:flex">
            <HealthBadge health={health} p95={p95} errorRate={errorRate} />
            <TrendIndicator trend={trend} />
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-3">
            <WindowSelector current={win} onChange={setWindow} />
            <span className="hidden font-mono text-xs text-slate-500 sm:block">
              {sampleCount} samples
            </span>
            {!isRunning ? (
              <button
                onClick={start}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                ▶ Start
              </button>
            ) : (
              <button
                onClick={stop}
                className="rounded-lg bg-slate-700 px-4 py-1.5 font-mono text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600"
              >
                ⏸ Pause
              </button>
            )}
            <button
              onClick={reset}
              className="rounded-lg border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-screen-2xl space-y-5 px-6 py-6">

        {/* Mobile: health + trend */}
        <div className="flex flex-wrap items-center gap-3 md:hidden">
          <HealthBadge health={health} p95={p95} errorRate={errorRate} />
          <TrendIndicator trend={trend} />
        </div>

        {/* ── Stat strip ─────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <StatCard label="Avg Latency"  value={avg.toFixed(0)}        unit="ms"  valueClass="text-slate-300"   index={0} />
          <StatCard label="P50 (Median)" value={p50.toFixed(0)}        unit="ms"  valueClass="text-emerald-400" index={1} />
          <StatCard label="P95"          value={p95.toFixed(0)}        unit="ms"  valueClass="text-amber-400"   index={2} />
          <StatCard label="P99"          value={p99.toFixed(0)}        unit="ms"  valueClass="text-orange-400"  index={3} />
          <StatCard label="Max"          value={max.toFixed(0)}        unit="ms"  valueClass="text-red-400"     index={4} />
          <StatCard label="Min"          value={min.toFixed(0)}        unit="ms"  valueClass="text-teal-400"    index={5} />
          <StatCard label="Error Rate"   value={errorRate.toFixed(2)}  unit="%"   valueClass="text-red-400"     index={6} />
          <StatCard label="Throughput"   value={throughput.toFixed(2)} unit="r/s" valueClass="text-violet-400"  index={7} />
        </motion.div>

        {/* ── Row 1: Latency time-series (full width) ─────────────────────── */}
        <ChartPanel
          title="Live Latency"
          subtitle="Average & P95 over time — dashed lines mark degrading (300ms) and critical (800ms) thresholds"
        >
          <LatencyChart data={timeSeries} />
        </ChartPanel>

        {/* ── Row 2: Percentile chart + Histogram ────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel
            title="Percentile Breakdown"
            subtitle="P50 / P95 / P99 — rolling window for selected time range"
          >
            <PercentileChart data={timeSeries} />
          </ChartPanel>

          <ChartPanel
            title="Latency Distribution"
            subtitle="Histogram of request durations — green = healthy, amber = degrading, red = critical"
          >
            <HistogramChart data={histogram} />
          </ChartPanel>
        </div>

        {/* ── Row 3: Throughput + Error Rate ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel
            title="Throughput"
            subtitle="Requests per second over time"
          >
            <ThroughputChart data={timeSeries} />
          </ChartPanel>

          <ChartPanel
            title="Error Rate"
            subtitle="% of failed requests — dashed lines at 1% (degrading) and 5% (critical)"
          >
            <ErrorRateChart data={timeSeries} />
          </ChartPanel>
        </div>

        {/* ── Row 4: Load test panel ───────────────────────────────────────── */}
        <LoadTestPanel />

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-4 text-center font-mono text-[10px] text-slate-600">
          Endpoint: https://api.itamba.net/search?q=cameroon&amp;page=0&amp;page_size=50
          &nbsp;&middot;&nbsp;
          Health: P95&lt;300ms+err&lt;1% = healthy · P95 300–800ms or err 1–5% = degrading · P95&gt;800ms or err&gt;5% = critical
        </footer>
      </main>
    </div>
  );
}
