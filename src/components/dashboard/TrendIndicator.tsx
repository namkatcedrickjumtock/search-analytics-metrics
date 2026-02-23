"use client";
import { TrendAnalysis } from "@/lib/metrics";

interface TrendIndicatorProps {
  trend: TrendAnalysis;
}

export function TrendIndicator({ trend }: TrendIndicatorProps) {
  const icon  = trend.direction === "improving" ? "↓" : trend.direction === "degrading" ? "↑" : "→";
  const color = trend.direction === "improving" ? "text-emerald-400" : trend.direction === "degrading" ? "text-red-400" : "text-slate-400";
  const card  = trend.direction === "improving" ? "bg-emerald-500/10 border-emerald-500/20" : trend.direction === "degrading" ? "bg-red-500/10 border-red-500/20" : "bg-slate-800/60 border-slate-700/40";

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${card}`}>
      <span className={`text-2xl font-bold leading-none ${color}`}>{icon}</span>
      <div>
        <p className={`font-mono text-sm font-semibold ${color}`}>{trend.direction.toUpperCase()}</p>
        <p className="mt-0.5 font-mono text-xs text-slate-500">
          slope: {trend.slope > 0 ? "+" : ""}{trend.slope.toFixed(2)} ms/pt
          &nbsp;&middot;&nbsp;R²: {trend.r2.toFixed(2)}&nbsp;
          {trend.isLinear ? "(linear)" : "(non-linear)"}
        </p>
      </div>
    </div>
  );
}
