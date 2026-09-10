import { db } from "@/lib/db";

/**
 * Spec §6: a user gets a default workspace and an OWNER membership. Called from
 * registration and from the OAuth createUser event, so it must be idempotent —
 * a user who already has a workspace keeps it.
 */

function slugSeed(email: string | null, userId: string): string {
  const local = email?.split("@")[0] ?? "";
  const cleaned = local.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || `workspace-${userId.slice(0, 6)}`;
}

function displayName(email: string | null): string {
  const local = email?.split("@")[0];
  if (!local) return "My workspace";
  // "maria.rocha" -> "Maria Rocha"; onboarding lets them rename it anyway.
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export async function ensureWorkspaceFor(
  userId: string,
  email: string | null,
): Promise<string> {
  const existing = await db.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.workspaceId;

  const base = slugSeed(email, userId);

  // Workspace.slug is unique, so a common local-part needs a suffix.
  let slug = base;
  for (let attempt = 1; attempt < 50; attempt++) {
    const clash = await db.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!clash) break;
    slug = `${base}-${attempt + 1}`;
  }

  const workspace = await db.workspace.create({
    data: {
      name: displayName(email),
      slug,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { id: true },
  });

  return workspace.id;
}
