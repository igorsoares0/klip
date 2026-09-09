import { DashboardScreen } from "@/components/screens/dashboard";
import { DashboardEmpty } from "@/components/screens/states";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { parseRange, resolveWindow } from "@/analytics/range";
import {
  getBreakdowns,
  getDashboardStats,
  getFastestGrowing,
  getSeries,
  getSeriesAxis,
  getTopLinks,
} from "@/analytics/queries";
import { db } from "@/lib/db";

export const metadata = { title: "Overview · Klip" };
export const dynamic = "force-dynamic";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const workspaceId = await getCurrentWorkspaceId();
  const searchParams = await props.searchParams;
  const range = parseRange(searchParams.range);
  const window = resolveWindow(range);

  const [stats, series, topLinks, breakdowns, fastestGrowing, activeLinks, totalClicks] =
    await Promise.all([
      getDashboardStats(workspaceId, window),
      getSeries(workspaceId, window),
      getTopLinks(workspaceId),
      getBreakdowns(workspaceId, window),
      getFastestGrowing(workspaceId),
      db.link.count({ where: { workspaceId, status: "ACTIVE" } }),
      db.linkClick.count({ where: { workspaceId, isBot: false } }),
    ]);

  if (totalClicks === 0) return <DashboardEmpty />;

  const axis = await getSeriesAxis(window, series.length);

  return (
    <DashboardScreen
      data={{
        range,
        stats,
        series,
        axis,
        topLinks,
        breakdowns,
        fastestGrowing,
        activeLinks,
      }}
    />
  );
}
