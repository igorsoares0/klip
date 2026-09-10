import { LinksScreen } from "@/components/screens/links";
import { LinksEmpty } from "@/components/screens/states";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { countLinksByStatus, listLinks } from "@/links/queries";
import { isFiltered, parseLinkListParams } from "@/links/params";
import { listProjectOptions } from "@/projects/queries";

export const metadata = { title: "Links · Klip" };
export const dynamic = "force-dynamic";

export default async function LinksPage(props: PageProps<"/dashboard/links">) {
  const workspaceId = await getCurrentWorkspaceId();
  const options = parseLinkListParams(await props.searchParams);

  const [list, counts, projectOptions] = await Promise.all([
    listLinks(workspaceId, options),
    countLinksByStatus(workspaceId),
    listProjectOptions(workspaceId),
  ]);

  // A workspace with no links at all gets the first-link empty state. A search
  // that matches nothing is a different situation and is handled in the table.
  if (counts.total === 0) return <LinksEmpty />;

  return (
    <LinksScreen
      data={{
        list,
        counts,
        filters: options,
        filtered: isFiltered(options),
        projects: projectOptions.projects,
      }}
    />
  );
}
