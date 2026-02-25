"use client";
/**
 * Tooltip.tsx
 * Lightweight hover tooltip — wraps any child element.
 * Uses pure CSS (Tailwind group/peer pattern) + a small JS state
 * so it works in all browsers without a library dependency.
 *
 * Usage:
 *   <Tooltip content="95% of requests finish faster than this value.">
 *     <span>P95</span>
 *   </Tooltip>
 */
import { ReactNode, useState } from "react";

interface TooltipProps {
  content:  ReactNode;
  children: ReactNode;
  /** Where to place the tooltip bubble relative to the trigger */
  position?: "top" | "bottom" | "left" | "right";
}

const POSITION_CLASSES: Record<NonNullable<TooltipProps["position"]>, string> = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      {open && (
        <span
          className={`pointer-events-none absolute z-50 w-56 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-300 shadow-xl ${POSITION_CLASSES[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/** Small ⓘ icon that opens a tooltip — handy for metric labels */
export function InfoTooltip({ content, position = "top" }: Omit<TooltipProps, "children">) {
  return (
    <Tooltip content={content} position={position}>
      <span
        className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-400 ring-1 ring-slate-600 hover:bg-slate-600 hover:text-slate-200"
        tabIndex={0}
        aria-label="More information"
      >
        i
      </span>
    </Tooltip>
  );
}
