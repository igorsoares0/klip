import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./db";

/**
 * Integration tests — these hit the local Postgres from docker-compose.yml.
 * Run `npm run db:up && npx prisma migrate dev && npm run db:seed` first.
 */

const WORKSPACE_ID = "ws_acme";

afterAll(async () => {
  await db.$disconnect();
});

describe("seeded workspace", () => {
  it("has the fixtures the screens render", async () => {
    const [links, projects, domains, qrCodes] = await Promise.all([
      db.link.count({ where: { workspaceId: WORKSPACE_ID } }),
      db.project.count({ where: { workspaceId: WORKSPACE_ID } }),
      db.customDomain.count(),
      db.qrCode.count({ where: { workspaceId: WORKSPACE_ID } }),
    ]);

    expect(links).toBeGreaterThanOrEqual(9);
    expect(projects).toBe(5);
    expect(domains).toBe(3);
    expect(qrCodes).toBe(4);
  });

  it("keeps the shared domain outside any workspace", async () => {
    const shared = await db.customDomain.findUnique({ where: { host: "klip.to" } });
    expect(shared?.workspaceId).toBeNull();
  });

  it("nests the folder tree two levels deep", async () => {
    const instagram = await db.folder.findUnique({
      where: { id: "fld_ig" },
      include: { children: true },
    });
    expect(instagram?.parentId).toBeNull();
    expect(instagram?.children).toHaveLength(3);
  });
});

describe("slug uniqueness is scoped to the domain", () => {
  // This is the resolver's core rule (spec §8, §16), and the one the spec's own
  // Link entity had no column to express.
  const OTHER_DOMAIN = "dom_acme";

  it("rejects a duplicate slug on the same domain", async () => {
    await expect(
      db.link.create({
        data: {
          workspaceId: WORKSPACE_ID,
          domainId: "dom_klip",
          slug: "summer-sale",
          destinationUrl: "https://example.com/collision",
        },
      }),
    ).rejects.toThrow();
  });

  it("allows the same slug on a different domain", async () => {
    const created = await db.link.create({
      data: {
        workspaceId: WORKSPACE_ID,
        domainId: OTHER_DOMAIN,
        slug: "summer-sale",
        destinationUrl: "https://example.com/other-domain",
      },
    });

    expect(created.slug).toBe("summer-sale");
    expect(created.domainId).toBe(OTHER_DOMAIN);

    await db.link.delete({ where: { id: created.id } });
  });
});

describe("workspace isolation", () => {
  // Spec §23: never findLink(id) — always scope by workspaceId. A query for a
  // real link under the wrong workspace must come back empty, not leak.
  it("does not return a link when the workspace does not match", async () => {
    const link = await db.link.findFirst({ where: { workspaceId: WORKSPACE_ID } });
    expect(link).not.toBeNull();

    const leaked = await db.link.findFirst({
      where: { id: link!.id, workspaceId: "ws_someone_else" },
    });
    expect(leaked).toBeNull();
  });
});

describe("click events", () => {
  it("carries workspaceId so workspace analytics need no join", async () => {
    const clicks = await db.linkClick.count({ where: { workspaceId: WORKSPACE_ID } });
    expect(clicks).toBeGreaterThan(0);
  });

  it("can exclude bot traffic", async () => {
    const [all, human] = await Promise.all([
      db.linkClick.count({ where: { workspaceId: WORKSPACE_ID } }),
      db.linkClick.count({ where: { workspaceId: WORKSPACE_ID, isBot: false } }),
    ]);
    expect(human).toBeLessThan(all);
  });
});
