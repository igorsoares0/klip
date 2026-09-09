import { db } from "@/lib/db";
import type { DomainStatus } from "@/lib/types";

export interface DomainRow {
  id: string;
  host: string;
  note: string | null;
  links: number;
  status: DomainStatus;
}

/** Includes the shared system domain, which belongs to no workspace. */
export async function listDomains(workspaceId: string): Promise<DomainRow[]> {
  const rows = await db.customDomain.findMany({
    where: { OR: [{ workspaceId }, { workspaceId: null }] },
    include: { _count: { select: { links: true } } },
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

/** The DNS record card targets whichever domain is still waiting on a CNAME. */
export async function getPendingVerification(workspaceId: string) {
  const pending = await db.customDomain.findFirst({
    where: { workspaceId, status: "PENDING_DNS" },
  });
  if (!pending) return null;

  return {
    host: pending.host,
    record: [
      { key: "TYPE", value: "CNAME" },
      { key: "NAME", value: pending.host.split(".")[0] },
      { key: "VALUE", value: "edge.klip.to" },
    ],
  };
}
