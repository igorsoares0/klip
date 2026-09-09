import { AnalyticsScreen } from "@/components/screens/analytics";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { resolveWindow } from "@/analytics/range";
import {
  getBreakdownPanels,
  getDashboardStats,
  getSeries,
} from "@/analytics/queries";

export const metadata = { title: "Analytics · Klip" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const window = resolveWindow("30d");

  const [stats, series, panels] = await Promise.all([
    getDashboardStats(workspaceId, window),
    getSeries(workspaceId, window),
    getBreakdownPanels(workspaceId, window),
  ]);

  return <AnalyticsScreen data={{ stats, series, panels }} />;
}
