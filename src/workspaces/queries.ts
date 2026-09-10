import { db } from "@/lib/db";
import { getMonthlyClickUsage } from "@/analytics/queries";
import { CLICK_LIMIT } from "@/entitlements/limits";
import { compactNumber } from "@/shared/format";

/**
 * Everything the app shell renders: workspace chip, avatar, usage meter.
 *
 * The member lookup is keyed on the signed-in user, not on "first member of
 * the workspace" — the latter would show a teammate's initials once workspaces
 * hold more than one person.
 */
export async function getShellData(workspaceId: string, userId: string) {
  const [workspace, member, used] = await Promise.all([
    db.workspace.findUnique({
      where: { id: workspaceId },
      include: { defaultDomain: { select: { host: true } } },
    }),
    db.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { user: { select: { name: true, email: true } } },
    }),
    getMonthlyClickUsage(workspaceId),
  ]);

  const name = workspace?.name ?? "Workspace";
  const person = member?.user.name ?? member?.user.email ?? "";
  const initials = person
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    workspace: {
      name,
      avatar: name[0]?.toUpperCase() ?? "K",
    },
    user: { initials: initials || "?", email: member?.user.email ?? "" },
    usage: {
      label: "Tracked clicks",
      display: `${compactNumber(used)} / ${compactNumber(CLICK_LIMIT)}`,
      pct: Math.min(100, Math.round((used / CLICK_LIMIT) * 100)),
      note: "Lifetime plan · resets monthly",
    },
  };
}

export async function getWorkspaceSettings(workspaceId: string) {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return null;

  return {
    name: workspace.name,
    slug: workspace.slug,
    defaultDomainId: workspace.defaultDomainId,
    toggles: [
      {
        id: "hash-ips",
        label: "Hash visitor IPs",
        description: "Raw IPs are discarded after geo lookup.",
        enabled: workspace.hashVisitorIps,
      },
      {
        id: "city-geo",
        label: "Store city-level geo",
        description: "Adds city column to analytics exports.",
        enabled: workspace.storeCityGeo,
      },
      {
        id: "dnt",
        label: "Respect Do Not Track",
        description: "Skip analytics for DNT visitors.",
        enabled: workspace.respectDoNotTrack,
      },
    ],
  };
}
