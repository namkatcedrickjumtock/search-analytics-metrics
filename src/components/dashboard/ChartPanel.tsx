"use client";
import { ReactNode } from "react";
import { InfoTooltip } from "@/components/dashboard/Tooltip";

interface ChartPanelProps {
  title:     string;
  subtitle?: string;
  tooltip?:  ReactNode;
  children:  ReactNode;
  className?: string;
}

export function ChartPanel({ title, subtitle, tooltip, children, className = "" }: ChartPanelProps) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 ${className}`}>
      <div className="mb-3">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-slate-200">{title}</h3>
          {tooltip && <InfoTooltip content={tooltip} position="right" />}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
