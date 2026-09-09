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
import type { DeviceType } from "../src/generated/prisma/enums";

/**
 * Seeds the database with exactly the fixtures the screens already render, so
 * swapping a screen from mock to DB is a like-for-like comparison.
 *
 * Idempotent: every row uses a stable id and is upserted.
 */

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const WORKSPACE_ID = "ws_acme";
const USER_ID = "usr_maria";

const toggle = (id: string) =>
  privacyToggles.find((t) => t.id === id)?.enabled ?? false;

/** Two links the QR screen references that are not in the links table fixture. */
const EXTRA_LINKS = [
  { id: "link_menu_pdv", slug: "menu-pdv", title: "In-store menu", destinationUrl: "https://acme.com/menu" },
  { id: "link_event_badge", slug: "event-badge", title: "Event badge", destinationUrl: "https://events.acme.com/badge" },
];

const DEVICES: DeviceType[] = ["MOBILE", "DESKTOP", "TABLET"];
const COUNTRIES = ["BR", "US", "PT", "MX", "DE"];
const REFERRERS = ["instagram.com", "google.com", null, "youtube.com", "facebook.com"];
const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox"];
const OSES = ["iOS", "Android", "macOS", "Windows"];

async function main() {
  const user = await db.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      name: "Maria Rocha",
      email: "maria@acme.com",
      emailVerified: new Date(),
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

  // Domains — klip.to is the shared system domain and belongs to no workspace.
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

  // The tree is a flat list with a depth flag: depth 0 opens a group, and every
  // depth-1 row that follows belongs to it.
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

  for (const link of mockLinks) {
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
        clickCount: link.clicks,
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
        ...link,
        workspaceId: workspace.id,
        domainId: "dom_klip",
        status: "ACTIVE",
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
        // never recoverable.
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

  // Click events spread over the last 30 days. Seeded PRNG so re-running
  // produces the same distribution.
  const existingClicks = await db.linkClick.count({
    where: { workspaceId: workspace.id },
  });
  if (existingClicks === 0) {
    const next = rnd(30);
    const allLinks = await db.link.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true },
    });
    const now = Date.now();
    const rows = Array.from({ length: 2000 }, () => {
      const link = allLinks[Math.floor(next() * allLinks.length)];
      const daysAgo = next() * 30;
      return {
        linkId: link.id,
        workspaceId: workspace.id,
        timestamp: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
        ipHash: `h_${Math.floor(next() * 1e9).toString(36)}`,
        country: COUNTRIES[Math.floor(next() * COUNTRIES.length)],
        city: null,
        referrer: REFERRERS[Math.floor(next() * REFERRERS.length)],
        deviceType: DEVICES[Math.floor(next() * DEVICES.length)],
        browser: BROWSERS[Math.floor(next() * BROWSERS.length)],
        os: OSES[Math.floor(next() * OSES.length)],
        isBot: next() > 0.96,
      };
    });
    await db.linkClick.createMany({ data: rows });
  }

  const counts = {
    workspaces: await db.workspace.count(),
    domains: await db.customDomain.count(),
    projects: await db.project.count(),
    folders: await db.folder.count(),
    links: await db.link.count(),
    qrCodes: await db.qrCode.count(),
    apiKeys: await db.apiKey.count(),
    clicks: await db.linkClick.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
