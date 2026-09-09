import { LinksScreen } from "@/components/screens/links";
import { LinksEmpty } from "@/components/screens/states";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { countLinksByStatus, listLinks } from "@/links/queries";

export const metadata = { title: "Links · Klip" };
export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const [links, counts] = await Promise.all([
    listLinks(workspaceId),
    countLinksByStatus(workspaceId),
  ]);

  if (counts.total === 0) return <LinksEmpty />;

  return <LinksScreen data={{ links, counts }} />;
}
