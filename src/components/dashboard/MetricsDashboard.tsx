"use client";
import { motion } from "framer-motion";
import { useMonitor } from "@/hooks/useMonitor";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { WindowSelector } from "@/components/dashboard/WindowSelector";
import { TrendIndicator } from "@/components/dashboard/TrendIndicator";
import { SearchFilterPanel } from "@/components/dashboard/SearchFilterPanel";
import { LatencyChart } from "@/components/charts/LatencyChart";
import { PercentileChart } from "@/components/charts/PercentileChart";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { ThroughputChart } from "@/components/charts/ThroughputChart";
import { ErrorRateChart } from "@/components/charts/ErrorRateChart";
import { LoadTestPanel } from "@/components/loadtest/LoadTestPanel";
import { BASE_URL } from "@/lib/api";

export function MetricsDashboard() {
  const {
    metrics, health, timeSeries, histogram, trend,
    isRunning, sampleCount, window: win, searchConfig,
    lastResultCount, currentUrl,
    setWindow, setSearchConfig, start, stop, reset,
  } = useMonitor(2_000);

  const { avg, p50, p95, p99, max, min, errorRate, throughput } = metrics;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 font-mono text-xs font-bold text-white">
              OB
            </span>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-tight text-slate-100">
                Search API Observability
              </h1>
              <p className="font-mono text-[10px] text-slate-500 max-w-xs truncate" title={BASE_URL}>
                {BASE_URL}
              </p>
            </div>
          </div>

          {/* Center: health + trend — hidden on small screens */}
          <div className="hidden items-center gap-3 md:flex">
            <HealthBadge health={health} p95={p95} errorRate={errorRate} />
            <TrendIndicator trend={trend} />
          </div>

          {/* Right: window + controls */}
          <div className="flex items-center gap-3">
            <WindowSelector current={win} onChange={setWindow} />
            <span className="hidden flex-col items-end font-mono text-[10px] text-slate-500 sm:flex">
              <span>{sampleCount} samples</span>
              {lastResultCount > 0 && (
                <span className="text-violet-400">{lastResultCount} results/call</span>
              )}
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

        {/* Sub-bar: active URL */}
        <div className="border-t border-slate-800/60 bg-slate-950/60 px-6 py-1.5">
          <p className="font-mono text-[10px] text-slate-600 truncate">
            <span className="mr-2 text-slate-700">Monitoring →</span>
            <span className="text-slate-500">{currentUrl}</span>
          </p>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-screen-2xl space-y-5 px-6 py-6">

        {/* Mobile: health + trend */}
        <div className="flex flex-wrap items-center gap-3 md:hidden">
          <HealthBadge health={health} p95={p95} errorRate={errorRate} />
          <TrendIndicator trend={trend} />
        </div>

        {/* ── Search & Filters ────────────────────────────────────────────── */}
        <SearchFilterPanel
          config={searchConfig}
          onChange={setSearchConfig}
          disabled={isRunning}
        />

        {/* ── Stat Strip ──────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <StatCard
            label="Avg Latency" value={avg.toFixed(0)} unit="ms"
            valueClass="text-slate-300" index={0}
            tooltip="Mean round-trip time of all requests in the selected time window. Can be pulled higher by occasional slow responses — compare with P50 for a fairer picture."
          />
          <StatCard
            label="P50 (Median)" value={p50.toFixed(0)} unit="ms"
            valueClass="text-emerald-400" index={1}
            tooltip="50th percentile latency — the speed that half of all users experience. This is a better 'typical speed' than the average because it ignores extreme outliers."
          />
          <StatCard
            label="P95" value={p95.toFixed(0)} unit="ms"
            valueClass="text-amber-400" index={2}
            tooltip="95th percentile — 95 out of every 100 requests were faster than this. The primary health indicator: below 300ms is healthy, 300–800ms is degrading, above 800ms is critical."
          />
          <StatCard
            label="P99" value={p99.toFixed(0)} unit="ms"
            valueClass="text-orange-400" index={3}
            tooltip="99th percentile — only 1 in 100 requests was slower. Represents worst-case user experience. A large gap between P95 and P99 suggests occasional severe slowdowns."
          />
          <StatCard
            label="Max" value={max.toFixed(0)} unit="ms"
            valueClass="text-red-400" index={4}
            tooltip="The single slowest request recorded in the selected time window. A very high max with a low P99 suggests an isolated spike rather than a systemic problem."
          />
          <StatCard
            label="Min" value={min.toFixed(0)} unit="ms"
            valueClass="text-teal-400" index={5}
            tooltip="The fastest request in the window. Represents best-case server speed — useful for understanding how fast the API can respond under ideal conditions."
          />
          <StatCard
            label="Error Rate" value={errorRate.toFixed(2)} unit="%"
            valueClass="text-red-400" index={6}
            tooltip="Percentage of requests that failed (network error or HTTP error status). Below 1% = healthy, 1–5% = degrading, above 5% = critical."
          />
          <StatCard
            label="Throughput" value={throughput.toFixed(2)} unit="r/s"
            valueClass="text-violet-400" index={7}
            tooltip="Completed requests per second within the selected time window. Reflects how many users the endpoint is serving simultaneously during passive monitoring."
          />
          <StatCard
            label="Results/Call" value={lastResultCount} unit="docs"
            valueClass="text-sky-400" index={8}
            tooltip="Number of search result documents returned by the most recent API call. Useful for verifying your query and filters are matching data, and for understanding payload size."
          />
        </motion.div>

        {/* ── Live Latency Chart ───────────────────────────────────────────── */}
        <ChartPanel
          title="Live Latency"
          subtitle="Average & P95 over time — dashed amber line = 300ms (degrading), dashed red line = 800ms (critical)"
          tooltip="Each point on the chart represents one polling interval. Average (grey) shows typical speed; P95 (amber) shows worst-case for 95% of users. When P95 crosses a threshold line the health badge changes state."
        >
          <LatencyChart data={timeSeries} />
        </ChartPanel>

        {/* ── Percentile + Histogram ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel
            title="Percentile Breakdown"
            subtitle="P50 / P95 / P99 comparison over the selected time window"
            tooltip="Shows three percentile lines together so you can see whether slow requests are isolated (P99 much higher than P95) or systemic (all three lines rising together)."
          >
            <PercentileChart data={timeSeries} />
          </ChartPanel>

          <ChartPanel
            title="Latency Distribution"
            subtitle="Request count per latency bucket — green = healthy zone, amber = degrading, red = critical"
            tooltip="A histogram grouping all requests by how long they took. A healthy endpoint has tall bars on the left (fast responses). Bars shifting right over time indicate the API is slowing down."
          >
            <HistogramChart data={histogram} />
          </ChartPanel>
        </div>

        {/* ── Throughput + Error Rate ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel
            title="Throughput"
            subtitle="Completed requests per second over time"
            tooltip="Shows how many requests per second the monitoring probe is completing. During passive monitoring this reflects poll interval frequency. During load tests, this shows actual achieved RPS."
          >
            <ThroughputChart data={timeSeries} />
          </ChartPanel>

          <ChartPanel
            title="Error Rate"
            subtitle="% of failed requests — amber dashed = 1% threshold, red dashed = 5% threshold"
            tooltip="Any request that fails with a network error or a non-2xx HTTP status counts as an error. Spikes here alongside latency spikes indicate the server is overwhelmed. Errors alone (without latency) suggest a configuration or authentication issue."
          >
            <ErrorRateChart data={timeSeries} />
          </ChartPanel>
        </div>

        {/* ── Load Test Panel ──────────────────────────────────────────────── */}
        <LoadTestPanel searchConfig={searchConfig} />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-slate-600">
            <span>Base URL: {BASE_URL}</span>
            <span className="hidden sm:block">
              Health thresholds: P95 &lt;300ms + err &lt;1% = HEALTHY &nbsp;·&nbsp;
              300–800ms or 1–5% err = DEGRADING &nbsp;·&nbsp;
              P95 &gt;800ms or err &gt;5% = CRITICAL
            </span>
            <span>Window: {win}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
