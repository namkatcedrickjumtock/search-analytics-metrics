"use client";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { HistogramBucket } from "@/lib/metrics";

interface HistogramChartProps {
  data: HistogramBucket[];
}

/** Color-code bars by latency health zone */
function barColor(bucket: HistogramBucket): string {
  if (bucket.start >= 800) return "#ef4444"; // critical
  if (bucket.start >= 300) return "#f59e0b"; // degrading
  return "#34d399";                          // healthy
}

function TooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const b: HistogramBucket = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{b.label} ms</p>
      <p className="mt-1 text-slate-400">Count: <strong className="text-white">{b.count}</strong></p>
    </div>
  );
}

export function HistogramChart({ data }: HistogramChartProps) {
  const total = data.reduce((s, b) => s + b.count, 0);
  if (!total) {
    return <div className="flex h-48 items-center justify-center font-mono text-sm text-slate-600">Waiting for data…</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={46} />
        <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={34} />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="count" name="Requests" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={barColor(entry)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
