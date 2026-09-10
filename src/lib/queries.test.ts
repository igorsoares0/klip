import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./db";
import { resolveWindow } from "@/analytics/range";
import { getBreakdowns, getSeries, getTopLinks } from "@/analytics/queries";
import { countLinksByStatus, getLink, listLinks } from "@/links/queries";
import { listProjects } from "@/projects/queries";
import { listQrCodes } from "@/qr/queries";
import { listApiKeys } from "@/api-keys/queries";
import { listDomains } from "@/domains/queries";

/**
 * Integration tests against the local Postgres. Run `npm run db:up` and
 * `npm run db:seed` first.
 */

const WORKSPACE = "ws_acme";
const STRANGER = "ws_not_ours";

afterAll(async () => {
  await db.$disconnect();
});

describe("workspace isolation", () => {
  // Spec §23. Every listing query takes workspaceId, so the compiler forces the
  // caller to say whose data they want — these assert it is actually honoured.
  it("returns nothing for a workspace that owns nothing", async () => {
    const [links, projects, qrCodes, apiKeys, topLinks] = await Promise.all([
      (await listLinks(STRANGER)).rows,
      listProjects(STRANGER),
      listQrCodes(STRANGER),
      listApiKeys(STRANGER),
      getTopLinks(STRANGER),
    ]);

    expect(links).toEqual([]);
    expect(projects).toEqual([]);
    expect(qrCodes).toEqual([]);
    expect(apiKeys).toEqual([]);
    expect(topLinks).toEqual([]);
  });

  it("does not hand a real link to the wrong workspace", async () => {
    const mine = (await listLinks(WORKSPACE, { take: 1 })).rows;
    expect(mine).toHaveLength(1);

    expect(await getLink(WORKSPACE, mine[0].id)).not.toBeNull();
    expect(await getLink(STRANGER, mine[0].id)).toBeNull();
  });

  it("counts zero links for a stranger", async () => {
    const counts = await countLinksByStatus(STRANGER);
    expect(counts).toEqual({ active: 0, paused: 0, archived: 0, total: 0 });
  });

  it("still exposes the shared domain, which nobody owns", async () => {
    // klip.to has a null workspaceId by design, so it must show up for any
    // workspace — this is the one intentional exception to the rule above.
    const domains = await listDomains(STRANGER);
    expect(domains.map((d) => d.host)).toContain("klip.to");
  });
});

describe("listLinks", () => {
  it("reports counts that match the denormalized counter", async () => {
    const links = (await listLinks(WORKSPACE, { take: 3 })).rows;
    for (const link of links) {
      const actual = await db.linkClick.count({
        where: { linkId: link.id, isBot: false },
      });
      expect(link.clicks).toBe(actual);
    }
  });

  it("gives a link the same favicon glyph on every call", async () => {
    const [first, second] = await Promise.all([
      (await listLinks(WORKSPACE, { take: 5 })).rows,
      (await listLinks(WORKSPACE, { take: 5 })).rows,
    ]);
    expect(first.map((l) => l.favicon)).toEqual(second.map((l) => l.favicon));
  });
});

describe("getSeries", () => {
  it("emits one point per day across the window, gaps included", async () => {
    const window = resolveWindow("7d");
    const series = await getSeries(WORKSPACE, window);

    // generate_series is inclusive of both ends, so a 7-day window yields 8.
    expect(series).toHaveLength(8);
    expect(series.every((point) => Number.isFinite(point.clicks))).toBe(true);
  });

  it("buckets by hour for the 24h range", async () => {
    const series = await getSeries(WORKSPACE, resolveWindow("24h"));
    expect(series).toHaveLength(25);
  });

  it("returns all-zero points for a workspace with no traffic", async () => {
    const series = await getSeries(STRANGER, resolveWindow("7d"));
    expect(series).toHaveLength(8);
    expect(series.every((point) => point.clicks === 0)).toBe(true);
  });

  it("scopes to a single link when given one", async () => {
    // It needs a link with traffic, so ask for one — the default order is
    // newest-first, and the newest link may have none.
    const [link] = (await listLinks(WORKSPACE, { take: 1, sort: "clicks" })).rows;
    const [all, one] = await Promise.all([
      getSeries(WORKSPACE, resolveWindow("30d")),
      getSeries(WORKSPACE, resolveWindow("30d"), link.id),
    ]);
    const sum = (points: Array<{ clicks: number }>) =>
      points.reduce((total, point) => total + point.clicks, 0);
    expect(sum(one)).toBeLessThan(sum(all));
    expect(sum(one)).toBeGreaterThan(0);
  });
});

describe("getBreakdowns", () => {
  it("ranks each dimension with the leader at 100%", async () => {
    const window = resolveWindow("30d");
    const { countries, referrers, devices } = await getBreakdowns(WORKSPACE, window);

    for (const rows of [countries, referrers, devices]) {
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].pct).toBe(100);
      // Percentages are relative to the leader, so they only descend.
      const pcts = rows.map((row) => row.pct);
      expect([...pcts].sort((a, b) => b - a)).toEqual(pcts);
    }
  });

  it("shows referrers as buckets, never raw hostnames", async () => {
    const { referrers } = await getBreakdowns(WORKSPACE, resolveWindow("30d"));
    for (const row of referrers) {
      expect(row.label).not.toMatch(/\./);
    }
  });
});

describe("listLinks ordering", () => {
  it("puts the newest link first, even with no clicks", async () => {
    // Ordering by clickCount hid freshly created links behind the seed data.
    const created = await db.link.create({
      data: {
        workspaceId: WORKSPACE,
        domainId: "dom_klip",
        slug: `order-check-${Date.now()}`,
        destinationUrl: "https://example.com/order",
      },
    });

    try {
      const listed = (await listLinks(WORKSPACE)).rows;
      expect(listed[0]?.id).toBe(created.id);
      expect(listed[0]?.clicks).toBe(0);
    } finally {
      await db.link.delete({ where: { id: created.id } });
    }
  });
});
