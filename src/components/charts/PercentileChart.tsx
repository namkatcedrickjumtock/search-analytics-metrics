"use client";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { TimeSeriesPoint } from "@/lib/metrics";

interface PercentileChartProps {
  data: TimeSeriesPoint[];
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

const SERIES_CLASSES: Record<string, { dot: string; val: string }> = {
  "P50 (median)": { dot: "bg-emerald-400", val: "text-emerald-300" },
  P95:            { dot: "bg-amber-400",   val: "text-amber-300"  },
  P99:            { dot: "bg-red-400",     val: "text-red-300"    },
};

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs shadow-xl">
      <p className="mb-1.5 text-slate-400">{fmtTime(label)}</p>
      {payload.map((p: any) => {
        const cls = SERIES_CLASSES[p.name] ?? { dot: "bg-slate-400", val: "text-slate-300" };
        return (
          <div key={p.name} className="mb-0.5 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${cls.dot}`} />
            <span className="text-slate-300">
              {p.name}: <strong className={cls.val}>{Number(p.value).toFixed(1)} ms</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PercentileChart({ data }: PercentileChartProps) {
  if (!data.length) {
    return <div className="flex h-52 items-center justify-center font-mono text-sm text-slate-600">Waiting for data…</div>;
  }
  const display = data.slice(-80);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={display} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v: number) => `${v}ms`} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={54} />
        <Tooltip content={<TooltipContent />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 8 }} />
        <ReferenceLine y={300} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={800} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
        <Line type="monotone" dataKey="p50" name="P50"  stroke="#34d399" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="p95" name="P95"  stroke="#fbbf24" strokeWidth={2}   dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="p99" name="P99"  stroke="#f87171" strokeWidth={2}   dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
