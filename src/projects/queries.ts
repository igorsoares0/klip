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
  /** Live links in this folder. */
  count: number;
  depth: 0 | 1;
  parentId: string | null;
}

/**
 * Flattens the two-level folder tree into the ordered rows the panel renders:
 * a group, then its children.
 *
 * Both levels count links. The prototype's mock showed links on groups and
 * clicks on leaves ("Instagram 24", "video-01 5,120") — with real folders that
 * put two different units side by side in one column.
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
        include: { _count: { select: { links: { where: NOT_DELETED } } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return roots.flatMap((root) => [
    {
      id: root.id,
      name: root.name,
      count: root._count.links,
      depth: 0 as const,
      parentId: null,
    },
    ...root.children.map((child) => ({
      id: child.id,
      name: child.name,
      count: child._count.links,
      depth: 1 as const,
      parentId: root.id,
    })),
  ]);
}

export interface FolderOption {
  id: string;
  name: string;
  projectId: string | null;
  /** Set for subfolders, so the drawer can indent them under their parent. */
  parentId: string | null;
}

/**
 * Project + folder options for the create-link drawer. Folders carry their
 * project so the drawer can offer only the ones that belong to the chosen
 * project, in tree order: each root followed by its children.
 */
export async function listProjectOptions(workspaceId: string) {
  const [projects, folders] = await Promise.all([
    db.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.folder.findMany({
      where: { workspaceId },
      select: { id: true, name: true, projectId: true, parentId: true },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const roots = folders.filter((folder) => !folder.parentId);
  const ordered: FolderOption[] = roots.flatMap((root) => [
    root,
    ...folders.filter((folder) => folder.parentId === root.id),
  ]);

  return { projects, folders: ordered };
}
