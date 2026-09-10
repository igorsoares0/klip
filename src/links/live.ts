import type { Prisma } from "@/generated/prisma/client";

/**
 * Links are soft-deleted (`deletedAt`), and soft delete has one classic failure:
 * a query that forgets the filter quietly shows a deleted row. Every link-level
 * surface filters through here instead of spelling it out, so there is exactly
 * one place the rule lives.
 *
 * Two readers deliberately bypass it:
 * - `checkSlugAvailability`, so a deleted link's slug stays reserved;
 * - the resolver, which must find the link to answer 410 Gone.
 */
export const NOT_DELETED = { deletedAt: null } as const;

export function liveLinks(workspaceId: string): Prisma.LinkWhereInput {
  return { workspaceId, ...NOT_DELETED };
}
