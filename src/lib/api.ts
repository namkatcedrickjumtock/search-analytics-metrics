/**
 * api.ts
 * Typed schema definitions matching the real search endpoint response,
 * search configuration types, and URL builder utility.
 *
 * Base URL is read from NEXT_PUBLIC_API_BASE_URL env var so you can
 * switch between environments without code changes.
 */

// ─── Base URL (from .env.local) ───────────────────────────────────────────────
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.itamba.net";

// ─── Response Schema ──────────────────────────────────────────────────────────

export interface SearchStatistics {
  current_page: number;
  page_count:   number;
  total_items:  number;
}

export interface DocumentTypeTitle {
  en?: string;
  fr?: string;
  [lang: string]: string | undefined;
}

export interface SearchResult {
  source_table_name:    string;
  document_type_titles: DocumentTypeTitle;
  document_categories:  string[] | null;
  document_title:       string;
  search_id:            string;
  source_id:            string;
  material_id:          string;
  document_id:          string;
  document_ref:         string;
  language:             string;
  material_ref:         string;
  raw_text:             string;
  document_issue_date:  string; // ISO 8601
}

export interface SearchResponse {
  statistics:     SearchStatistics;
  search_results: SearchResult[];
}

// ─── Search Configuration ─────────────────────────────────────────────────────

/**
 * published_relative_range: relative time filter
 *  - "all"         → no date restriction
 *  - "last_7_days" → published in the last 7 days
 *  - "last_month"  → published in the last calendar month
 *  - "older"       → older than 1 month
 */
export type RelativeRange = "all" | "last_7_days" | "last_month" | "older";

/**
 * published_absolute_range: comma-separated list of 4-digit years
 * e.g. "2025,2024,2023"
 * Only applied when the user selects specific years.
 */
export type AbsoluteYear = "2025" | "2024" | "2023" | "2022" | "2021" | "2020" | "2019";

/**
 * order_by: sorting field
 *  - "published_date" → sort results by publication date descending
 *  - ""               → default relevance ranking
 */
export type OrderBy = "published_date" | "";

export interface SearchConfig {
  /** Full-text search query */
  q: string;
  /** Relative date window filter */
  publishedRelativeRange: RelativeRange;
  /** Specific years to include (can be multi-select) */
  publishedAbsoluteYears: AbsoluteYear[];
  /** Sort order */
  orderBy: OrderBy;
  /** Results per page */
  pageSize: number;
  /** Current page (0-indexed) */
  page: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  q:                      "cameroon",
  publishedRelativeRange: "all",
  publishedAbsoluteYears: [],
  orderBy:                "",
  pageSize:               50,
  page:                   0,
};

// ─── URL Builder ──────────────────────────────────────────────────────────────

/**
 * Builds the full API URL from a SearchConfig.
 * Only appends non-empty / non-default parameters.
 *
 * Example output:
 *   https://api.itamba.net/search?q=cameroon&page=0&page_size=50
 *   https://api.itamba.net/search?q=LE+CONSEIL&order_by=published_date&published_relative_range=older&published_absolute_range=2024,2023&page=0&page_size=10
 */
export function buildSearchUrl(config: SearchConfig): string {
  const params = new URLSearchParams();

  params.set("q",         config.q || "cameroon");
  params.set("page",      String(config.page));
  params.set("page_size", String(config.pageSize));

  if (config.orderBy) {
    params.set("order_by", config.orderBy);
  }

  if (config.publishedRelativeRange && config.publishedRelativeRange !== "all") {
    params.set("published_relative_range", config.publishedRelativeRange);
  }

  if (config.publishedAbsoluteYears.length > 0) {
    params.set("published_absolute_range", config.publishedAbsoluteYears.join(","));
  }

  return `${BASE_URL}/search?${params.toString()}`;
}

/**
 * Returns a human-readable label for the current search config,
 * shown in the dashboard header.
 */
export function describeConfig(config: SearchConfig): string {
  const parts: string[] = [`q="${config.q}"`];
  if (config.publishedRelativeRange !== "all") parts.push(config.publishedRelativeRange);
  if (config.publishedAbsoluteYears.length)    parts.push(config.publishedAbsoluteYears.join(", "));
  if (config.orderBy)                          parts.push(`sorted by ${config.orderBy}`);
  return parts.join(" · ");
}
