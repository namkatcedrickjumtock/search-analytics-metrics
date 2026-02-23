"use client";
import { motion } from "framer-motion";

interface StatCardProps {
  label:       string;
  value:       string | number;
  unit?:       string;
  sub?:        string;
  valueClass?: string;
  index?:      number;
}

export function StatCard({
  label,
  value,
  unit,
  sub,
  valueClass = "text-violet-400",
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex min-w-[110px] flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-4"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className={`font-mono text-2xl font-bold leading-none ${valueClass}`}
        >
          {value}
        </motion.span>
        {unit && (
          <span className="font-mono text-xs text-slate-500">{unit}</span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-[11px] text-slate-600">{sub}</p>}
    </motion.div>
  );
}
