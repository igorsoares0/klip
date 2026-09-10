import { AnalyticsScreen } from "@/components/screens/analytics";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { parseWindowParams, resolveWindow } from "@/analytics/range";
import {
  getBreakdownPanels,
  getDashboardStats,
  getGeoPanels,
  getSeries,
  getSeriesAxis,
} from "@/analytics/queries";

export const metadata = { title: "Analytics · Klip" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage(props: PageProps<"/dashboard/analytics">) {
  const workspaceId = await getCurrentWorkspaceId();
  const period = parseWindowParams(await props.searchParams);
  const window = resolveWindow(period);

  const [stats, series, panels, geoPanels] = await Promise.all([
    getDashboardStats(workspaceId, window),
    getSeries(workspaceId, window),
    getBreakdownPanels(workspaceId, window),
    getGeoPanels(workspaceId, window),
  ]);
  const axis = await getSeriesAxis(window, series.length);

  // The export covers exactly the period on screen.
  const exportParams = new URLSearchParams({ range: period.range });
  if (period.from) exportParams.set("from", period.from);
  if (period.to) exportParams.set("to", period.to);

  return (
    <AnalyticsScreen
      data={{
        period,
        periodLabel: window.label,
        stats,
        series,
        axis,
        panels,
        geoPanels,
        exportHref: `/api/analytics/export?${exportParams.toString()}`,
      }}
    />
  );
}
