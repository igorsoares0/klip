import type { TimeRange } from "@/lib/types";

export const RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: "24h", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom" },
];

const DAYS: Record<TimeRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  custom: 30,
};

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === "string" && value in DAYS;
}

/** Coerces an untrusted `?range=` search param. */
export function parseRange(value: string | string[] | undefined): TimeRange {
  const first = Array.isArray(value) ? value[0] : value;
  return isTimeRange(first) ? first : "30d";
}

export function rangeLabel(range: TimeRange): string {
  return RANGES.find((r) => r.id === range)?.label ?? "30 days";
}

export interface Window {
  from: Date;
  to: Date;
  /** Same-length window immediately before `from`, for period-over-period deltas. */
  previousFrom: Date;
  previousTo: Date;
  /** Postgres date_trunc unit. */
  bucket: "hour" | "day";
  /** How many buckets the chart should show. */
  buckets: number;
}

export function resolveWindow(range: TimeRange, now: Date = new Date()): Window {
  const days = DAYS[range];
  const span = days * 86_400_000;
  const to = now;
  const from = new Date(now.getTime() - span);

  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    previousTo: from,
    bucket: range === "24h" ? "hour" : "day",
    buckets: range === "24h" ? 24 : days,
  };
}
