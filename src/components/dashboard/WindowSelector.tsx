"use client";
import { WindowDuration } from "@/hooks/useMonitor";

interface WindowSelectorProps {
  current:  WindowDuration;
  onChange: (w: WindowDuration) => void;
}

const OPTIONS: WindowDuration[] = ["1m", "5m", "15m"];

export function WindowSelector({ current, onChange }: WindowSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-slate-800/80 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1 font-mono text-xs font-semibold transition-all duration-150 ${
            current === opt
              ? "bg-violet-600 text-white shadow"
              : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
