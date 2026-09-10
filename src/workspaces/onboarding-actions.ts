"use server";

import { db } from "@/lib/db";
import { normalizeSlug, validateSlug } from "@/lib/utils";
import { fail, ok, text, type ActionResult } from "@/shared/action";
import { getCurrentWorkspaceId } from "./current";

/** Step 1 of onboarding renames the workspace created at registration. */
export async function nameWorkspace(
  form: FormData,
): Promise<ActionResult<{ name: string }>> {
  const workspaceId = await getCurrentWorkspaceId();
  const name = text(form, "name");

  if (!name) return fail("Give the workspace a name.", "name");
  if (name.length > 60) return fail("Keep the name under 60 characters.", "name");

  // Derive a slug from the name, suffixing until it is free — the user is not
  // shown a slug field at this point.
  const base = normalizeSlug(name).replace(/[^a-z0-9-]/g, "") || "workspace";
  let slug = validateSlug(base) ? "workspace" : base;
  for (let attempt = 1; attempt < 50; attempt++) {
    const clash = await db.workspace.findFirst({
      where: { slug, id: { not: workspaceId } },
      select: { id: true },
    });
    if (!clash) break;
    slug = `${base}-${attempt + 1}`;
  }

  const updated = await db.workspace.update({
    where: { id: workspaceId },
    data: { name, slug },
    select: { name: true },
  });

  return ok(updated);
}

/** The default domain new links land on, for the onboarding preview. */
export async function getDefaultDomain() {
  const workspaceId = await getCurrentWorkspaceId();
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { defaultDomain: { select: { id: true, host: true } } },
  });
  if (workspace?.defaultDomain) return workspace.defaultDomain;

  const shared = await db.customDomain.findFirst({
    where: { workspaceId: null },
    select: { id: true, host: true },
    orderBy: { createdAt: "asc" },
  });
  return shared;
}
