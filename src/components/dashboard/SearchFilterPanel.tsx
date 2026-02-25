"use client";
/**
 * SearchFilterPanel.tsx
 * Search bar + filter controls that let users change the monitored query
 * without touching code.
 *
 * Filters exposed:
 *  - q                      — full-text search query
 *  - published_relative_range  — all / last_7_days / last_month / older
 *  - published_absolute_range  — multi-select year checkboxes (2019–2025)
 *  - order_by               — "" (relevance) or "published_date"
 *  - page_size              — 10 / 25 / 50 / 100
 */
import { useState, FormEvent } from "react";
import { SearchConfig, RelativeRange, AbsoluteYear, OrderBy, buildSearchUrl } from "@/lib/api";
import { InfoTooltip } from "@/components/dashboard/Tooltip";

interface SearchFilterPanelProps {
  config:   SearchConfig;
  onChange: (cfg: SearchConfig) => void;
  disabled: boolean;
}

const RELATIVE_OPTIONS: { value: RelativeRange; label: string }[] = [
  { value: "all",         label: "All time"    },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_month",  label: "Last month"  },
  { value: "older",       label: "Older"       },
];

const YEAR_OPTIONS: AbsoluteYear[] = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"];

const PAGE_SIZES = [10, 25, 50, 100];

export function SearchFilterPanel({ config, onChange, disabled }: SearchFilterPanelProps) {
  const [draft, setDraft] = useState<SearchConfig>(config);
  const [expanded, setExpanded] = useState(true);

  const toggleYear = (year: AbsoluteYear) => {
    setDraft((d) => ({
      ...d,
      publishedAbsoluteYears: d.publishedAbsoluteYears.includes(year)
        ? d.publishedAbsoluteYears.filter((y) => y !== year)
        : [...d.publishedAbsoluteYears, year],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onChange({ ...draft, page: 0 });
  };

  const handleReset = () => {
    const fresh: SearchConfig = {
      q:                      "cameroon",
      publishedRelativeRange: "all",
      publishedAbsoluteYears: [],
      orderBy:                "",
      pageSize:               50,
      page:                   0,
    };
    setDraft(fresh);
    onChange(fresh);
  };

  const previewUrl = buildSearchUrl(draft);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">Search &amp; Filters</span>
          <span className="rounded-full bg-violet-600/20 px-2 py-0.5 font-mono text-[10px] text-violet-300">
            q=&quot;{config.q}&quot;
          </span>
          {config.publishedRelativeRange !== "all" && (
            <span className="rounded-full bg-amber-600/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">
              {config.publishedRelativeRange}
            </span>
          )}
          {config.publishedAbsoluteYears.length > 0 && (
            <span className="rounded-full bg-teal-600/20 px-2 py-0.5 font-mono text-[10px] text-teal-300">
              {config.publishedAbsoluteYears.join(", ")}
            </span>
          )}
        </div>
        <span className="text-slate-500 transition-transform duration-200" aria-hidden>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="border-t border-slate-800 px-5 pb-5 pt-4">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">

            {/* ── Query ─────────────────────────────────────────────────── */}
            <div className="xl:col-span-2">
              <label className="mb-1.5 flex items-center gap-1 font-mono text-xs text-slate-400">
                Search Query
                <InfoTooltip
                  content="The full-text search term sent to the API. Changing this will reset all collected metrics so you start fresh."
                  position="right"
                />
              </label>
              <input
                type="text"
                value={draft.q}
                disabled={disabled}
                onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                placeholder="e.g. LE CONSEIL, cameroon finance..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-600 transition focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* ── Order By ─────────────────────────────────────────────── */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 font-mono text-xs text-slate-400">
                Sort Order
                <InfoTooltip
                  content={'"By Date" sorts results from newest to oldest. "Relevance" lets the API rank by how closely the document matches your search term.'}
                  position="right"
                />
              </label>
              <select
                value={draft.orderBy}
                disabled={disabled}
                onChange={(e) => setDraft((d) => ({ ...d, orderBy: e.target.value as OrderBy }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 transition focus:border-violet-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Relevance (default)</option>
                <option value="published_date">By Published Date</option>
              </select>
            </div>

            {/* ── Page Size ─────────────────────────────────────────────── */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 font-mono text-xs text-slate-400">
                Page Size
                <InfoTooltip
                  content="How many results the API returns per request. A larger page size means more data per call but may increase latency — useful for benchmarking."
                  position="left"
                />
              </label>
              <select
                value={draft.pageSize}
                disabled={disabled}
                onChange={(e) => setDraft((d) => ({ ...d, pageSize: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 transition focus:border-violet-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n} results</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Date filters row ──────────────────────────────────────────── */}
          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Relative range */}
            <div>
              <label className="mb-2 flex items-center gap-1 font-mono text-xs text-slate-400">
                Relative Date Range
                <InfoTooltip
                  content='"All time" applies no date filter. The other options filter documents by how recently they were published — useful for testing whether newer or older documents respond differently.'
                  position="right"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {RELATIVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDraft((d) => ({ ...d, publishedRelativeRange: opt.value }))}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                      draft.publishedRelativeRange === opt.value
                        ? "border-violet-500 bg-violet-600/20 text-violet-300"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Absolute year filter */}
            <div>
              <label className="mb-2 flex items-center gap-1 font-mono text-xs text-slate-400">
                Specific Years
                <InfoTooltip
                  content="Select one or more years to restrict results to documents published in those years. You can combine this with the relative range filter. Leave all unchecked to apply no year restriction."
                  position="left"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {YEAR_OPTIONS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleYear(year)}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                      draft.publishedAbsoluteYears.includes(year)
                        ? "border-teal-500 bg-teal-600/20 text-teal-300"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── URL Preview ──────────────────────────────────────────────── */}
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-600">
              Endpoint Preview
            </p>
            <p className="break-all font-mono text-[11px] text-slate-500">
              {previewUrl}
            </p>
          </div>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply &amp; Monitor
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleReset}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to Default
            </button>
            {disabled && (
              <span className="font-mono text-xs text-amber-400">
                ⏸ Pause monitoring to change filters
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
