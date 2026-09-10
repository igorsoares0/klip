import { db } from "@/lib/db";
import { relativeTime } from "@/shared/format";
import type { ProjectDot } from "@/lib/types";
import { NOT_DELETED } from "@/links/live";

export interface ProjectCard {
  id: string;
  name: string;
  description: string;
  links: number;
  clicks: number;
  dot: ProjectDot;
  updatedAt: string;
}

export async function listProjects(workspaceId: string): Promise<ProjectCard[]> {
  const rows = await db.project.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { links: { where: NOT_DELETED } } },
      links: { where: NOT_DELETED, select: { clickCount: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    links: row._count.links,
    clicks: row.links.reduce((sum, link) => sum + link.clickCount, 0),
    dot: row.color as ProjectDot,
    updatedAt: relativeTime(row.updatedAt),
  }));
}

export interface FolderNodeRow {
  id: string;
  name: string;
  count: number;
  depth: 0 | 1;
}

/**
 * Flattens the two-level folder tree into the ordered rows the panel renders:
 * a group, then its children. Group counts are link counts; leaf counts are the
 * clicks those links accumulated.
 */
export async function getFolderTree(
  workspaceId: string,
  projectId: string,
): Promise<FolderNodeRow[]> {
  const roots = await db.folder.findMany({
    where: { workspaceId, projectId, parentId: null },
    include: {
      _count: { select: { links: { where: NOT_DELETED } } },
      children: {
        include: { links: { where: NOT_DELETED, select: { clickCount: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return roots.flatMap((root) => [
    { id: root.id, name: root.name, count: root._count.links, depth: 0 as const },
    ...root.children.map((child) => ({
      id: child.id,
      name: child.name,
      count: child.links.reduce((sum, link) => sum + link.clickCount, 0),
      depth: 1 as const,
    })),
  ]);
}

/** Project + folder options for the create-link drawer. */
export async function listProjectOptions(workspaceId: string) {
  const [projects, folders] = await Promise.all([
    db.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.folder.findMany({
      where: { workspaceId, parentId: { not: null } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { projects, folders };
}
