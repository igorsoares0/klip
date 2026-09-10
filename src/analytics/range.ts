import type { TimeRange } from "@/lib/types";

export const RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: "24h", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom" },
];

const PRESET_DAYS: Record<Exclude<TimeRange, "custom">, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DAY = 86_400_000;

/** Longest custom span we allow — past this the chart and the query both suffer. */
export const MAX_CUSTOM_DAYS = 366;

export type Bucket = "hour" | "day" | "week";

/** What the URL asked for. `from`/`to` are inclusive UTC calendar days. */
export interface WindowSpec {
  range: TimeRange;
  from?: string;
  to?: string;
}

export interface Window {
  from: Date;
  to: Date;
  /** Same-length window immediately before `from`, for period-over-period deltas. */
  previousFrom: Date;
  previousTo: Date;
  /** Postgres date_trunc unit. */
  bucket: Bucket;
  /** Human label for the period, e.g. "30 days" or "Sep 1 – Sep 10". */
  label: string;
}

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === "string" && RANGES.some((r) => r.id === value);
}

/** Coerces an untrusted `?range=` search param. */
export function parseRange(value: string | string[] | undefined): TimeRange {
  const first = Array.isArray(value) ? value[0] : value;
  return isTimeRange(first) ? first : "30d";
}

export function rangeLabel(range: TimeRange): string {
  return RANGES.find((r) => r.id === range)?.label ?? "30 days";
}

/**
 * Buckets sized so the chart always has a readable number of bars. Every bar is
 * a flex column with a 3px gap: a year of daily bars would be 366 columns whose
 * gaps alone fill the chart, leaving the bars themselves invisible.
 */
export function bucketFor(spanMs: number): Bucket {
  const days = spanMs / DAY;
  if (days <= 2) return "hour";
  if (days <= 90) return "day";
  return "week";
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Parses YYYY-MM-DD as the start of that UTC day, or null if it is not a real date. */
export function parseDay(value: string | undefined): Date | null {
  if (!value || !ISO_DAY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  // `new Date("2026-02-31")` rolls over to March; reject anything that moved.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads the period from search params. A custom range that is malformed,
 * backwards, or longer than MAX_CUSTOM_DAYS falls back to 30 days rather than
 * erroring — a bad bookmark should still open a working page.
 */
export function parseWindowParams(
  params: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): WindowSpec {
  const range = parseRange(params.range);
  if (range !== "custom") return { range };

  const from = parseDay(first(params.from));
  const to = parseDay(first(params.to));
  if (!from || !to || from > to) return { range: "30d" };

  // An end date in the future is clamped to today rather than rejected.
  const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
  const end = to > today ? today : to;
  if (from > end) return { range: "30d" };

  const days = (end.getTime() - from.getTime()) / DAY + 1;
  if (days > MAX_CUSTOM_DAYS) return { range: "30d" };

  return {
    range: "custom",
    from: from.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

const LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Presets are rolling (the last N days up to now). Custom ranges are whole UTC
 * calendar days, inclusive of both ends.
 *
 * Days are cut in UTC because that is how the database buckets them. A click at
 * 22:00 in Brazil lands on the next UTC day — a per-workspace timezone is the
 * fix, and not built yet.
 */
export function resolveWindow(
  spec: TimeRange | WindowSpec,
  now: Date = new Date(),
): Window {
  const { range, from: fromDay, to: toDay } =
    typeof spec === "string" ? { range: spec, from: undefined, to: undefined } : spec;

  let from: Date;
  let to: Date;
  let label: string;

  if (range === "custom" && fromDay && toDay) {
    from = parseDay(fromDay)!;
    // Inclusive end: the window runs to the start of the day after `to`.
    to = new Date(parseDay(toDay)!.getTime() + DAY);
    label =
      fromDay === toDay
        ? LABEL.format(from)
        : `${LABEL.format(from)} – ${LABEL.format(parseDay(toDay)!)}`;
  } else {
    const preset = range === "custom" ? "30d" : range;
    to = now;
    from = new Date(now.getTime() - PRESET_DAYS[preset] * DAY);
    label = rangeLabel(preset);
  }

  const span = to.getTime() - from.getTime();
  // The preset "Today" is a rolling 24h and always hourly; everything else by span.
  const bucket: Bucket = range === "24h" ? "hour" : bucketFor(span);

  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    previousTo: from,
    bucket,
    label,
  };
}
