import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { db } from "@/lib/db";
import { ensureQrCode, updateQrColors } from "./actions";
import { listQrCodes } from "./queries";
import { setTestSession, TEST_SESSION } from "../../vitest.setup";
import { GET } from "@/app/api/qr/[id]/route";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const WORKSPACE = "ws_acme";
const created: string[] = [];
const workspaces: string[] = [];

async function makeLink(slug: string, workspaceId = WORKSPACE) {
  const link = await db.link.create({
    data: { workspaceId, domainId: "dom_klip", slug, destinationUrl: "https://example.com/qr" },
  });
  created.push(link.id);
  return link;
}

function download(id: string, format: "png" | "svg") {
  return GET(new Request(`http://localhost/api/qr/${id}?format=${format}`), {
    params: Promise.resolve({ id }),
  });
}

afterEach(async () => {
  setTestSession(TEST_SESSION);
  if (created.length) await db.link.deleteMany({ where: { id: { in: created.splice(0) } } });
  if (workspaces.length) {
    await db.workspace.deleteMany({ where: { id: { in: workspaces.splice(0) } } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("ensureQrCode", () => {
  it("creates a code for a link that never had one", async () => {
    const link = await makeLink(`qr-new-${Date.now()}`);
    const result = await ensureQrCode(link.id);
    expect(result.ok).toBe(true);
    expect(await db.qrCode.count({ where: { linkId: link.id } })).toBe(1);
  });

  it("is idempotent", async () => {
    const link = await makeLink(`qr-idem-${Date.now()}`);
    const first = await ensureQrCode(link.id);
    const second = await ensureQrCode(link.id);

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.data.id).toBe(first.data.id);
    expect(await db.qrCode.count({ where: { linkId: link.id } })).toBe(1);
  });

  it("refuses a deleted link", async () => {
    const link = await makeLink(`qr-deleted-${Date.now()}`);
    await db.link.update({ where: { id: link.id }, data: { deletedAt: new Date() } });
    expect((await ensureQrCode(link.id)).ok).toBe(false);
  });

  it("refuses another workspace's link", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-qr-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await makeLink(`qr-theirs-${Date.now()}`, other.id);

    expect((await ensureQrCode(theirs.id)).ok).toBe(false);
    expect(await db.qrCode.count({ where: { linkId: theirs.id } })).toBe(0);
  });
});

describe("updateQrColors", () => {
  it("saves a scannable pair, normalised", async () => {
    const link = await makeLink(`qr-color-${Date.now()}`);
    const qr = await ensureQrCode(link.id);
    if (!qr.ok) throw new Error("setup");

    const result = await updateQrColors(qr.data.id, "#3B2FE8", "#FFF");
    expect(result).toMatchObject({ ok: true, data: { fg: "#3b2fe8", bg: "#ffffff" } });
  });

  it("refuses an unscannable pair even though the popover would have too", async () => {
    // A crafted POST skips the popover entirely.
    const link = await makeLink(`qr-bad-${Date.now()}`);
    const qr = await ensureQrCode(link.id);
    if (!qr.ok) throw new Error("setup");

    expect((await updateQrColors(qr.data.id, "#FFFFFF", "#000000")).ok).toBe(false);
    expect((await updateQrColors(qr.data.id, '#000"/><script>', "#FFFFFF")).ok).toBe(false);

    const row = await db.qrCode.findUniqueOrThrow({ where: { id: qr.data.id } });
    expect(row.fgColor).toBe("#15151A");
  });

  it("refuses another workspace's code", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-qc-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await makeLink(`qr-tc-${Date.now()}`, other.id);
    const qr = await db.qrCode.create({ data: { workspaceId: other.id, linkId: theirs.id } });

    expect((await updateQrColors(qr.id, "#3B2FE8", "#FFFFFF")).ok).toBe(false);
    const row = await db.qrCode.findUniqueOrThrow({ where: { id: qr.id } });
    expect(row.fgColor).toBe("#15151A");
  });
});

describe("listQrCodes", () => {
  it("renders a real SVG for every code", async () => {
    const codes = await listQrCodes(WORKSPACE);
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) expect(code.svg).toMatch(/^<svg/);
  });
});

describe("download route", () => {
  it("serves a PNG that decodes to the short link", async () => {
    const slug = `qr-dl-${Date.now()}`;
    const link = await makeLink(slug);
    const qr = await ensureQrCode(link.id);
    if (!qr.ok) throw new Error("setup");

    const response = await download(qr.data.id, "png");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toContain(`${slug}-qr.png`);

    const image = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
    const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
    expect(decoded?.data).toBe(`https://klip.to/${slug}?qr=1`);
  });

  it("serves an SVG", async () => {
    const link = await makeLink(`qr-svg-${Date.now()}`);
    const qr = await ensureQrCode(link.id);
    if (!qr.ok) throw new Error("setup");

    const response = await download(qr.data.id, "svg");
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    expect(await response.text()).toMatch(/^<svg/);
  });

  it("is a 404 for another workspace's code, never a download", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-dl-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await makeLink(`qr-tdl-${Date.now()}`, other.id);
    const qr = await db.qrCode.create({ data: { workspaceId: other.id, linkId: theirs.id } });

    expect((await download(qr.id, "png")).status).toBe(404);
  });

  it("is a 401 without a session", async () => {
    setTestSession(null);
    expect((await download("anything", "png")).status).toBe(401);
  });

  it("is a 404 once the link is deleted", async () => {
    const link = await makeLink(`qr-gone-${Date.now()}`);
    const qr = await ensureQrCode(link.id);
    if (!qr.ok) throw new Error("setup");
    await db.link.update({ where: { id: link.id }, data: { deletedAt: new Date() } });

    expect((await download(qr.data.id, "png")).status).toBe(404);
  });
});
