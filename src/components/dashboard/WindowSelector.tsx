"use client";
import { WindowDuration } from "@/hooks/useMonitor";
import { Tooltip } from "@/components/dashboard/Tooltip";

interface WindowSelectorProps {
  current:  WindowDuration;
  onChange: (w: WindowDuration) => void;
}

const OPTIONS: { value: WindowDuration; tooltip: string }[] = [
  { value: "1m",  tooltip: "Show metrics computed from the last 1 minute of data. Useful for catching immediate issues." },
  { value: "5m",  tooltip: "Show metrics from the last 5 minutes. Good default balance between recency and statistical reliability." },
  { value: "15m", tooltip: "Show metrics from the last 15 minutes. Smooths out short spikes and reveals sustained trends." },
];

export function WindowSelector({ current, onChange }: WindowSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-slate-800/80 p-1">
      {OPTIONS.map((opt) => (
        <Tooltip key={opt.value} content={opt.tooltip} position="bottom">
          <button
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1 font-mono text-xs font-semibold transition-all duration-150 ${
              current === opt.value
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
            }`}
          >
            {opt.value}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
