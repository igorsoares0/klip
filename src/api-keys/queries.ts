import { db } from "@/lib/db";
import { relativeTime } from "@/shared/format";
import type { ApiKeyScope } from "@/lib/types";

export interface ApiKeyRow {
  id: string;
  name: string;
  masked: string;
  lastUsed: string;
  scope: ApiKeyScope;
}

/** Never selects hashedKey — the secret is shown once at creation and never again. */
export async function listApiKeys(workspaceId: string): Promise<ApiKeyRow[]> {
  const rows = await db.apiKey.findMany({
    where: { workspaceId, revokedAt: null },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      last4: true,
      scope: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    masked: `${row.keyPrefix}_${"•".repeat(12)}${row.last4}`,
    lastUsed: row.lastUsedAt ? `Used ${relativeTime(row.lastUsedAt)}` : "Never used",
    scope: row.scope,
  }));
}
