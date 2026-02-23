"use client";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TimeSeriesPoint } from "@/lib/metrics";

interface ThroughputChartProps {
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
      <p className="font-bold text-violet-400">{Number(payload[0].value).toFixed(2)} req/s</p>
    </div>
  );
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  if (!data.length) {
    return <div className="flex h-44 items-center justify-center font-mono text-sm text-slate-600">Waiting for data…</div>;
  }
  const display = data.slice(-80);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={display} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="thrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v: number) => v.toFixed(1)} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<TooltipContent />} />
        <Area type="monotone" dataKey="throughput" name="Throughput" stroke="#8b5cf6" strokeWidth={2} fill="url(#thrGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
