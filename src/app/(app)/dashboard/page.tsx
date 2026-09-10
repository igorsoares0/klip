import { DashboardScreen } from "@/components/screens/dashboard";
import { DashboardEmpty } from "@/components/screens/states";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { parseRange, resolveWindow } from "@/analytics/range";
import {
  getBreakdowns,
  getDashboardOverview,
  getDashboardStats,
  getFastestGrowing,
  getSeries,
  getSeriesAxis,
  getTopLinks,
} from "@/analytics/queries";

export const metadata = { title: "Overview · Klip" };
export const dynamic = "force-dynamic";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const workspaceId = await getCurrentWorkspaceId();
  const searchParams = await props.searchParams;
  const range = parseRange(searchParams.range);
  const window = resolveWindow(range);

  const [stats, series, topLinks, breakdowns, fastestGrowing, overview] =
    await Promise.all([
      getDashboardStats(workspaceId, window),
      getSeries(workspaceId, window),
      getTopLinks(workspaceId),
      getBreakdowns(workspaceId, window),
      getFastestGrowing(workspaceId),
      getDashboardOverview(workspaceId),
    ]);

  if (!overview.hasClicks) return <DashboardEmpty />;
  const { activeLinks } = overview;

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
