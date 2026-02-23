"use client";
import { ReactNode } from "react";

interface ChartPanelProps {
  title:     string;
  subtitle?: string;
  children:  ReactNode;
  className?: string;
}

export function ChartPanel({ title, subtitle, children, className = "" }: ChartPanelProps) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-200">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
