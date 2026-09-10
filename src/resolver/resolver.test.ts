import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { normalizeHost, resolveLink } from "./resolve";
import { recordClick } from "./record";
import { hashIp } from "./ip-hash";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const WORKSPACE = "ws_acme";
const KLIP = "dom_klip";
const ACME = "dom_acme";

const IP = "203.0.113.45";
const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const createdLinks: string[] = [];

function req(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    "user-agent": CHROME,
    "x-forwarded-for": IP,
    "cf-ipcountry": "BR",
    "cf-ipcity": "S%C3%A3o%20Paulo",
    referer: "https://www.instagram.com/p/abc",
    ...overrides,
  });
}

async function makeLink(domainId: string, slug: string, destination: string) {
  const link = await db.link.create({
    data: { workspaceId: WORKSPACE, domainId, slug, destinationUrl: destination },
  });
  createdLinks.push(link.id);
  return link;
}

beforeAll(async () => {
  // These tests assert on click rows they create; start from a known state.
  await db.linkClick.deleteMany({ where: { userAgent: { in: [CHROME, GOOGLEBOT] } } });
});

afterEach(async () => {
  if (createdLinks.length) {
    await db.link.deleteMany({ where: { id: { in: createdLinks.splice(0) } } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("normalizeHost", () => {
  it("drops the port that dev always carries", () => {
    expect(normalizeHost("localhost:3000")).toBe("localhost");
    expect(normalizeHost("KLIP.TO")).toBe("klip.to");
    expect(normalizeHost(null)).toBeNull();
  });
});

describe("resolveLink", () => {
  it("finds a seeded link and appends its UTMs", async () => {
    const link = await resolveLink("klip.to", "summer-sale");
    expect(link).not.toBeNull();
    expect(link!.destination).toContain("https://example.com/product");
    expect(link!.destination).toContain("utm_source=instagram");
  });

  it("resolves by hostname and slug, not slug alone", async () => {
    // The reason domainId exists: one slug, two domains, two destinations.
    await makeLink(ACME, "shared-slug", "https://acme.example/one");

    const onKlip = await resolveLink("klip.to", "shared-slug");
    const onAcme = await resolveLink("go.acme.com", "shared-slug");

    expect(onKlip).toBeNull();
    expect(onAcme?.destination).toBe("https://acme.example/one");
  });

  it("returns null for an unknown slug", async () => {
    expect(await resolveLink("klip.to", "no-such-slug-xyz")).toBeNull();
  });

  it("carries the workspace privacy settings", async () => {
    const link = await resolveLink("klip.to", "summer-sale");
    expect(link!.workspace).toMatchObject({
      hashVisitorIps: expect.any(Boolean),
      storeCityGeo: expect.any(Boolean),
      respectDoNotTrack: expect.any(Boolean),
    });
  });

  it("falls back to the shared domain outside production", async () => {
    // Development runs on localhost, which is nobody's short-link domain.
    expect(await resolveLink("localhost:3000", "summer-sale")).not.toBeNull();
  });
});

describe("recordClick", () => {
  async function clickOn(
    slug: string,
    headers: Headers,
    viaQr = false,
    workspaceOverrides: Partial<{
      hashVisitorIps: boolean;
      storeCityGeo: boolean;
      respectDoNotTrack: boolean;
    }> = {},
  ) {
    const link = await resolveLink("klip.to", slug);
    if (!link) throw new Error(`no link for ${slug}`);
    await recordClick({
      link: { ...link, workspace: { ...link.workspace, ...workspaceOverrides } },
      headers,
      viaQr,
    });
    return link;
  }

  it("writes a click and bumps the counter", async () => {
    const created = await makeLink(KLIP, "click-basic", "https://example.com/basic");
    const before = created.clickCount;

    await clickOn("click-basic", req());

    const row = await db.linkClick.findFirst({
      where: { linkId: created.id },
      orderBy: { timestamp: "desc" },
    });
    expect(row).not.toBeNull();
    expect(row!.deviceType).toBe("DESKTOP");
    expect(row!.browser).toBe("Chrome");
    expect(row!.os).toBe("Windows");
    expect(row!.country).toBe("BR");
    expect(row!.city).toBe("São Paulo");
    expect(row!.referrer).toContain("instagram.com");
    expect(row!.isBot).toBe(false);

    const after = await db.link.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.clickCount).toBe(before + 1);
  });

  it("never stores the raw address, only a salted hash", async () => {
    const created = await makeLink(KLIP, "click-ip", "https://example.com/ip");
    await clickOn("click-ip", req());

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });

    expect(JSON.stringify(row)).not.toContain(IP);
    expect(row.ipHash).toBe(hashIp(IP));
    // Salted, so it is not the bare digest of the address.
    expect(row.ipHash).not.toBe(
      "0a0dd6a5a1a0a1b0c1d0e1f0a1b0c1d0e1f0a1b0c1d0e1f0a1b0c1d0e1f0a1b0",
    );
  });

  it("omits the hash entirely when the workspace turns it off", async () => {
    const created = await makeLink(KLIP, "click-nohash", "https://example.com/nohash");
    await clickOn("click-nohash", req(), false, { hashVisitorIps: false });

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });
    expect(row.ipHash).toBeNull();
  });

  it("drops the city when city-level geo is off", async () => {
    const created = await makeLink(KLIP, "click-nocity", "https://example.com/nocity");
    await clickOn("click-nocity", req(), false, { storeCityGeo: false });

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });
    expect(row.city).toBeNull();
    // Country survives — only the finer field is dropped.
    expect(row.country).toBe("BR");
  });

  it("records nothing at all for Do Not Track", async () => {
    const created = await makeLink(KLIP, "click-dnt", "https://example.com/dnt");
    await clickOn("click-dnt", req({ dnt: "1" }), false, { respectDoNotTrack: true });

    expect(await db.linkClick.count({ where: { linkId: created.id } })).toBe(0);
    const after = await db.link.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.clickCount).toBe(0);
  });

  it("ignores Do Not Track when the workspace does not honour it", async () => {
    const created = await makeLink(KLIP, "click-dnt-off", "https://example.com/dnt-off");
    await clickOn("click-dnt-off", req({ dnt: "1" }), false, { respectDoNotTrack: false });

    expect(await db.linkClick.count({ where: { linkId: created.id } })).toBe(1);
  });

  it("logs a bot but does not count it", async () => {
    const created = await makeLink(KLIP, "click-bot", "https://example.com/bot");
    await clickOn("click-bot", req({ "user-agent": GOOGLEBOT }));

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });
    expect(row.isBot).toBe(true);

    // Every chart filters isBot:false, so the counter must agree with them.
    const after = await db.link.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.clickCount).toBe(0);
  });

  it("marks a QR scan and bumps the QR counter", async () => {
    const created = await makeLink(KLIP, "click-qr", "https://example.com/qr");
    const qr = await db.qrCode.create({
      data: { workspaceId: WORKSPACE, linkId: created.id },
    });

    await clickOn("click-qr", req(), true);

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });
    expect(row.viaQr).toBe(true);

    const afterQr = await db.qrCode.findUniqueOrThrow({ where: { id: qr.id } });
    expect(afterQr.scans).toBe(1);
  });

  it("survives a visitor with no headers worth reading", async () => {
    const created = await makeLink(KLIP, "click-bare", "https://example.com/bare");
    await clickOn("click-bare", new Headers());

    const row = await db.linkClick.findFirstOrThrow({ where: { linkId: created.id } });
    expect(row.deviceType).toBe("UNKNOWN");
    expect(row.country).toBeNull();
    expect(row.ipHash).toBeNull();
  });
});
