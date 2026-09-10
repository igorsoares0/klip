import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  checkSlugAvailability,
  createLink,
  deleteLink,
  getEditableLink,
  setLinkStatus,
  updateLink,
} from "./actions";
import { countLinksByStatus, getLink, listLinks } from "./queries";
import { parseLinkListParams } from "./params";
import { getTopLinks } from "@/analytics/queries";
import { listProjects } from "@/projects/queries";
import { listQrCodes } from "@/qr/queries";
import { listDomains } from "@/domains/queries";
import { resolveLink } from "@/resolver/resolve";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const WORKSPACE = "ws_acme";
const KLIP = "dom_klip";
const created: string[] = [];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function makeLink(slug: string, extra: Record<string, string> = {}) {
  const result = await createLink(
    form({ destination: "https://example.com/p3", slug, domainId: KLIP, ...extra }),
  );
  if (!result.ok) throw new Error(`setup failed for ${slug}: ${result.error}`);
  created.push(result.data.id);
  return result.data.id;
}

afterEach(async () => {
  if (created.length) {
    // Hard delete in teardown only — the product never does this.
    await db.link.deleteMany({ where: { id: { in: created.splice(0) } } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("soft delete", () => {
  it("removes the link from every link-level surface", async () => {
    // The failure mode of soft delete is a query that forgets the filter. This
    // walks every surface that shows links, rather than trusting each one.
    const id = await makeLink(`p3-gone-${Date.now()}`, {
      projectId: "prj_summer",
      generateQr: "on",
    });
    await db.link.update({ where: { id }, data: { clickCount: 99_999_999 } });

    const before = await countLinksByStatus(WORKSPACE);
    const domainBefore = (await listDomains(WORKSPACE)).find((d) => d.id === KLIP)!.links;
    expect((await deleteLink(id)).ok).toBe(true);

    const [list, after, top, projects, qrs, domains, detail] = await Promise.all([
      listLinks(WORKSPACE, { take: 500 }),
      countLinksByStatus(WORKSPACE),
      getTopLinks(WORKSPACE, 50),
      listProjects(WORKSPACE),
      listQrCodes(WORKSPACE),
      listDomains(WORKSPACE),
      getLink(WORKSPACE, id),
    ]);

    expect(list.rows.some((row) => row.id === id)).toBe(false);
    expect(after.total).toBe(before.total - 1);
    // It had the highest click count in the workspace; it must not be "top".
    expect(top.some((row) => row.clicks === "99,999,999")).toBe(false);
    expect(projects.find((p) => p.id === "prj_summer")?.clicks).toBeLessThan(99_999_999);
    expect(qrs.every((qr) => !qr.slug.startsWith("p3-gone-"))).toBe(true);
    // The domain's link count must drop by one, not just the domain exist.
    expect(domains.find((d) => d.id === KLIP)!.links).toBe(domainBefore - 1);
    expect(detail).toBeNull();
  });

  it("keeps the row, so the history survives", async () => {
    const id = await makeLink(`p3-keep-${Date.now()}`);
    await deleteLink(id);

    const row = await db.link.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.deletedAt).not.toBeNull();
  });

  it("keeps the slug reserved forever", async () => {
    // The reason for soft delete: a printed QR must never be taken over.
    const slug = `p3-reserved-${Date.now()}`;
    const id = await makeLink(slug);
    await deleteLink(id);

    const availability = await checkSlugAvailability(KLIP, slug);
    expect(availability.available).toBe(false);

    const retry = await createLink(
      form({ destination: "https://evil.example", slug, domainId: KLIP }),
    );
    expect(retry.ok).toBe(false);
  });

  it("answers 410 at the resolver", async () => {
    const slug = `p3-410-${Date.now()}`;
    const id = await makeLink(slug);
    await deleteLink(id);

    const resolved = await resolveLink("klip.to", slug);
    expect(resolved?.deleted).toBe(true);
  });

  it("cannot delete twice, or be edited once deleted", async () => {
    const id = await makeLink(`p3-twice-${Date.now()}`);
    await deleteLink(id);

    expect((await deleteLink(id)).ok).toBe(false);
    expect(
      (await updateLink(id, form({ destination: "https://example.com/x" }))).ok,
    ).toBe(false);
    expect(await getEditableLink(id)).toBeNull();
  });
});

describe("updateLink", () => {
  it("changes the destination and what the resolver sends people to", async () => {
    const slug = `p3-edit-${Date.now()}`;
    const id = await makeLink(slug);

    const result = await updateLink(
      id,
      form({ destination: "https://example.com/new-target", title: "Renamed" }),
    );
    expect(result.ok).toBe(true);

    const resolved = await resolveLink("klip.to", slug);
    expect(resolved?.destination).toBe("https://example.com/new-target");
  });

  it("ignores a slug in the form — slugs are immutable", async () => {
    const slug = `p3-immutable-${Date.now()}`;
    const id = await makeLink(slug);

    await updateLink(
      id,
      form({ destination: "https://example.com/y", slug: "hijacked-slug" }),
    );

    const row = await db.link.findUniqueOrThrow({ where: { id } });
    expect(row.slug).toBe(slug);
  });

  it("validates the destination", async () => {
    const id = await makeLink(`p3-bad-${Date.now()}`);
    const result = await updateLink(id, form({ destination: "not a url" }));
    expect(result.ok).toBe(false);
  });

  it("refuses another workspace's link", async () => {
    const other = await db.workspace.create({
      data: { name: "Other", slug: `other-p3-${Date.now()}` },
    });
    const theirs = await db.link.create({
      data: {
        workspaceId: other.id,
        domainId: KLIP,
        slug: `theirs-${Date.now()}`,
        destinationUrl: "https://theirs.example",
      },
    });

    try {
      expect(
        (await updateLink(theirs.id, form({ destination: "https://mine.example" }))).ok,
      ).toBe(false);
      expect((await setLinkStatus(theirs.id, "PAUSED")).ok).toBe(false);
      expect((await deleteLink(theirs.id)).ok).toBe(false);

      const row = await db.link.findUniqueOrThrow({ where: { id: theirs.id } });
      expect(row.destinationUrl).toBe("https://theirs.example");
      expect(row.status).toBe("ACTIVE");
      expect(row.deletedAt).toBeNull();
    } finally {
      await db.workspace.delete({ where: { id: other.id } });
    }
  });
});

describe("setLinkStatus", () => {
  it("pauses and resumes", async () => {
    const id = await makeLink(`p3-pause-${Date.now()}`);

    await setLinkStatus(id, "PAUSED");
    expect((await db.link.findUniqueOrThrow({ where: { id } })).status).toBe("PAUSED");

    await setLinkStatus(id, "ACTIVE");
    expect((await db.link.findUniqueOrThrow({ where: { id } })).status).toBe("ACTIVE");
  });

  it("refuses a status that is not one of the three", async () => {
    const id = await makeLink(`p3-status-${Date.now()}`);
    expect((await setLinkStatus(id, "DELETED")).ok).toBe(false);
    expect((await setLinkStatus(id, "active")).ok).toBe(false);
  });
});

describe("listLinks filtering", () => {
  it("searches slug, title and destination, case-insensitively", async () => {
    const tag = `zqx${Date.now()}`;
    const bySlug = await makeLink(`${tag}-slug`);
    const byTitle = await makeLink(`p3-t-${Date.now()}`, { title: `Title ${tag.toUpperCase()}` });
    const byDest = await makeLink(`p3-d-${Date.now()}`, {
      destination: `https://example.com/${tag}`,
    });

    const found = await listLinks(WORKSPACE, { q: tag, take: 50 });
    const ids = found.rows.map((row) => row.id);

    expect(ids).toEqual(expect.arrayContaining([bySlug, byTitle, byDest]));
    expect(found.total).toBe(3);
  });

  it("filters by status", async () => {
    const paused = await makeLink(`p3-only-paused-${Date.now()}`);
    await setLinkStatus(paused, "PAUSED");

    const list = await listLinks(WORKSPACE, { status: "PAUSED", take: 200 });
    expect(list.rows.every((row) => row.status === "PAUSED")).toBe(true);
    expect(list.rows.some((row) => row.id === paused)).toBe(true);
  });

  it("filters by project", async () => {
    const list = await listLinks(WORKSPACE, { projectId: "prj_summer", take: 200 });
    const rows = await db.link.findMany({
      where: { id: { in: list.rows.map((r) => r.id) } },
      select: { projectId: true },
    });
    expect(rows.every((row) => row.projectId === "prj_summer")).toBe(true);
  });

  it("sorts by clicks when asked", async () => {
    const list = await listLinks(WORKSPACE, { sort: "clicks", take: 10 });
    const clicks = list.rows.map((row) => row.clicks);
    expect([...clicks].sort((a, b) => b - a)).toEqual(clicks);
  });

  it("paginates without overlap", async () => {
    const [first, second] = await Promise.all([
      listLinks(WORKSPACE, { take: 3, page: 1 }),
      listLinks(WORKSPACE, { take: 3, page: 2 }),
    ]);
    const a = first.rows.map((r) => r.id);
    const b = second.rows.map((r) => r.id);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
    expect(first.pageCount).toBe(Math.ceil(first.total / 3));
  });

  it("clamps a page past the end to the last page", async () => {
    // A stale ?page=999 after deleting links must not render an empty table.
    const list = await listLinks(WORKSPACE, { take: 3, page: 999 });
    expect(list.page).toBe(list.pageCount);
    expect(list.rows.length).toBeGreaterThan(0);
  });
});

describe("parseLinkListParams", () => {
  it("falls back to safe defaults for anything unrecognised", () => {
    expect(
      parseLinkListParams({ status: "bogus", sort: "sideways", page: "-4" }),
    ).toEqual({ q: "", status: "ALL", projectId: null, sort: "newest", page: 1 });
  });

  it("accepts the real values, case-insensitively for status", () => {
    expect(
      parseLinkListParams({ q: "sale", status: "paused", sort: "clicks", page: "3", project: "prj_x" }),
    ).toEqual({ q: "sale", status: "PAUSED", projectId: "prj_x", sort: "clicks", page: 3 });
  });

  it("caps an absurdly long query", () => {
    expect(parseLinkListParams({ q: "a".repeat(5000) }).q).toHaveLength(100);
  });
});
