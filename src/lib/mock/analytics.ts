import { rnd } from "../rng";
import type {
  BreakdownItem,
  BreakdownPanel,
  SeriesPoint,
  Stat,
  TimeRange,
  TopLink,
} from "../types";

export const ranges: Array<{ id: TimeRange; label: string }> = [
  { id: "24h", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom" },
];

export function rangeLabel(range: TimeRange): string {
  return ranges.find((r) => r.id === range)?.label ?? "30 days";
}

const RANGE_SEED: Record<TimeRange, number> = {
  "24h": 24,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  custom: 30,
};

/**
 * 30 seeded bars. The prototype shared one series between the dashboard and the
 * link-detail chart; here they are separate sources because in the real app they
 * are two different queries. `offset` keeps them from being identical.
 */
export function buildSeries(range: TimeRange, offset = 0): SeriesPoint[] {
  const next = rnd(RANGE_SEED[range] + offset);
  return Array.from({ length: 30 }, (_, i) => {
    const value = Math.min(0.97, 0.3 + 0.55 * next() + i * 0.012);
    return {
      clicks: Math.round(value * 4200),
      unique: Math.round(value * 2600),
      label: `${Math.round(value * 4200)} clicks · ${Math.round(value * 2600)} unique`,
    };
  });
}

/** Peak of the series, used to scale bar heights to the 66% / 30% split. */
export function seriesMax(series: SeriesPoint[]): number {
  return Math.max(...series.map((point) => point.clicks));
}

export const dashboardStats: Stat[] = [
  {
    label: "Total clicks",
    value: "84,392",
    delta: "+12.4%",
    deltaDirection: "up",
    sub: "vs. 75,081 previous period",
  },
  {
    label: "Unique visitors",
    value: "61,208",
    delta: "+9.1%",
    deltaDirection: "up",
    sub: "72.5% of total clicks",
  },
  {
    label: "Active links",
    value: "248",
    delta: "+18",
    deltaDirection: "up",
    sub: "12 paused · 31 archived",
  },
  {
    label: "Avg. redirect",
    value: "38ms",
    delta: "-4ms",
    deltaDirection: "up",
    sub: "p95 · 112ms",
  },
];

export const topLinks: TopLink[] = [
  {
    slug: "klip.to/summer-sale",
    destinationUrl: "example.com/product",
    clicks: "12,904",
    pct: 100,
  },
  {
    slug: "klip.to/creator-drop",
    destinationUrl: "shop.acme.com/drop-02",
    clicks: "9,481",
    pct: 74,
  },
  {
    slug: "klip.to/ig-bio",
    destinationUrl: "acme.com/linkinbio",
    clicks: "7,266",
    pct: 57,
  },
  {
    slug: "klip.to/newsletter",
    destinationUrl: "acme.com/subscribe",
    clicks: "5,102",
    pct: 40,
  },
  {
    slug: "klip.to/webinar-sep",
    destinationUrl: "events.acme.com/sep",
    clicks: "3,847",
    pct: 30,
  },
  {
    slug: "klip.to/app-ios",
    destinationUrl: "apps.apple.com/acme",
    clicks: "2,915",
    pct: 23,
  },
];

export type BreakdownTab = "countries" | "referrers" | "devices";

export const breakdownTabs: Array<{ id: BreakdownTab; label: string }> = [
  { id: "countries", label: "Countries" },
  { id: "referrers", label: "Referrers" },
  { id: "devices", label: "Devices" },
];

export const breakdowns: Record<BreakdownTab, BreakdownItem[]> = {
  countries: [
    { icon: "🇧🇷", label: "Brazil", value: "31,204", pct: 100 },
    { icon: "🇺🇸", label: "United States", value: "18,776", pct: 60 },
    { icon: "🇵🇹", label: "Portugal", value: "9,412", pct: 30 },
    { icon: "🇲🇽", label: "Mexico", value: "6,180", pct: 20 },
    { icon: "🇩🇪", label: "Germany", value: "4,022", pct: 13 },
  ],
  referrers: [
    { icon: "◍", label: "Instagram", value: "28,410", pct: 100 },
    { icon: "◍", label: "Direct", value: "19,882", pct: 70 },
    { icon: "◍", label: "Google", value: "12,004", pct: 42 },
    { icon: "◍", label: "YouTube", value: "8,331", pct: 29 },
    { icon: "◍", label: "Facebook", value: "5,120", pct: 18 },
  ],
  devices: [
    { icon: "▮", label: "Mobile", value: "62,118", pct: 100 },
    { icon: "▭", label: "Desktop", value: "18,904", pct: 30 },
    { icon: "▯", label: "Tablet", value: "3,370", pct: 6 },
  ],
};

export const fastestGrowing = {
  slug: "klip.to/creator-drop",
  clicks: "4,821",
  delta: "+312% vs. last week",
  note: "Mostly Instagram traffic from Brazil.",
};

/** Link-detail screen. */
export const detailStats: Stat[] = [
  { label: "Total clicks", value: "12,904" },
  { label: "Unique visitors", value: "9,318" },
  { label: "Top country", value: "🇧🇷 BR" },
  { label: "Scan share (QR)", value: "18%" },
];

export const detailPanels: BreakdownPanel[] = [
  {
    title: "Countries",
    color: "var(--color-accent)",
    rows: [
      { label: "Brazil", value: "5,204", pct: 100 },
      { label: "United States", value: "3,110", pct: 60 },
      { label: "Portugal", value: "1,782", pct: 34 },
      { label: "Mexico", value: "1,024", pct: 20 },
      { label: "Germany", value: "640", pct: 12 },
    ],
  },
  {
    title: "Referrers",
    color: "var(--color-ink)",
    rows: [
      { label: "Instagram", value: "6,410", pct: 100 },
      { label: "Direct", value: "3,120", pct: 49 },
      { label: "Google", value: "1,884", pct: 29 },
      { label: "YouTube", value: "902", pct: 14 },
      { label: "Other", value: "588", pct: 9 },
    ],
  },
  {
    title: "Devices & OS",
    color: "var(--color-positive)",
    rows: [
      { label: "Mobile · iOS", value: "6,118", pct: 100 },
      { label: "Mobile · Android", value: "3,204", pct: 52 },
      { label: "Desktop · macOS", value: "1,880", pct: 31 },
      { label: "Desktop · Windows", value: "1,102", pct: 18 },
      { label: "Tablet", value: "600", pct: 10 },
    ],
  },
  {
    title: "Browsers",
    color: "var(--color-warning)",
    rows: [
      { label: "Chrome", value: "5,880", pct: 100 },
      { label: "Safari", value: "4,102", pct: 70 },
      { label: "Instagram in-app", value: "2,214", pct: 38 },
      { label: "Edge", value: "480", pct: 8 },
      { label: "Firefox", value: "228", pct: 4 },
    ],
  },
];

/** Workspace-level analytics (/dashboard/analytics) — composed from the same
 *  pieces as the link detail, but aggregating the whole workspace. */
export const workspaceStats: Stat[] = [
  { label: "Total clicks", value: "84,392" },
  { label: "Unique visitors", value: "61,208" },
  { label: "Top country", value: "🇧🇷 BR" },
  { label: "Scan share (QR)", value: "11%" },
];

export const workspacePanels: BreakdownPanel[] = [
  {
    title: "Countries",
    color: "var(--color-accent)",
    rows: breakdowns.countries.map(({ label, value, pct }) => ({
      label,
      value,
      pct,
    })),
  },
  {
    title: "Referrers",
    color: "var(--color-ink)",
    rows: breakdowns.referrers.map(({ label, value, pct }) => ({
      label,
      value,
      pct,
    })),
  },
  {
    title: "Devices & OS",
    color: "var(--color-positive)",
    rows: [
      { label: "Mobile · iOS", value: "34,118", pct: 100 },
      { label: "Mobile · Android", value: "28,000", pct: 82 },
      { label: "Desktop · macOS", value: "11,880", pct: 35 },
      { label: "Desktop · Windows", value: "7,024", pct: 21 },
      { label: "Tablet", value: "3,370", pct: 10 },
    ],
  },
  {
    title: "Browsers",
    color: "var(--color-warning)",
    rows: [
      { label: "Chrome", value: "38,880", pct: 100 },
      { label: "Safari", value: "26,102", pct: 67 },
      { label: "Instagram in-app", value: "14,214", pct: 37 },
      { label: "Edge", value: "3,480", pct: 9 },
      { label: "Firefox", value: "1,228", pct: 3 },
    ],
  },
];
