"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeSlug, validateDestination, validateSlug } from "@/lib/utils";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import {
  checkbox,
  fail,
  ok,
  optionalText,
  text,
  type ActionResult,
} from "@/shared/action";

/**
 * Server actions are reachable by direct POST, not only through our UI, so
 * every one of these resolves the workspace itself and scopes every query by
 * it. A workspaceId is never accepted from the caller.
 */

export interface SlugAvailability {
  available: boolean;
  message: string | null;
}

/**
 * A domain is usable by a workspace when it owns it, or when it is the shared
 * system domain (workspaceId null). Anything else is not theirs to publish on.
 */
async function resolveDomain(workspaceId: string, domainId: string) {
  if (!domainId) return null;
  return db.customDomain.findFirst({
    where: { id: domainId, OR: [{ workspaceId }, { workspaceId: null }] },
    select: { id: true, host: true },
  });
}

/** Backs the live "Available" check in the create-link drawer. */
export async function checkSlugAvailability(
  domainId: string,
  rawSlug: string,
): Promise<SlugAvailability> {
  const workspaceId = await getCurrentWorkspaceId();

  // A field holding only spaces is still an empty field — say nothing, the way
  // an untouched field says nothing.
  if (!rawSlug.trim()) return { available: false, message: null };

  const slug = normalizeSlug(rawSlug).trim();

  const formatError = validateSlug(slug);
  if (formatError) return { available: false, message: formatError };

  const domain = await resolveDomain(workspaceId, domainId);
  if (!domain) return { available: false, message: "Unknown domain." };

  const existing = await db.link.findUnique({
    where: { domainId_slug: { domainId: domain.id, slug } },
    select: { id: true },
  });

  return existing
    ? { available: false, message: `${domain.host}/${slug} is already in use — try ${slug}-2.` }
    : { available: true, message: null };
}

export interface CreatedLink {
  id: string;
  slug: string;
  host: string;
}

export async function createLink(
  form: FormData,
): Promise<ActionResult<CreatedLink>> {
  const workspaceId = await getCurrentWorkspaceId();

  const destination = text(form, "destination");
  const slug = normalizeSlug(text(form, "slug"));
  const domainId = text(form, "domainId");

  if (!destination) return fail("Enter a full URL including https://", "destination");

  const destinationError = validateDestination(destination);
  if (destinationError) return fail(destinationError, "destination");

  if (!slug) return fail("Pick a short path for this link.", "slug");

  const slugError = validateSlug(slug);
  if (slugError) return fail(slugError, "slug");

  const domain = await resolveDomain(workspaceId, domainId);
  if (!domain) return fail("Pick a domain you own.", "form");

  // Project and folder must belong to the same workspace, or they are not the
  // caller's to file a link under.
  const projectId = optionalText(form, "projectId");
  const folderId = optionalText(form, "folderId");

  if (projectId) {
    const project = await db.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });
    if (!project) return fail("Pick a project from this workspace.", "form");
  }

  if (folderId) {
    const folder = await db.folder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true },
    });
    if (!folder) return fail("Pick a folder from this workspace.", "form");
  }

  const withQr = checkbox(form, "generateQr");

  try {
    const link = await db.$transaction(async (tx) => {
      const created = await tx.link.create({
        data: {
          workspaceId,
          domainId: domain.id,
          slug,
          destinationUrl: destination,
          title: optionalText(form, "title"),
          projectId,
          folderId,
          utmSource: optionalText(form, "utmSource"),
          utmMedium: optionalText(form, "utmMedium"),
          utmCampaign: optionalText(form, "utmCampaign"),
          utmTerm: optionalText(form, "utmTerm"),
          utmContent: optionalText(form, "utmContent"),
        },
      });

      if (withQr) {
        await tx.qrCode.create({ data: { workspaceId, linkId: created.id } });
      }

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    if (withQr) revalidatePath("/dashboard/qr-codes");

    return ok({ id: link.id, slug: link.slug, host: domain.host });
  } catch (error) {
    // The unique index is the authority, not the live availability check —
    // that check can always lose a race with another tab.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(`${domain.host}/${slug} is already in use — try ${slug}-2.`, "slug");
    }
    throw error;
  }
}
