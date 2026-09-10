import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createFolder,
  createProject,
  deleteFolder,
  deleteProject,
  renameFolder,
  updateProject,
} from "./actions";
import { getFolderTree, listProjectOptions } from "./queries";
import { createLink, updateLink } from "@/links/actions";
import { resolveLink } from "@/resolver/resolve";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const WORKSPACE = "ws_acme";
const projects: string[] = [];
const links: string[] = [];
const workspaces: string[] = [];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function newProject(name = `P ${Date.now()}`) {
  const result = await createProject(form({ name, color: "2" }));
  if (!result.ok) throw new Error(`setup: ${result.error}`);
  projects.push(result.data.id);
  return result.data.id;
}

async function newFolder(projectId: string, name: string, parentId?: string) {
  const result = await createFolder(projectId, name, parentId);
  if (!result.ok) throw new Error(`setup: ${result.error}`);
  return result.data.id;
}

async function newLink(slug: string, extra: Record<string, string> = {}) {
  const result = await createLink(
    form({ destination: "https://example.com/pf", slug, domainId: "dom_klip", ...extra }),
  );
  if (!result.ok) throw new Error(`setup: ${result.error}`);
  links.push(result.data.id);
  return result.data.id;
}

afterEach(async () => {
  if (links.length) await db.link.deleteMany({ where: { id: { in: links.splice(0) } } });
  if (projects.length) await db.project.deleteMany({ where: { id: { in: projects.splice(0) } } });
  if (workspaces.length) {
    await db.workspace.deleteMany({ where: { id: { in: workspaces.splice(0) } } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("projects", () => {
  it("creates and renames", async () => {
    const id = await newProject("Launch");
    expect(
      (await updateProject(id, form({ name: "Launch 2", description: "d", color: "5" }))).ok,
    ).toBe(true);

    const row = await db.project.findUniqueOrThrow({ where: { id } });
    expect(row).toMatchObject({ name: "Launch 2", description: "d", color: 5 });
  });

  it("refuses an empty name and a colour outside the six", async () => {
    expect((await createProject(form({ name: "  ", color: "1" }))).ok).toBe(false);
    expect((await createProject(form({ name: "X", color: "7" }))).ok).toBe(false);
    expect((await createProject(form({ name: "X", color: "0" }))).ok).toBe(false);
  });
});

describe("deleting a project", () => {
  it("removes its folders but keeps its links, which keep redirecting", async () => {
    const projectId = await newProject();
    const root = await newFolder(projectId, "Instagram");
    const child = await newFolder(projectId, "video-01", root);

    const slug = `pf-survive-${Date.now()}`;
    const linkId = await newLink(slug, { projectId, folderId: child });

    const result = await deleteProject(projectId);
    expect(result).toMatchObject({ ok: true, data: { movedLinks: 1 } });
    projects.splice(projects.indexOf(projectId), 1);

    // The database cascaded the folders away — no orphans left behind.
    expect(await db.folder.count({ where: { id: { in: [root, child] } } })).toBe(0);

    // The link survived, unassigned.
    const link = await db.link.findUniqueOrThrow({ where: { id: linkId } });
    expect(link.projectId).toBeNull();
    expect(link.folderId).toBeNull();
    expect(link.deletedAt).toBeNull();

    // And it still works for anyone who has it.
    const resolved = await resolveLink("klip.to", slug);
    expect(resolved?.destination).toBe("https://example.com/pf");
  });

  it("reports only links the user can see", async () => {
    const projectId = await newProject();
    await newLink(`pf-live-${Date.now()}`, { projectId });
    const gone = await newLink(`pf-gone-${Date.now()}`, { projectId });
    await db.link.update({ where: { id: gone }, data: { deletedAt: new Date() } });

    const result = await deleteProject(projectId);
    projects.splice(projects.indexOf(projectId), 1);
    expect(result).toMatchObject({ ok: true, data: { movedLinks: 1 } });
  });
});

describe("folders", () => {
  it("nests two levels and refuses a third", async () => {
    const projectId = await newProject();
    const root = await newFolder(projectId, "A");
    const child = await newFolder(projectId, "B", root);

    const third = await createFolder(projectId, "C", child);
    expect(third.ok).toBe(false);
    if (third.ok) return;
    expect(third.error).toMatch(/two levels/);
  });

  it("refuses a parent from another project", async () => {
    const one = await newProject();
    const two = await newProject();
    const parentInOne = await newFolder(one, "Parent");

    expect((await createFolder(two, "Child", parentInOne)).ok).toBe(false);
  });

  it("renames", async () => {
    const projectId = await newProject();
    const id = await newFolder(projectId, "Typo");
    expect((await renameFolder(id, "Fixed")).ok).toBe(true);
    expect((await db.folder.findUniqueOrThrow({ where: { id } })).name).toBe("Fixed");
    expect((await renameFolder(id, "   ")).ok).toBe(false);
  });

  it("deletes a root with its subfolders, keeping every link inside", async () => {
    const projectId = await newProject();
    const root = await newFolder(projectId, "Root");
    const child = await newFolder(projectId, "Child", root);
    const inRoot = await newLink(`pf-root-${Date.now()}`, { folderId: root });
    const inChild = await newLink(`pf-child-${Date.now()}`, { folderId: child });

    const result = await deleteFolder(root);
    expect(result).toMatchObject({ ok: true, data: { movedLinks: 2, subfolders: 1 } });

    expect(await db.folder.count({ where: { id: { in: [root, child] } } })).toBe(0);
    for (const id of [inRoot, inChild]) {
      const link = await db.link.findUniqueOrThrow({ where: { id } });
      expect(link.folderId).toBeNull();
      // Still in the project — only the folder went.
      expect(link.projectId).toBe(projectId);
    }
  });

  it("counts links at both levels of the tree", async () => {
    const projectId = await newProject();
    const root = await newFolder(projectId, "Root");
    const child = await newFolder(projectId, "Child", root);
    await newLink(`pf-c1-${Date.now()}`, { folderId: root });
    await newLink(`pf-c2-${Date.now()}`, { folderId: child });
    await newLink(`pf-c3-${Date.now()}`, { folderId: child });

    const tree = await getFolderTree(WORKSPACE, projectId);
    expect(tree.find((node) => node.id === root)?.count).toBe(1);
    expect(tree.find((node) => node.id === child)?.count).toBe(2);
  });

  it("lists drawer options in tree order, each carrying its project", async () => {
    const projectId = await newProject();
    const root = await newFolder(projectId, "Root");
    const child = await newFolder(projectId, "Child", root);

    const { folders } = await listProjectOptions(WORKSPACE);
    const mine = folders.filter((folder) => folder.projectId === projectId);
    expect(mine.map((folder) => folder.id)).toEqual([root, child]);
    expect(mine[1].parentId).toBe(root);
  });
});

describe("the folder decides the project", () => {
  // Before this rule a link could be saved in project A inside project C's folder.
  it("on create", async () => {
    const a = await newProject("A");
    const c = await newProject("C");
    const folderInC = await newFolder(c, "Folder in C");

    const id = await newLink(`pf-wins-${Date.now()}`, { projectId: a, folderId: folderInC });
    const link = await db.link.findUniqueOrThrow({ where: { id } });
    expect(link.projectId).toBe(c);
    expect(link.folderId).toBe(folderInC);
  });

  it("on update", async () => {
    const a = await newProject("A");
    const c = await newProject("C");
    const folderInC = await newFolder(c, "Folder in C");
    const id = await newLink(`pf-wins-u-${Date.now()}`, { projectId: a });

    await updateLink(
      id,
      form({ destination: "https://example.com/pf", projectId: a, folderId: folderInC }),
    );
    const link = await db.link.findUniqueOrThrow({ where: { id } });
    expect(link.projectId).toBe(c);
  });
});

describe("another workspace", () => {
  it("cannot touch a project or folder that is not its own", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-pf-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await db.project.create({ data: { workspaceId: other.id, name: "Theirs" } });
    const theirFolder = await db.folder.create({
      data: { workspaceId: other.id, projectId: theirs.id, name: "F" },
    });

    expect((await updateProject(theirs.id, form({ name: "Mine", color: "1" }))).ok).toBe(false);
    expect((await deleteProject(theirs.id)).ok).toBe(false);
    expect((await createFolder(theirs.id, "Sneaky")).ok).toBe(false);
    expect((await renameFolder(theirFolder.id, "Mine")).ok).toBe(false);
    expect((await deleteFolder(theirFolder.id)).ok).toBe(false);

    const project = await db.project.findUniqueOrThrow({ where: { id: theirs.id } });
    expect(project.name).toBe("Theirs");
    expect(await db.folder.count({ where: { id: theirFolder.id } })).toBe(1);
  });

  it("cannot file a link into someone else's folder", async () => {
    const other = await db.workspace.create({ data: { name: "O", slug: `o-pl-${Date.now()}` } });
    workspaces.push(other.id);
    const theirs = await db.project.create({ data: { workspaceId: other.id, name: "T" } });
    const theirFolder = await db.folder.create({
      data: { workspaceId: other.id, projectId: theirs.id, name: "F" },
    });

    const result = await createLink(
      form({
        destination: "https://example.com",
        slug: `pf-x-${Date.now()}`,
        domainId: "dom_klip",
        folderId: theirFolder.id,
      }),
    );
    expect(result.ok).toBe(false);
  });
});
