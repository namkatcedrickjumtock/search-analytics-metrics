"use client";
import { motion, AnimatePresence } from "framer-motion";
import { HealthState } from "@/lib/metrics";
import { Tooltip } from "@/components/dashboard/Tooltip";

interface HealthBadgeProps {
  health:    HealthState;
  p95:       number;
  errorRate: number;
}

const STYLES: Record<
  HealthState,
  { label: string; desc: string; dot: string; ring: string; text: string; card: string; meta: string }
> = {
  healthy: {
    label: "HEALTHY",
    desc:  "All systems nominal",
    dot:   "bg-emerald-400",
    ring:  "bg-emerald-400/40",
    text:  "text-emerald-400",
    card:  "bg-emerald-500/10 border-emerald-500/25",
    meta:  "text-emerald-400/70",
  },
  degrading: {
    label: "DEGRADING",
    desc:  "Performance degradation detected",
    dot:   "bg-amber-400",
    ring:  "bg-amber-400/40",
    text:  "text-amber-400",
    card:  "bg-amber-500/10 border-amber-500/25",
    meta:  "text-amber-400/70",
  },
  critical: {
    label: "CRITICAL",
    desc:  "Endpoint under severe stress",
    dot:   "bg-red-400",
    ring:  "bg-red-400/40",
    text:  "text-red-400",
    card:  "bg-red-500/10 border-red-500/25",
    meta:  "text-red-400/70",
  },
};

const TOOLTIP: Record<HealthState, string> = {
  healthy:   "HEALTHY: P95 latency is below 300ms and the error rate is below 1%. The endpoint is responding quickly and reliably.",
  degrading: "DEGRADING: P95 latency is between 300ms and 800ms, or the error rate is between 1% and 5%. Performance is acceptable but declining — monitor closely.",
  critical:  "CRITICAL: P95 latency exceeds 800ms or the error rate exceeds 5%. The endpoint is under severe stress and users are likely experiencing failures or timeouts.",
};

export function HealthBadge({ health, p95, errorRate }: HealthBadgeProps) {
  const s = STYLES[health];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={health}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25 }}
      >
        <Tooltip content={TOOLTIP[health]} position="bottom">
          <div className={`flex cursor-help items-center gap-4 rounded-xl border px-5 py-4 ${s.card}`}>
            <span className="relative flex h-4 w-4 shrink-0">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.ring}`} />
              <span className={`relative inline-flex h-4 w-4 rounded-full ${s.dot}`} />
            </span>
            <div>
              <p className={`font-mono text-sm font-bold tracking-widest ${s.text}`}>{s.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
              <p className={`mt-1 font-mono text-xs ${s.meta}`}>
                P95: {p95.toFixed(0)} ms &middot; Errors: {errorRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Tooltip>
      </motion.div>
    </AnimatePresence>
  );
}
