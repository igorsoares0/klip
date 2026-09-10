import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type {
  BreakdownItem,
  BreakdownPanel,
  SeriesPoint,
  Stat,
  TopLink,
} from "@/lib/types";
import { formatNumber, percentDelta } from "@/shared/format";
import { bucketReferrers } from "./referrers";
import { liveLinks } from "@/links/live";
import type { Window } from "./range";

/**
 * Every aggregate here is scoped by workspaceId and excludes bot traffic.
 * LinkClick carries workspaceId directly (see the schema note), so none of
 * these need to join through Link.
 */

const humanClicks = (workspaceId: string, window: Window, linkId?: string) => ({
  workspaceId,
  isBot: false,
  timestamp: { gte: window.from, lt: window.to },
  ...(linkId ? { linkId } : {}),
});

/** Turns raw counts into the label + value + percentage rows the panels render. */
function toItems(
  rows: Array<{ label: string; count: number; icon?: string }>,
  limit = 5,
): BreakdownItem[] {
  const top = rows.slice(0, limit);
  const max = top[0]?.count ?? 0;
  return top.map((row) => ({
    label: row.label,
    icon: row.icon,
    value: formatNumber(row.count),
    pct: max === 0 ? 0 : Math.round((row.count / max) * 100),
  }));
}

async function countClicks(
  workspaceId: string,
  window: Window,
  extra: Prisma.LinkClickWhereInput = {},
) {
  return db.linkClick.count({ where: { ...humanClicks(workspaceId, window), ...extra } });
}

async function countUniqueVisitors(workspaceId: string, window: Window) {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "ipHash") AS count
    FROM "LinkClick"
    WHERE "workspaceId" = ${workspaceId}
      AND "isBot" = false
      AND "timestamp" >= ${window.from}
      AND "timestamp" < ${window.to}
  `;
  return Number(rows[0]?.count ?? 0);
}

/** The four cards on the dashboard, each compared against the previous window. */
export async function getDashboardStats(
  workspaceId: string,
  window: Window,
): Promise<Stat[]> {
  const previous: Window = {
    ...window,
    from: window.previousFrom,
    to: window.previousTo,
  };

  const [
    clicks,
    prevClicks,
    uniques,
    prevUniques,
    qrScans,
    prevQrScans,
    activeLinks,
    pausedLinks,
    archivedLinks,
    newLinks,
  ] = await Promise.all([
    countClicks(workspaceId, window),
    countClicks(workspaceId, previous),
    countUniqueVisitors(workspaceId, window),
    countUniqueVisitors(workspaceId, previous),
    countClicks(workspaceId, window, { viaQr: true }),
    countClicks(workspaceId, previous, { viaQr: true }),
    db.link.count({ where: { ...liveLinks(workspaceId), status: "ACTIVE" } }),
    db.link.count({ where: { ...liveLinks(workspaceId), status: "PAUSED" } }),
    db.link.count({ where: { ...liveLinks(workspaceId), status: "ARCHIVED" } }),
    db.link.count({
      where: { ...liveLinks(workspaceId), createdAt: { gte: window.from, lt: window.to } },
    }),
  ]);

  const delta = (current: number, prev: number) => {
    const value = percentDelta(current, prev);
    return value
      ? { delta: value, deltaDirection: current >= prev ? ("up" as const) : ("down" as const) }
      : {};
  };

  return [
    {
      label: "Total clicks",
      value: formatNumber(clicks),
      ...delta(clicks, prevClicks),
      sub: `vs. ${formatNumber(prevClicks)} previous period`,
    },
    {
      label: "Unique visitors",
      value: formatNumber(uniques),
      ...delta(uniques, prevUniques),
      sub: clicks
        ? `${((uniques / clicks) * 100).toFixed(1)}% of total clicks`
        : "No clicks yet",
    },
    {
      label: "Active links",
      value: formatNumber(activeLinks),
      ...(newLinks > 0
        ? { delta: `+${newLinks}`, deltaDirection: "up" as const }
        : {}),
      sub: `${pausedLinks} paused · ${archivedLinks} archived`,
    },
    {
      // Replaces the design's "Avg. redirect": redirect latency is an
      // observability metric (spec §35), not something a click row should carry.
      label: "QR scans",
      value: formatNumber(qrScans),
      ...delta(qrScans, prevQrScans),
      sub: clicks
        ? `${((qrScans / clicks) * 100).toFixed(1)}% of total clicks`
        : "No scans yet",
    },
  ];
}

/** The four cards on a single link's detail page. */
export async function getLinkStats(
  workspaceId: string,
  linkId: string,
  window: Window,
): Promise<Stat[]> {
  const where = humanClicks(workspaceId, window, linkId);

  const [clicks, uniqueRows, topCountry, qrScans] = await Promise.all([
    db.linkClick.count({ where }),
    db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "ipHash") AS count
      FROM "LinkClick"
      WHERE "workspaceId" = ${workspaceId}
        AND "linkId" = ${linkId}
        AND "isBot" = false
        AND "timestamp" >= ${window.from}
        AND "timestamp" < ${window.to}
    `,
    db.linkClick.groupBy({
      by: ["country"],
      where,
      _count: { _all: true },
    }),
    db.linkClick.count({ where: { ...where, viaQr: true } }),
  ]);

  const uniques = Number(uniqueRows[0]?.count ?? 0);
  const leader = topCountry
    .filter((row) => row.country)
    .sort((a, b) => b._count._all - a._count._all)[0];

  return [
    { label: "Total clicks", value: formatNumber(clicks) },
    { label: "Unique visitors", value: formatNumber(uniques) },
    { label: "Top country", value: leader?.country ?? "—" },
    {
      label: "Scan share (QR)",
      value: clicks ? `${Math.round((qrScans / clicks) * 100)}%` : "—",
    },
  ];
}

// UTC throughout: the database truncates buckets in UTC, and labelling them in
// the server's local zone would put a bar under the wrong date.
const HOUR = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: "UTC" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function bucketLabel(bucket: Window["bucket"], at: Date): string {
  if (bucket === "hour") return HOUR.format(at);
  if (bucket === "week") return `Week of ${DAY_FMT.format(at)}`;
  return DAY_FMT.format(at);
}

/**
 * Bucketed time series. generate_series supplies every bucket in the window so
 * a quiet day renders as a zero-height bar instead of vanishing and letting the
 * chart silently compress.
 *
 * The edge buckets rarely line up with the window — weeks start on Monday, and
 * a rolling preset starts mid-day — so clicks are also bounded by the window
 * itself. Otherwise a custom range starting Sunday Mar 1 would count Feb 23–28,
 * and the chart would not add up to the cards above it. The series stops at the
 * bucket holding the window's last instant, since `to` is exclusive.
 */
export async function getSeries(
  workspaceId: string,
  window: Window,
  linkId?: string,
): Promise<SeriesPoint[]> {
  const step =
    window.bucket === "hour" ? "1 hour" : window.bucket === "week" ? "1 week" : "1 day";
  const linkFilter = linkId
    ? Prisma.sql`AND c."linkId" = ${linkId}`
    : Prisma.empty;

  const rows = await db.$queryRaw<
    Array<{ bucket: Date; clicks: bigint; uniques: bigint }>
  >`
    SELECT b.bucket,
           COUNT(c.id) AS clicks,
           COUNT(DISTINCT c."ipHash") AS uniques
    FROM generate_series(
           date_trunc(${window.bucket}, ${window.from}::timestamptz),
           date_trunc(${window.bucket}, ${window.to}::timestamptz - interval '1 microsecond'),
           ${step}::interval
         ) AS b(bucket)
    LEFT JOIN "LinkClick" c
      ON c."timestamp" >= b.bucket
     AND c."timestamp" < b.bucket + ${step}::interval
     AND c."timestamp" >= ${window.from}
     AND c."timestamp" < ${window.to}
     AND c."workspaceId" = ${workspaceId}
     AND c."isBot" = false
     ${linkFilter}
    GROUP BY b.bucket
    ORDER BY b.bucket
  `;

  return rows.map((row) => {
    const clicks = Number(row.clicks);
    const uniques = Number(row.uniques);
    return {
      clicks,
      unique: uniques,
      label: `${formatNumber(clicks)} clicks · ${formatNumber(uniques)} unique — ${bucketLabel(window.bucket, row.bucket)}`,
    };
  });
}

/** Axis ticks: five evenly spaced labels across the series. */
export async function getSeriesAxis(
  window: Window,
  points: number,
): Promise<string[]> {
  if (points === 0) return [];
  const formatter = window.bucket === "hour" ? HOUR : DAY_FMT;
  // Label the last instant inside the window: a custom range ending Sep 10
  // runs to midnight Sep 11, and its axis should not say Sep 11.
  const span = window.to.getTime() - 1 - window.from.getTime();
  return Array.from({ length: 5 }, (_, i) =>
    formatter.format(new Date(window.from.getTime() + (span * i) / 4)),
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brazil",
  US: "United States",
  PT: "Portugal",
  MX: "Mexico",
  DE: "Germany",
};

const COUNTRY_FLAGS: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  PT: "🇵🇹",
  MX: "🇲🇽",
  DE: "🇩🇪",
};

const DEVICE_LABELS: Record<string, string> = {
  MOBILE: "Mobile",
  DESKTOP: "Desktop",
  TABLET: "Tablet",
  UNKNOWN: "Unknown",
};

async function countriesFor(where: Prisma.LinkClickWhereInput) {
  const rows = await db.linkClick.groupBy({
    by: ["country"],
    where,
    _count: { _all: true },
  });
  return rows
    .filter((row) => row.country)
    .map((row) => ({
      label: COUNTRY_NAMES[row.country!] ?? row.country!,
      icon: COUNTRY_FLAGS[row.country!],
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

async function referrersFor(where: Prisma.LinkClickWhereInput) {
  const rows = await db.linkClick.groupBy({
    by: ["referrer"],
    where,
    _count: { _all: true },
  });
  return bucketReferrers(
    rows.map((row) => ({ referrer: row.referrer, count: row._count._all })),
  );
}

async function devicesFor(where: Prisma.LinkClickWhereInput) {
  const rows = await db.linkClick.groupBy({
    by: ["deviceType"],
    where,
    _count: { _all: true },
  });
  return rows
    .map((row) => ({
      label: DEVICE_LABELS[row.deviceType] ?? row.deviceType,
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

/** The three tabs on the dashboard's breakdown card, all sent at once. */
export async function getBreakdowns(workspaceId: string, window: Window) {
  const where = humanClicks(workspaceId, window);
  const [countries, referrers, devices] = await Promise.all([
    countriesFor(where),
    referrersFor(where),
    devicesFor(where),
  ]);

  return {
    countries: toItems(countries),
    referrers: toItems(referrers),
    devices: toItems(devices),
  };
}

/** The four panels shared by the link detail and workspace analytics screens. */
export async function getBreakdownPanels(
  workspaceId: string,
  window: Window,
  linkId?: string,
): Promise<BreakdownPanel[]> {
  const where = humanClicks(workspaceId, window, linkId);

  const [countries, referrers, deviceOs, browsers] = await Promise.all([
    countriesFor(where),
    referrersFor(where),
    db.linkClick.groupBy({
      by: ["deviceType", "os"],
      where,
      _count: { _all: true },
    }),
    db.linkClick.groupBy({ by: ["browser"], where, _count: { _all: true } }),
  ]);

  const deviceRows = deviceOs
    .map((row) => ({
      label: row.os
        ? `${DEVICE_LABELS[row.deviceType] ?? row.deviceType} · ${row.os}`
        : (DEVICE_LABELS[row.deviceType] ?? row.deviceType),
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const browserRows = browsers
    .filter((row) => row.browser)
    .map((row) => ({ label: row.browser!, count: row._count._all }))
    .sort((a, b) => b.count - a.count);

  return [
    { title: "Countries", color: "var(--color-accent)", rows: toItems(countries) },
    { title: "Referrers", color: "var(--color-ink)", rows: toItems(referrers) },
    { title: "Devices & OS", color: "var(--color-positive)", rows: toItems(deviceRows) },
    { title: "Browsers", color: "var(--color-warning)", rows: toItems(browserRows) },
  ];
}

export async function getTopLinks(
  workspaceId: string,
  limit = 6,
): Promise<TopLink[]> {
  const rows = await db.link.findMany({
    where: { ...liveLinks(workspaceId), status: "ACTIVE" },
    include: { domain: { select: { host: true } } },
    orderBy: { clickCount: "desc" },
    take: limit,
  });

  const max = rows[0]?.clickCount ?? 0;
  return rows.map((row) => ({
    slug: `${row.domain.host}/${row.slug}`,
    destinationUrl: row.destinationUrl.replace(/^https?:\/\//, ""),
    clicks: formatNumber(row.clickCount),
    pct: max === 0 ? 0 : Math.round((row.clickCount / max) * 100),
  }));
}

/** The dark card: biggest week-over-week mover. */
export async function getFastestGrowing(workspaceId: string) {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const twoWeeksAgo = new Date(now - 14 * 86_400_000);

  const [recent, prior] = await Promise.all([
    db.linkClick.groupBy({
      by: ["linkId"],
      where: { workspaceId, isBot: false, timestamp: { gte: weekAgo } },
      _count: { _all: true },
    }),
    db.linkClick.groupBy({
      by: ["linkId"],
      where: {
        workspaceId,
        isBot: false,
        timestamp: { gte: twoWeeksAgo, lt: weekAgo },
      },
      _count: { _all: true },
    }),
  ]);

  const priorBy = new Map(prior.map((row) => [row.linkId, row._count._all]));

  const ranked = recent
    .map((row) => {
      const before = priorBy.get(row.linkId) ?? 0;
      const growth = before === 0 ? Infinity : (row._count._all - before) / before;
      return { linkId: row.linkId, clicks: row._count._all, growth };
    })
    // A link with no prior traffic has infinite growth and no story to tell.
    .filter((row) => Number.isFinite(row.growth) && row.clicks > 0)
    .sort((a, b) => b.growth - a.growth);

  const winner = ranked[0];
  if (!winner) return null;

  const link = await db.link.findFirst({
    // A deleted link must not be featured, even if its old traffic grew.
    where: { id: winner.linkId, ...liveLinks(workspaceId) },
    include: { domain: { select: { host: true } } },
  });
  if (!link) return null;

  const topCountry = await db.linkClick.groupBy({
    by: ["country"],
    where: { workspaceId, linkId: link.id, isBot: false, timestamp: { gte: weekAgo } },
    _count: { _all: true },
  });
  const leader = topCountry
    .filter((row) => row.country)
    .sort((a, b) => b._count._all - a._count._all)[0];

  return {
    slug: `${link.domain.host}/${link.slug}`,
    clicks: formatNumber(winner.clicks),
    delta: `${winner.growth >= 0 ? "+" : ""}${Math.round(winner.growth * 100)}% vs. last week`,
    note: leader?.country
      ? `Top traffic from ${COUNTRY_NAMES[leader.country] ?? leader.country}.`
      : "Traffic spread across regions.",
  };
}

/** Clicks tracked in the current calendar month, for the usage meters. */
export async function getMonthlyClickUsage(workspaceId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.linkClick.count({
    where: { workspaceId, isBot: false, timestamp: { gte: monthStart } },
  });
}

/** Header facts for the dashboard: how many links are live, and whether any
 *  click has ever been recorded (which decides the empty state). */
export async function getDashboardOverview(workspaceId: string) {
  const [activeLinks, anyClick] = await Promise.all([
    db.link.count({ where: { ...liveLinks(workspaceId), status: "ACTIVE" } }),
    db.linkClick.findFirst({
      where: { workspaceId, isBot: false },
      select: { id: true },
    }),
  ]);
  return { activeLinks, hasClicks: anyClick !== null };
}

/**
 * Region and city panels (spec §11 asks for country, region and city).
 *
 * Both come from CDN headers the resolver reads — cf-region, cf-ipcity — so
 * they are empty in development and wherever no CDN sits in front. City is only
 * stored when the workspace's storeCityGeo toggle was on at click time.
 */
export async function getGeoPanels(
  workspaceId: string,
  window: Window,
  linkId?: string,
): Promise<BreakdownPanel[]> {
  const where = humanClicks(workspaceId, window, linkId);

  const [regions, cities] = await Promise.all([
    db.linkClick.groupBy({
      by: ["region", "country"],
      where: { ...where, region: { not: null } },
      _count: { _all: true },
    }),
    db.linkClick.groupBy({
      by: ["city", "country"],
      where: { ...where, city: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const rows = (
    list: Array<{ name: string | null; country: string | null; _count: { _all: number } }>,
  ) =>
    toItems(
      list
        .filter((row) => row.name)
        .map((row) => ({
          label: row.country ? `${row.name} · ${row.country}` : row.name!,
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    );

  return [
    {
      title: "Regions",
      color: "var(--color-dot-5)",
      rows: rows(regions.map((r) => ({ name: r.region, country: r.country, _count: r._count }))),
    },
    {
      title: "Cities",
      color: "var(--color-dot-2)",
      rows: rows(cities.map((c) => ({ name: c.city, country: c.country, _count: c._count }))),
    },
  ];
}
