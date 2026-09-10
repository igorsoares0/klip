import { db } from "@/lib/db";
import { buildFinalUrl } from "@/lib/utils";
import type { LinkStatus } from "@/lib/types";

/**
 * Resolution is by `hostname + slug`, never slug alone (spec §16) — that is what
 * lets two customers use the same slug on different domains, and it is exactly
 * the `@@unique([domainId, slug])` index.
 */

export interface ResolvedLink {
  id: string;
  workspaceId: string;
  status: LinkStatus;
  destination: string;
  /** Privacy settings of the owning workspace, applied when recording. */
  workspace: {
    hashVisitorIps: boolean;
    storeCityGeo: boolean;
    respectDoNotTrack: boolean;
  };
}

/** Strips the port, which is present on a Host header in development. */
export function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0].trim().toLowerCase() || null;
}

async function findDomain(host: string) {
  const exact = await db.customDomain.findUnique({
    where: { host },
    select: { id: true },
  });
  if (exact) return exact;

  // Development runs on localhost, which is nobody's short-link domain. Fall
  // back to the shared system domain so links are testable locally.
  //
  // Never in production: a host merely pointed at this server would otherwise
  // serve another workspace's links.
  if (process.env.NODE_ENV !== "production") {
    return db.customDomain.findFirst({
      where: { workspaceId: null },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  }

  return null;
}

export async function resolveLink(
  host: string | null,
  slug: string,
): Promise<ResolvedLink | null> {
  const hostname = normalizeHost(host);
  if (!hostname || !slug) return null;

  const domain = await findDomain(hostname);
  if (!domain) return null;

  const link = await db.link.findUnique({
    where: { domainId_slug: { domainId: domain.id, slug } },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      destinationUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      workspace: {
        select: {
          hashVisitorIps: true,
          storeCityGeo: true,
          respectDoNotTrack: true,
        },
      },
    },
  });

  if (!link) return null;

  return {
    id: link.id,
    workspaceId: link.workspaceId,
    status: link.status,
    destination: buildFinalUrl(link.destinationUrl, {
      source: link.utmSource ?? "",
      medium: link.utmMedium ?? "",
      campaign: link.utmCampaign ?? "",
      term: link.utmTerm ?? "",
      content: link.utmContent ?? "",
    }),
    workspace: link.workspace,
  };
}
