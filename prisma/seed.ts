import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { links as mockLinks } from "../src/lib/mock/links";
import { projects as mockProjects, folderTree } from "../src/lib/mock/projects";
import { domains as mockDomains } from "../src/lib/mock/domains";
import { qrCodes as mockQrCodes } from "../src/lib/mock/qr";
import { apiKeys as mockApiKeys } from "../src/lib/mock/api-keys";
import { workspace as mockWorkspace, privacyToggles } from "../src/lib/mock/workspace";
import { rnd } from "../src/lib/rng";
import bcrypt from "bcryptjs";
import type { DeviceType } from "../src/generated/prisma/enums";

/**
 * Seeds the database with the fixtures the screens were designed against.
 *
 * Idempotent: every row uses a stable id and is upserted.
 *
 * The click events are generated *proportionally* to each link's designed click
 * count, and `Link.clickCount` is then derived from the rows actually written —
 * otherwise the links table and the detail chart would disagree.
 */

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const WORKSPACE_ID = "ws_acme";
const USER_ID = "usr_maria";

/** Development-only credentials, so credentials sign-in can be exercised. */
const DEV_EMAIL = "maria@acme.com";
const DEV_PASSWORD = process.env.SEED_PASSWORD ?? "klip-dev-password";

/**
 * A second account with an empty workspace and no purchase: what a brand-new
 * customer sees, and a second tenant to check that Acme's data never shows up
 * anywhere else.
 */
const SECOND = {
  userId: "usr_joao",
  email: "joao@globex.com",
  name: "João Silva",
  workspaceId: "ws_globex",
  workspaceName: "Globex",
  workspaceSlug: "globex",
};

/** Visitors revisit, so unique visitors land near 70% of clicks, as designed. */
const VISITOR_POOL = 0.72;

const toggle = (id: string) =>
  privacyToggles.find((t) => t.id === id)?.enabled ?? false;

/** Two links the QR screen references that are not in the links fixture. */
const EXTRA_LINKS = [
  { id: "link_menu_pdv", slug: "menu-pdv", title: "In-store menu", destinationUrl: "https://acme.com/menu", clicks: 900 },
  { id: "link_event_badge", slug: "event-badge", title: "Event badge", destinationUrl: "https://events.acme.com/badge", clicks: 340 },
];

/** Weighted so one country dominates, like the design's Brazil-heavy split. */
const COUNTRIES: Array<[string, number]> = [
  ["BR", 0.38],
  ["US", 0.23],
  ["PT", 0.15],
  ["MX", 0.14],
  ["DE", 0.1],
];

const REFERRERS: Array<[string | null, number]> = [
  ["instagram.com", 0.34],
  [null, 0.24], // direct
  ["google.com", 0.18],
  ["youtube.com", 0.13],
  ["facebook.com", 0.11],
];

const DEVICES: Array<[DeviceType, number]> = [
  ["MOBILE", 0.72],
  ["DESKTOP", 0.22],
  ["TABLET", 0.06],
];

const BROWSERS: Array<[string, number]> = [
  ["Chrome", 0.42],
  ["Safari", 0.33],
  ["Instagram in-app", 0.16],
  ["Edge", 0.06],
  ["Firefox", 0.03],
];

const OSES: Array<[string, number]> = [
  ["iOS", 0.4],
  ["Android", 0.32],
  ["macOS", 0.16],
  ["Windows", 0.12],
];

/** Picks from a weighted table using the seeded PRNG. */
function weighted<T>(table: Array<[T, number]>, roll: number): T {
  let acc = 0;
  for (const [value, weight] of table) {
    acc += weight;
    if (roll <= acc) return value;
  }
  return table[table.length - 1][0];
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  const user = await db.user.upsert({
    where: { id: USER_ID },
    // Re-seeding refreshes the password so the documented one always works.
    update: { passwordHash },
    create: {
      id: USER_ID,
      name: "Maria Rocha",
      email: DEV_EMAIL,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const workspace = await db.workspace.upsert({
    where: { id: WORKSPACE_ID },
    update: {},
    create: {
      id: WORKSPACE_ID,
      name: mockWorkspace.name,
      slug: mockWorkspace.slug,
      hashVisitorIps: toggle("hash-ips"),
      storeCityGeo: toggle("city-geo"),
      respectDoNotTrack: toggle("dnt"),
    },
  });

  await db.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
  });

  await seedSecondAccount(passwordHash);

  // klip.to is the shared system domain and belongs to no workspace.
  for (const domain of mockDomains) {
    const shared = domain.host === "klip.to";
    await db.customDomain.upsert({
      where: { id: domain.id },
      update: {},
      create: {
        id: domain.id,
        host: domain.host,
        note: domain.note,
        status: domain.status,
        workspaceId: shared ? null : workspace.id,
        verifiedAt: domain.status === "ACTIVE" ? new Date("2026-03-14") : null,
        verificationToken: domain.status === "PENDING_DNS" ? "klip-verify-9f2a" : null,
      },
    });
  }

  await db.workspace.update({
    where: { id: workspace.id },
    data: { defaultDomainId: "dom_klip" },
  });

  for (const project of mockProjects) {
    await db.project.upsert({
      where: { id: project.id },
      update: {},
      create: {
        id: project.id,
        workspaceId: workspace.id,
        name: project.name,
        description: project.description,
        color: project.dot,
      },
    });
  }

  // The tree is a flat list with a depth flag: a depth-0 row opens a group, and
  // every depth-1 row that follows belongs to it.
  let currentParent: string | null = null;
  for (const node of folderTree) {
    await db.folder.upsert({
      where: { id: node.id },
      update: {},
      create: {
        id: node.id,
        workspaceId: workspace.id,
        projectId: "prj_summer",
        name: node.name,
        parentId: node.depth === 0 ? null : currentParent,
      },
    });
    if (node.depth === 0) currentParent = node.id;
  }

  const ageInDays: Record<string, number> = {
    "2d ago": 2, "4d ago": 4, "6d ago": 6, "1w ago": 7, "2w ago": 14,
    "3w ago": 21, "1mo ago": 30, "2mo ago": 60, "5mo ago": 150,
  };

  for (const link of mockLinks) {
    const days = ageInDays[link.createdAt] ?? 30;
    await db.link.upsert({
      where: { id: link.id },
      update: {},
      create: {
        id: link.id,
        workspaceId: workspace.id,
        projectId: link.projectId,
        domainId: "dom_klip",
        slug: link.slug,
        destinationUrl: link.destinationUrl,
        title: link.title,
        status: link.status,
        createdAt: new Date(Date.now() - days * 86_400_000),
        utmSource: link.utm.source || null,
        utmMedium: link.utm.medium || null,
        utmCampaign: link.utm.campaign || null,
        utmTerm: link.utm.term || null,
        utmContent: link.utm.content || null,
      },
    });
  }

  for (const link of EXTRA_LINKS) {
    await db.link.upsert({
      where: { id: link.id },
      update: {},
      create: {
        id: link.id,
        slug: link.slug,
        title: link.title,
        destinationUrl: link.destinationUrl,
        workspaceId: workspace.id,
        domainId: "dom_klip",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 45 * 86_400_000),
      },
    });
  }

  for (const qr of mockQrCodes) {
    const link = await db.link.findFirst({
      where: { workspaceId: workspace.id, slug: qr.slug },
    });
    if (!link) continue;
    await db.qrCode.upsert({
      where: { id: qr.id },
      update: {},
      create: {
        id: qr.id,
        workspaceId: workspace.id,
        linkId: link.id,
        scans: qr.scans,
      },
    });
  }

  for (const key of mockApiKeys) {
    await db.apiKey.upsert({
      where: { id: key.id },
      update: {},
      create: {
        id: key.id,
        workspaceId: workspace.id,
        name: key.name,
        // Seed data only — a real key is hashed with Argon2id at creation and
        // is never recoverable.
        hashedKey: `seed$${key.id}`,
        keyPrefix: key.masked.startsWith("klip_test") ? "klip_test" : "klip_live",
        last4: key.masked.slice(-4),
        scope: key.scope,
        lastUsedAt: key.lastUsed === "Never used" ? null : new Date("2026-09-07"),
      },
    });
  }

  await db.entitlement.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      plan: "LIFETIME",
      status: "ACTIVE",
      paddleCustomerId: "ctm_01hxseed",
      paddleTransactionId: "txn_01hxseed",
      expiresAt: null,
    },
  });

  // --- Click events ------------------------------------------------------
  // Generated proportionally to each link's designed click count, so the links
  // table, the charts and the breakdowns all describe the same traffic.
  const existing = await db.linkClick.count({ where: { workspaceId: workspace.id } });
  if (existing === 0) {
    const next = rnd(30);
    const now = Date.now();

    const targets = [
      ...mockLinks.map((l) => ({ id: l.id, clicks: l.clicks })),
      ...EXTRA_LINKS.map((l) => ({ id: l.id, clicks: l.clicks })),
    ];

    for (const target of targets) {
      const visitors = Math.max(1, Math.round(target.clicks * VISITOR_POOL));
      const rows = Array.from({ length: target.clicks }, () => {
        // Newer links skew their traffic toward the recent end of the window.
        const daysAgo = Math.pow(next(), 1.4) * 30;
        return {
          linkId: target.id,
          workspaceId: workspace.id,
          timestamp: new Date(now - daysAgo * 86_400_000),
          // Drawing from a pool smaller than the click count is what makes
          // unique visitors land below total clicks.
          ipHash: `h_${Math.floor(next() * visitors).toString(36)}_${target.id}`,
          country: weighted(COUNTRIES, next()),
          city: null,
          referrer: weighted(REFERRERS, next()),
          deviceType: weighted(DEVICES, next()),
          browser: weighted(BROWSERS, next()),
          os: weighted(OSES, next()),
          viaQr: next() < 0.18,
          isBot: next() > 0.97,
        };
      });

      // Chunked: a single createMany with 12k rows exceeds the parameter limit.
      for (let i = 0; i < rows.length; i += 2000) {
        await db.linkClick.createMany({ data: rows.slice(i, i + 2000) });
      }
    }

    // Derive the denormalized counter from what was actually written.
    const grouped = await db.linkClick.groupBy({
      by: ["linkId"],
      where: { workspaceId: workspace.id, isBot: false },
      _count: { _all: true },
    });
    for (const row of grouped) {
      await db.link.update({
        where: { id: row.linkId },
        data: { clickCount: row._count._all },
      });
    }
  }

  const clicks = await db.linkClick.count({ where: { workspaceId: workspace.id, isBot: false } });
  const uniques = await db.linkClick.findMany({
    where: { workspaceId: workspace.id, isBot: false },
    distinct: ["ipHash"],
    select: { ipHash: true },
  });

  console.log(`Sign in with ${DEV_EMAIL} / ${DEV_PASSWORD}`);
  console.log(`  or, for an empty workspace, ${SECOND.email} / ${DEV_PASSWORD}`);
  console.log("Seeded:", {
    workspaces: await db.workspace.count(),
    domains: await db.customDomain.count(),
    projects: await db.project.count(),
    folders: await db.folder.count(),
    links: await db.link.count(),
    qrCodes: await db.qrCode.count(),
    apiKeys: await db.apiKey.count(),
    clicks,
    uniqueVisitors: uniques.length,
    uniqueRatio: `${Math.round((uniques.length / clicks) * 100)}%`,
  });
}

/** Only the account, its workspace and membership — deliberately nothing else. */
async function seedSecondAccount(passwordHash: string) {
  const user = await db.user.upsert({
    where: { id: SECOND.userId },
    update: { passwordHash },
    create: {
      id: SECOND.userId,
      name: SECOND.name,
      email: SECOND.email,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const workspace = await db.workspace.upsert({
    where: { id: SECOND.workspaceId },
    update: {},
    create: {
      id: SECOND.workspaceId,
      name: SECOND.workspaceName,
      slug: SECOND.workspaceSlug,
    },
  });

  await db.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
