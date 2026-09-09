import { DomainsScreen } from "@/components/screens/domains";
import { db } from "@/lib/db";

export const metadata = { title: "Domains · Klip" };

// Reads live data — no caching until the request is scoped to a real session.
export const dynamic = "force-dynamic";

// Hardcoded until Auth.js lands and the workspace comes from the session.
const WORKSPACE_ID = "ws_acme";

export default async function DomainsPage() {
  const rows = await db.customDomain.findMany({
    where: {
      OR: [{ workspaceId: WORKSPACE_ID }, { workspaceId: null }],
    },
    include: { _count: { select: { links: true } } },
    orderBy: { createdAt: "asc" },
  });

  const domains = rows.map((row) => ({
    id: row.id,
    host: row.host,
    note: row.note,
    links: row._count.links,
    status: row.status,
  }));

  const pending = rows.find((row) => row.status === "PENDING_DNS");
  const verification = pending
    ? {
        host: pending.host,
        record: [
          { key: "TYPE", value: "CNAME" },
          { key: "NAME", value: pending.host.split(".")[0] },
          { key: "VALUE", value: "edge.klip.to" },
        ],
      }
    : null;

  return <DomainsScreen domains={domains} verification={verification} />;
}
