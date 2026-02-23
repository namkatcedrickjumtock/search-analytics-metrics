"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadTest, LoadTestConfig } from "@/hooks/useLoadTest";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { StatCard } from "@/components/dashboard/StatCard";

/* ── Slider sub-component ──────────────────────────────────────────────────── */
interface SliderProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  unit:     string;
  disabled: boolean;
  onChange: (v: number) => void;
}

function ConfigSlider({ label, value, min, max, step, unit, disabled, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs text-slate-400">{label}</label>
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

/* ── Main panel ────────────────────────────────────────────────────────────── */
export function LoadTestPanel() {
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
        <div>
          <h2 className="text-base font-semibold text-slate-100">Synthetic Load Test</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Fire concurrent requests and analyse latency scaling behaviour
          </p>
        </div>
        {isRunning && (
          <span className="flex items-center gap-2 font-mono text-xs text-amber-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            RUNNING
          </span>
        )}
      </div>

      {/* Config */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <ConfigSlider label="Requests / sec" value={config.requestsPerSecond} min={1} max={50} step={1}  unit="rps"  disabled={isRunning} onChange={(v) => setConfig((c) => ({ ...c, requestsPerSecond: v }))} />
        <ConfigSlider label="Concurrency"    value={config.concurrency}       min={1} max={20} step={1}  unit="thr"  disabled={isRunning} onChange={(v) => setConfig((c) => ({ ...c, concurrency: v }))} />
        <ConfigSlider label="Duration"       value={config.durationSec}       min={5} max={120} step={5} unit="sec"  disabled={isRunning} onChange={(v) => setConfig((c) => ({ ...c, durationSec: v }))} />
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={() => start(config)}
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
            {liveRps} rps &middot; {liveInflight} inflight
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Results</h3>
              <HealthBadge health={result.health} p95={result.metrics.p95} errorRate={result.metrics.errorRate} />
            </div>

            {/* Stat grid */}
            <div className="flex flex-wrap gap-3">
              <StatCard label="Avg"        value={result.metrics.avg.toFixed(0)}       unit="ms"    valueClass="text-slate-300"  index={0} />
              <StatCard label="P50"        value={result.metrics.p50.toFixed(0)}       unit="ms"    valueClass="text-emerald-400" index={1} />
              <StatCard label="P95"        value={result.metrics.p95.toFixed(0)}       unit="ms"    valueClass="text-amber-400"   index={2} />
              <StatCard label="P99"        value={result.metrics.p99.toFixed(0)}       unit="ms"    valueClass="text-red-400"     index={3} />
              <StatCard label="Throughput" value={result.metrics.throughput.toFixed(2)} unit="rps"  valueClass="text-violet-400"  index={4} />
              <StatCard label="Error Rate" value={result.metrics.errorRate.toFixed(1)} unit="%"     valueClass="text-red-400"     index={5} />
              <StatCard label="Samples"    value={result.samples.length}               unit="reqs"  valueClass="text-slate-300"   index={6} />
              <StatCard label="Duration"   value={(result.totalDurationMs / 1000).toFixed(1)} unit="s" valueClass="text-slate-300" index={7} />
            </div>

            {/* Scaling analysis */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scaling Analysis
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{result.scalingAnalysis}</p>
            </div>

            {/* Config summary */}
            <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-500">
              <span>Config: {result.config.requestsPerSecond} rps</span>
              <span>&middot;</span>
              <span>{result.config.concurrency} concurrent</span>
              <span>&middot;</span>
              <span>{result.config.durationSec}s duration</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
