import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { setTestSession, TEST_SESSION } from "../../vitest.setup";
import { GET } from "@/app/api/analytics/export/route";
import { getGeoPanels, getSeries, getSeriesAxis } from "./queries";
import { resolveWindow } from "./range";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const WORKSPACE = "ws_acme";
const MARK = `export-test-${Date.now()}`;
const links: string[] = [];
const workspaces: string[] = [];

/**
 * A single day long before the seed's clicks, so the export is a handful of
 * rows rather than 45 thousand. Assertions still only count rows carrying MARK:
 * this database is also where people click links by hand.
 */
const DAY_ISO = "2025-06-02";
const WINDOW = `range=custom&from=${DAY_ISO}&to=${DAY_ISO}`;

function exportCsv(query = WINDOW) {
  return GET(new Request(`http://localhost/api/analytics/export?${query}`));
}

async function clickOn(
  linkId: string,
  workspaceId: string,
  extra: Partial<Prisma.LinkClickUncheckedCreateInput> = {},
) {
  await db.linkClick.create({
    data: {
      linkId,
      workspaceId,
      timestamp: new Date(`${DAY_ISO}T12:00:00Z`),
      ipHash: "SECRET_HASH_MUST_NOT_LEAK",
      userAgent: "SECRET_UA_MUST_NOT_LEAK",
      country: "BR",
      region: "SP",
      city: "São Paulo",
      referrer: "https://www.instagram.com/",
      deviceType: "MOBILE",
      browser: "Safari",
      os: "iOS",
      ...extra,
    },
  });
}

let linkId: string;
/** The toggle is flipped below; put back whatever it was, not a guess. */
let storedCityGeo: boolean;

beforeAll(async () => {
  storedCityGeo = (await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } })).storeCityGeo;

  const link = await db.link.create({
    data: { workspaceId: WORKSPACE, domainId: "dom_klip", slug: MARK, destinationUrl: "https://example.com/e" },
  });
  links.push(link.id);
  linkId = link.id;

  await clickOn(linkId, WORKSPACE);
  await clickOn(linkId, WORKSPACE, { referrer: '=HYPERLINK("http://evil","x")' });
  await clickOn(linkId, WORKSPACE, { isBot: true, referrer: "BOT_ROW" });
});

afterEach(() => {
  setTestSession(TEST_SESSION);
});

afterAll(async () => {
  // Clicks cascade with their link.
  await db.link.deleteMany({ where: { id: { in: links } } });
  await db.workspace.deleteMany({ where: { id: { in: workspaces } } });
  await db.workspace.update({ where: { id: WORKSPACE }, data: { storeCityGeo: storedCityGeo } });
  await db.$disconnect();
});

describe("export", () => {
  it("is a CSV download for the requested period", async () => {
    const response = await exportCsv();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    // A one-day range names that day at both ends, not the exclusive day after.
    expect(response.headers.get("content-disposition")).toContain(
      `klip-clicks-${DAY_ISO}-to-${DAY_ISO}.csv`,
    );
  });

  it("never contains the visitor hash or user agent", async () => {
    // ipHash identifies the same visitor across rows. It does not leave.
    const body = await (await exportCsv()).text();
    expect(body).not.toContain("SECRET_HASH_MUST_NOT_LEAK");
    expect(body).not.toContain("SECRET_UA_MUST_NOT_LEAK");
    expect(body.split("\r\n")[0]).not.toMatch(/ip|hash|user_?agent/i);
  });

  it("leaves bots out, so the file matches the screens", async () => {
    const body = await (await exportCsv()).text();
    expect(body).not.toContain("BOT_ROW");
    const dataRows = body.split("\r\n").filter((line) => line.includes(MARK));
    expect(dataRows).toHaveLength(2);
  });

  it("neutralises a formula smuggled in through the referrer", async () => {
    const body = await (await exportCsv()).text();
    expect(body).toContain(`"'=HYPERLINK(`);
    expect(body).not.toMatch(/(^|,)=HYPERLINK/m);
  });

  it("includes the city column only while city-level geo is stored", async () => {
    await db.workspace.update({ where: { id: WORKSPACE }, data: { storeCityGeo: true } });
    const on = await (await exportCsv()).text();
    expect(on.split("\r\n")[0]).toContain("city");
    expect(on).toContain("São Paulo");

    await db.workspace.update({ where: { id: WORKSPACE }, data: { storeCityGeo: false } });
    const off = await (await exportCsv()).text();
    expect(off.split("\r\n")[0]).not.toContain("city");
    expect(off).not.toContain("São Paulo");
  });

  it("is a 401 without a session", async () => {
    setTestSession(null);
    expect((await exportCsv()).status).toBe(401);
  });

  it("only ever contains the caller's workspace", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-ex-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await db.link.create({
      data: { workspaceId: other.id, domainId: "dom_klip", slug: `theirs-${MARK}`, destinationUrl: "https://t.example" },
    });
    links.push(theirs.id);
    await clickOn(theirs.id, other.id, { referrer: "OTHER_TENANT_ROW" });

    const body = await (await exportCsv()).text();
    expect(body).not.toContain("OTHER_TENANT_ROW");
  });
});

describe("analytics queries", () => {
  it("shows region and city when they were recorded", async () => {
    const window = resolveWindow({ range: "custom", from: DAY_ISO, to: DAY_ISO });
    const [regions, cities] = await getGeoPanels(WORKSPACE, window);
    expect(regions.rows.some((row) => row.label === "SP · BR")).toBe(true);
    expect(cities.rows.some((row) => row.label === "São Paulo · BR")).toBe(true);
  });

  it("buckets a long custom range by week", async () => {
    const window = resolveWindow({ range: "custom", from: "2026-01-05", to: "2026-06-28" });
    const series = await getSeries(WORKSPACE, window);
    // 25 weeks, not 175 daily bars the chart could not draw.
    expect(series.length).toBeGreaterThanOrEqual(25);
    expect(series.length).toBeLessThanOrEqual(27);
    expect(series[0].label).toMatch(/Week of/);
  });

  it("gives an inclusive custom range one bar per day, and no extra one", async () => {
    const window = resolveWindow({ range: "custom", from: "2026-09-01", to: "2026-09-05" });
    const series = await getSeries(WORKSPACE, window);
    expect(series).toHaveLength(5);
    expect(series.at(-1)!.label).toMatch(/Sep 5$/);
    expect(await getSeriesAxis(window, series.length)).toEqual(
      expect.arrayContaining(["Sep 1", "Sep 5"]),
    );
    expect(await getSeriesAxis(window, series.length)).not.toContain("Sep 6");
  });

  it("adds up to the clicks in the window even when weeks overhang it", async () => {
    // Sunday to Thursday: both edge weeks extend past the range. Clicks on the
    // overhang are real and must not be counted.
    const window = resolveWindow({ range: "custom", from: "2026-05-03", to: "2026-09-10" });
    expect(window.bucket).toBe("week");
    const series = await getSeries(WORKSPACE, window);
    const charted = series.reduce((sum, point) => sum + point.clicks, 0);
    const inWindow = await db.linkClick.count({
      where: { workspaceId: WORKSPACE, isBot: false, timestamp: { gte: window.from, lt: window.to } },
    });
    expect(charted).toBe(inWindow);
  });

  it("does not count clicks just outside a custom range", async () => {
    // The fixture clicks sit on Monday Jun 2 2025 — the first day of a week.
    // Both ranges are long enough to be weekly, and one ends the day before
    // while the other starts the day after, so each has an edge week
    // containing Jun 2.
    const total = async (from: string, to: string) => {
      const series = await getSeries(WORKSPACE, resolveWindow({ range: "custom", from, to }));
      return series.reduce((sum, point) => sum + point.clicks, 0);
    };
    expect(await total("2025-02-01", "2025-06-01")).toBe(0);
    expect(await total("2025-06-03", "2025-09-20")).toBe(0);
    // And the day itself does count, so the zeros above mean something.
    expect(await total("2025-03-01", "2025-06-02")).toBe(2);
  });
});
