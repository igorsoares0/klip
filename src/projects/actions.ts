"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, text, type ActionResult } from "@/shared/action";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { NOT_DELETED } from "@/links/live";

/**
 * Projects and folders (spec §14).
 *
 * Unlike links, projects are deleted for real: a project appears in no URL and
 * no printed QR code, so removing one breaks nothing outside the app. The links
 * inside survive — Link.projectId and Link.folderId are SetNull — and keep
 * redirecting. Folders go with their project (Folder.project is Cascade).
 */

const MAX_NAME = 60;
const MAX_DESCRIPTION = 200;

function revalidate() {
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/links");
}

function readProject(form: FormData) {
  const name = text(form, "name");
  const description = text(form, "description");
  const color = Number.parseInt(text(form, "color") || "1", 10);

  if (!name) return { error: "Give the project a name." } as const;
  if (name.length > MAX_NAME) return { error: `Keep the name under ${MAX_NAME} characters.` } as const;
  if (description.length > MAX_DESCRIPTION) {
    return { error: `Keep the description under ${MAX_DESCRIPTION} characters.` } as const;
  }
  // 1–6 index the accent dots in the design tokens.
  if (!Number.isInteger(color) || color < 1 || color > 6) {
    return { error: "Pick one of the six colours." } as const;
  }

  return { name, description: description || null, color } as const;
}

export async function createProject(form: FormData): Promise<ActionResult<{ id: string }>> {
  const workspaceId = await getCurrentWorkspaceId();
  const input = readProject(form);
  if ("error" in input) return fail(input.error!, "name");

  const project = await db.project.create({
    data: { workspaceId, ...input },
    select: { id: true },
  });

  revalidate();
  return ok(project);
}

export async function updateProject(
  id: string,
  form: FormData,
): Promise<ActionResult<{ id: string }>> {
  const workspaceId = await getCurrentWorkspaceId();
  const input = readProject(form);
  if ("error" in input) return fail(input.error!, "name");

  const result = await db.project.updateMany({
    where: { id, workspaceId },
    data: input,
  });
  if (result.count === 0) return fail("That project no longer exists.", "form");

  revalidate();
  return ok({ id });
}

export async function deleteProject(
  id: string,
): Promise<ActionResult<{ movedLinks: number }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const project = await db.project.findFirst({
    where: { id, workspaceId },
    // Live links only: the count is what the confirmation shows, and deleted
    // links are not something the user can see.
    select: { id: true, _count: { select: { links: { where: NOT_DELETED } } } },
  });
  if (!project) return fail("That project no longer exists.", "form");

  // One statement: the database nulls the links' projectId/folderId and
  // cascades the folders away.
  await db.project.delete({ where: { id: project.id } });

  revalidate();
  revalidatePath("/dashboard");
  return ok({ movedLinks: project._count.links });
}

function readFolderName(value: string): string | { error: string } {
  const name = value.trim();
  if (!name) return { error: "Give the folder a name." };
  if (name.length > MAX_NAME) return { error: `Keep the name under ${MAX_NAME} characters.` };
  return name;
}

export async function createFolder(
  projectId: string,
  rawName: string,
  parentId?: string | null,
): Promise<ActionResult<{ id: string }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const name = readFolderName(rawName);
  if (typeof name !== "string") return fail(name.error, "name");

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) return fail("That project no longer exists.", "form");

  if (parentId) {
    const parent = await db.folder.findFirst({
      where: { id: parentId, workspaceId },
      select: { projectId: true, parentId: true },
    });
    if (!parent) return fail("That folder no longer exists.", "form");
    // A subfolder lives in the same project as its parent.
    if (parent.projectId !== project.id) {
      return fail("A subfolder must be in the same project as its parent.", "form");
    }
    // Two levels: what the design draws and what the tree renders.
    if (parent.parentId) return fail("Folders go two levels deep at most.", "form");
  }

  const folder = await db.folder.create({
    data: { workspaceId, projectId: project.id, name, parentId: parentId ?? null },
    select: { id: true },
  });

  revalidate();
  return ok(folder);
}

export async function renameFolder(
  id: string,
  rawName: string,
): Promise<ActionResult<{ id: string }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const name = readFolderName(rawName);
  if (typeof name !== "string") return fail(name.error, "name");

  const result = await db.folder.updateMany({ where: { id, workspaceId }, data: { name } });
  if (result.count === 0) return fail("That folder no longer exists.", "form");

  revalidate();
  return ok({ id });
}

export async function deleteFolder(
  id: string,
): Promise<ActionResult<{ movedLinks: number; subfolders: number }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const folder = await db.folder.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      _count: { select: { links: { where: NOT_DELETED }, children: true } },
      children: { select: { _count: { select: { links: { where: NOT_DELETED } } } } },
    },
  });
  if (!folder) return fail("That folder no longer exists.", "form");

  const movedLinks =
    folder._count.links +
    folder.children.reduce((sum, child) => sum + child._count.links, 0);

  // Subfolders cascade; every link inside, at either level, just loses its folder.
  await db.folder.delete({ where: { id: folder.id } });

  revalidate();
  return ok({ movedLinks, subfolders: folder._count.children });
}
