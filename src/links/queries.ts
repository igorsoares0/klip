import { db } from "@/lib/db";
import { relativeTime } from "@/shared/format";
import type { LinkStatus, ProjectDot } from "@/lib/types";

export interface LinkRow {
  id: string;
  slug: string;
  domain: string;
  title: string | null;
  destinationUrl: string;
  clicks: number;
  projectName: string | null;
  projectDot: ProjectDot | null;
  createdAt: string;
  status: LinkStatus;
  favicon: string;
}

/**
 * Decorative placeholder from the prototype, made deterministic so a link keeps
 * the same glyph across renders.
 * TODO: replace with a real favicon fetched from the destination host.
 */
const GLYPHS = ["◈", "◇", "◆"];
function glyphFor(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return GLYPHS[hash % GLYPHS.length];
}

/**
 * Newest first.
 *
 * Ordering by clickCount looked right against seed data, where every link had
 * thousands — but a link someone just made has zero clicks and sorts to the
 * bottom, so the one thing they want to see is the one thing missing. Sorting
 * by clicks is a choice the toolbar offers, not the default.
 */
export async function listLinks(workspaceId: string, take = 25): Promise<LinkRow[]> {
  const rows = await db.link.findMany({
    where: { workspaceId },
    include: {
      domain: { select: { host: true } },
      project: { select: { name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    domain: row.domain.host,
    title: row.title,
    destinationUrl: row.destinationUrl,
    clicks: row.clickCount,
    projectName: row.project?.name ?? null,
    projectDot: (row.project?.color ?? null) as ProjectDot | null,
    createdAt: relativeTime(row.createdAt),
    status: row.status,
    favicon: glyphFor(row.slug),
  }));
}

export async function countLinksByStatus(workspaceId: string) {
  const rows = await db.link.groupBy({
    by: ["status"],
    where: { workspaceId },
    _count: { _all: true },
  });
  const by = (status: LinkStatus) =>
    rows.find((row) => row.status === status)?._count._all ?? 0;

  return {
    active: by("ACTIVE"),
    paused: by("PAUSED"),
    archived: by("ARCHIVED"),
    total: rows.reduce((sum, row) => sum + row._count._all, 0),
  };
}

/** Always scoped by workspace — spec §23 forbids looking a link up by id alone. */
export async function getLink(workspaceId: string, id: string) {
  return db.link.findFirst({
    where: { id, workspaceId },
    include: { domain: { select: { host: true } } },
  });
}
