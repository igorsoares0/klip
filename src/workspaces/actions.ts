"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeSlug, validateSlug } from "@/lib/utils";
import { fail, ok, type ActionResult } from "@/shared/action";
import { getCurrentWorkspaceId } from "./current";

/** The workspace is always resolved server-side, never taken from the caller. */

export async function updateWorkspaceProfile(
  form: FormData,
): Promise<ActionResult<{ name: string; slug: string }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const name = String(form.get("name") ?? "").trim();
  const slug = normalizeSlug(String(form.get("slug") ?? "").trim());
  const defaultDomainId = String(form.get("defaultDomainId") ?? "").trim();

  if (!name) return fail("Give the workspace a name.", "name");
  if (name.length > 60) return fail("Keep the name under 60 characters.", "name");

  if (!slug) return fail("Give the workspace a slug.", "workspaceSlug");
  const slugError = validateSlug(slug);
  if (slugError) return fail(slugError, "workspaceSlug");

  // A domain the workspace does not own is not a valid default.
  if (defaultDomainId) {
    const domain = await db.customDomain.findFirst({
      where: {
        id: defaultDomainId,
        OR: [{ workspaceId }, { workspaceId: null }],
      },
      select: { id: true },
    });
    if (!domain) return fail("Pick a domain you own.", "form");
  }

  try {
    const updated = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        name,
        slug,
        defaultDomainId: defaultDomainId || null,
      },
      select: { name: true, slug: true },
    });

    revalidatePath("/dashboard/settings");
    // The workspace chip in the header shows the name on every screen.
    revalidatePath("/dashboard");

    return ok(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("That workspace slug is taken.", "workspaceSlug");
    }
    throw error;
  }
}

const TOGGLES = {
  "hash-ips": "hashVisitorIps",
  "city-geo": "storeCityGeo",
  dnt: "respectDoNotTrack",
} as const;

export type ToggleId = keyof typeof TOGGLES;

export async function setPrivacyToggle(
  id: string,
  enabled: boolean,
): Promise<ActionResult<{ id: string; enabled: boolean }>> {
  const workspaceId = await getCurrentWorkspaceId();

  // Mapping ids to columns by allowlist keeps a crafted POST from naming an
  // arbitrary Workspace field.
  const column = TOGGLES[id as ToggleId];
  if (!column) return fail("Unknown setting.", "form");

  await db.workspace.update({
    where: { id: workspaceId },
    data: { [column]: enabled },
  });

  revalidatePath("/dashboard/settings");
  return ok({ id, enabled });
}
