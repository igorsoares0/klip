import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { relativeTime } from "@/shared/format";
import type { LinkStatus, ProjectDot } from "@/lib/types";
import { liveLinks } from "./live";

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

export type LinkSort = "newest" | "oldest" | "clicks";
export type LinkStatusFilter = LinkStatus | "ALL";

export const PAGE_SIZE = 25;

export interface LinkListOptions {
  q?: string;
  status?: LinkStatusFilter;
  projectId?: string | null;
  sort?: LinkSort;
  /** 1-based. */
  page?: number;
  /** Overrides PAGE_SIZE; used by callers that want a short list. */
  take?: number;
}

export interface LinkListResult {
  rows: LinkRow[];
  /** Rows matching the filters, across all pages. */
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

const SORTS: Record<LinkSort, Prisma.LinkOrderByWithRelationInput[]> = {
  // Newest first by default. Ordering by clicks looked right against seed data,
  // where every link had thousands, but a link someone just made has zero and
  // sank to the bottom — the one thing they wanted to see was the one missing.
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  clicks: [{ clickCount: "desc" }, { createdAt: "desc" }],
};

function buildWhere(workspaceId: string, options: LinkListOptions): Prisma.LinkWhereInput {
  const where: Prisma.LinkWhereInput = liveLinks(workspaceId);

  if (options.status && options.status !== "ALL") where.status = options.status;
  if (options.projectId) where.projectId = options.projectId;

  const q = options.q?.trim();
  if (q) {
    // Always scoped by workspace, so even thousands of rows are a cheap scan.
    // pg_trgm is the upgrade if that stops being true.
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { destinationUrl: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

/** The links table: filtered, sorted and paginated, never including deleted rows. */
export async function listLinks(
  workspaceId: string,
  options: LinkListOptions = {},
): Promise<LinkListResult> {
  const pageSize = options.take ?? PAGE_SIZE;
  const where = buildWhere(workspaceId, options);

  const total = await db.link.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Clamp, so a stale ?page=9 after a delete lands on the last real page.
  const page = Math.min(Math.max(1, options.page ?? 1), pageCount);

  const rows = await db.link.findMany({
    where,
    include: {
      domain: { select: { host: true } },
      project: { select: { name: true, color: true } },
    },
    orderBy: SORTS[options.sort ?? "newest"],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    rows: rows.map((row) => ({
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
    })),
    total,
    page,
    pageCount,
    pageSize,
  };
}

export async function countLinksByStatus(workspaceId: string) {
  const rows = await db.link.groupBy({
    by: ["status"],
    where: liveLinks(workspaceId),
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
    where: { id, ...liveLinks(workspaceId) },
    include: { domain: { select: { host: true } } },
  });
}
