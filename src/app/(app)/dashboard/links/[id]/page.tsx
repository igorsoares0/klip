import { notFound } from "next/navigation";
import { LinkDetailScreen } from "@/components/screens/link-detail";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getLink } from "@/links/queries";
import { parseWindowParams, resolveWindow } from "@/analytics/range";
import { getBreakdownPanels, getLinkStats, getSeries } from "@/analytics/queries";
import { buildFinalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LinkDetailPage(
  props: PageProps<"/dashboard/links/[id]">,
) {
  const { id } = await props.params;
  const workspaceId = await getCurrentWorkspaceId();

  // Scoped by workspace: a link from another tenant must read as missing.
  const link = await getLink(workspaceId, id);
  if (!link) notFound();

  const period = parseWindowParams(await props.searchParams);
  const window = resolveWindow(period);
  const [stats, series, panels] = await Promise.all([
    getLinkStats(workspaceId, link.id, window),
    getSeries(workspaceId, window, link.id),
    getBreakdownPanels(workspaceId, window, link.id),
  ]);

  const destination = buildFinalUrl(link.destinationUrl, {
    source: link.utmSource ?? "",
    medium: link.utmMedium ?? "",
    campaign: link.utmCampaign ?? "",
    term: link.utmTerm ?? "",
    content: link.utmContent ?? "",
  });

  return (
    <LinkDetailScreen
      data={{
        id: link.id,
        period,
        periodLabel: window.label,
        shortUrl: `${link.domain.host}/${link.slug}`,
        destination,
        status: link.status,
        stats,
        series,
        panels,
      }}
    />
  );
}
