import { db } from "@/lib/db";
import type { DomainStatus } from "@/lib/types";
import { NOT_DELETED } from "@/links/live";

export interface DomainRow {
  id: string;
  host: string;
  note: string | null;
  links: number;
  status: DomainStatus;
}

/**
 * Includes the shared system domain, which belongs to no workspace.
 *
 * The link count is this workspace's links only. The shared domain carries
 * every tenant's links, so an unscoped count would tell each customer how many
 * links everyone else has.
 */
export async function listDomains(workspaceId: string): Promise<DomainRow[]> {
  const rows = await db.customDomain.findMany({
    where: { OR: [{ workspaceId }, { workspaceId: null }] },
    include: {
      _count: { select: { links: { where: { workspaceId, ...NOT_DELETED } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    host: row.host,
    note: row.note,
    links: row._count.links,
    status: row.status,
  }));
}
