"use client";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { TimeSeriesPoint } from "@/lib/metrics";

interface ErrorRateChartProps {
  data: TimeSeriesPoint[];
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs shadow-xl">
      <p className="mb-1 text-slate-400">{fmtTime(label)}</p>
      <p className="font-bold text-red-400">{Number(payload[0].value).toFixed(2)}% errors</p>
    </div>
  );
}

export function ErrorRateChart({ data }: ErrorRateChartProps) {
  if (!data.length) {
    return <div className="flex h-44 items-center justify-center font-mono text-sm text-slate-600">Waiting for data…</div>;
  }
  const display = data.slice(-80);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={display} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v: number) => `${v.toFixed(1)}%`} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<TooltipContent />} />
        {/* Threshold markers: 1% = degrading, 5% = critical */}
        <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
        <Area type="monotone" dataKey="errorRate" name="Error Rate" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
