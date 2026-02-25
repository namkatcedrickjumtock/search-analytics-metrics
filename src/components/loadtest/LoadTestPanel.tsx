"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadTest, LoadTestConfig } from "@/hooks/useLoadTest";
import { SearchConfig } from "@/lib/api";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { InfoTooltip } from "@/components/dashboard/Tooltip";

/* ── Slider ──────────────────────────────────────────────────────────────────── */
interface SliderProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  unit:     string;
  disabled: boolean;
  tooltip:  string;
  onChange: (v: number) => void;
}

function ConfigSlider({ label, value, min, max, step, unit, disabled, tooltip, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-0.5 font-mono text-xs text-slate-400">
          {label}
          <InfoTooltip content={tooltip} />
        </label>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-violet-300">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <div className="flex justify-between font-mono text-[10px] text-slate-600">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

/* ── Main Panel ──────────────────────────────────────────────────────────────── */
interface LoadTestPanelProps {
  searchConfig: SearchConfig;
}

export function LoadTestPanel({ searchConfig }: LoadTestPanelProps) {
  const [config, setConfig] = useState<LoadTestConfig>({
    requestsPerSecond: 5,
    concurrency:       3,
    durationSec:       30,
  });

  const { isRunning, progress, liveRps, liveInflight, result, error, start, stop } = useLoadTest();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-100">Synthetic Load Test</h2>
          <InfoTooltip
            content="Fires a controlled burst of concurrent requests at the currently configured endpoint. Useful for understanding how the API behaves under traffic spikes and whether latency grows linearly or exponentially with load."
            position="right"
          />
        </div>
        {isRunning && (
          <span className="flex items-center gap-2 font-mono text-xs text-amber-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            RUNNING
          </span>
        )}
      </div>

      {/* Active endpoint */}
      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
        <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
          Firing at
        </p>
        <p className="break-all font-mono text-[11px] text-slate-500">
          {result?.endpointUrl ?? "Configure search above and run test"}
        </p>
      </div>

      {/* Config sliders */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <ConfigSlider
          label="Requests / sec"
          value={config.requestsPerSecond}
          min={1} max={50} step={1} unit="rps"
          disabled={isRunning}
          tooltip="How many requests to dispatch per second. A higher number simulates heavier concurrent traffic. Start low (2–5 rps) and increase to find the threshold where latency begins to degrade."
          onChange={(v) => setConfig((c) => ({ ...c, requestsPerSecond: v }))}
        />
        <ConfigSlider
          label="Concurrency"
          value={config.concurrency}
          min={1} max={20} step={1} unit="threads"
          disabled={isRunning}
          tooltip="Maximum number of requests that can be in-flight at the same time. Think of this as the number of simultaneous users. Keeping concurrency lower than RPS means some requests will wait before being sent."
          onChange={(v) => setConfig((c) => ({ ...c, concurrency: v }))}
        />
        <ConfigSlider
          label="Duration"
          value={config.durationSec}
          min={5} max={120} step={5} unit="sec"
          disabled={isRunning}
          tooltip="How long the load test runs in seconds. Longer tests reveal whether the endpoint sustains performance over time or degrades gradually (known as latency drift)."
          onChange={(v) => setConfig((c) => ({ ...c, durationSec: v }))}
        />
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={() => start(config, searchConfig)}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:bg-violet-700"
          >
            Run Load Test
          </button>
        ) : (
          <button
            onClick={stop}
            className="rounded-lg bg-red-600/80 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Stop
          </button>
        )}
        {isRunning && (
          <span className="font-mono text-xs text-slate-400">
            {liveRps} rps actual &middot; {liveInflight} in-flight
          </span>
        )}
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="mb-1 flex justify-between font-mono text-xs text-slate-500">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-violet-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
          Error: {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-200">Test Results</h3>
              <HealthBadge health={result.health} p95={result.metrics.p95} errorRate={result.metrics.errorRate} />
            </div>

            <div className="flex flex-wrap gap-3">
              <StatCard label="Avg"        value={result.metrics.avg.toFixed(0)}        unit="ms"   valueClass="text-slate-300"   index={0}
                tooltip="Average round-trip time across all requests during the test. Useful as a general benchmark but can be skewed by outliers." />
              <StatCard label="P50"        value={result.metrics.p50.toFixed(0)}        unit="ms"   valueClass="text-emerald-400" index={1}
                tooltip="50th percentile — exactly half of all requests were faster than this. A more reliable measure of 'typical' speed than the average." />
              <StatCard label="P95"        value={result.metrics.p95.toFixed(0)}        unit="ms"   valueClass="text-amber-400"   index={2}
                tooltip="95th percentile — 95% of requests completed within this time. The primary health threshold: above 300ms = degrading, above 800ms = critical." />
              <StatCard label="P99"        value={result.metrics.p99.toFixed(0)}        unit="ms"   valueClass="text-red-400"     index={3}
                tooltip="99th percentile — only 1 in 100 requests was slower than this. Represents worst-case user experience under the tested load." />
              <StatCard label="Throughput" value={result.metrics.throughput.toFixed(2)} unit="rps"  valueClass="text-violet-400"  index={4}
                tooltip="Actual completed requests per second (not just dispatched). Compare against your configured RPS to see how much the API could keep up." />
              <StatCard label="Error Rate" value={result.metrics.errorRate.toFixed(1)}  unit="%"    valueClass="text-red-400"     index={5}
                tooltip="Percentage of requests that failed (network error or non-2xx response). Above 1% = degrading, above 5% = critical." />
              <StatCard label="Samples"    value={result.samples.length}                unit="reqs" valueClass="text-slate-300"   index={6}
                tooltip="Total number of completed requests during the test (including successful and failed)." />
              <StatCard label="Duration"   value={(result.totalDurationMs / 1000).toFixed(1)} unit="s" valueClass="text-slate-300" index={7}
                tooltip="Actual elapsed wall-clock time of the test including request drain time." />
            </div>

            {/* Scaling analysis */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <div className="mb-1 flex items-center gap-1">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Scaling Analysis
                </p>
                <InfoTooltip
                  content="The test is split into two halves (chronologically). If second-half latency is significantly higher than first-half, the endpoint is degrading under sustained load — a sign of queuing, thread exhaustion, or database contention."
                  position="right"
                />
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{result.scalingAnalysis}</p>
            </div>

            {/* Config summary */}
            <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-500">
              <span>Config: {result.config.requestsPerSecond} rps</span>
              <span>&middot;</span>
              <span>{result.config.concurrency} concurrent</span>
              <span>&middot;</span>
              <span>{result.config.durationSec}s duration</span>
              <span>&middot;</span>
              <span>q=&quot;{result.searchConfig.q}&quot;</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
