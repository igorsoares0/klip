import { DomainsScreen } from "@/components/screens/domains";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { listDomains } from "@/domains/queries";

export const metadata = { title: "Domains · Klip" };
export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const domains = await listDomains(workspaceId);

  return <DomainsScreen domains={domains} />;
}
