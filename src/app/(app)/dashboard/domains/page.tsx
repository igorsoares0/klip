import { DomainsScreen } from "@/components/screens/domains";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getPendingVerification, listDomains } from "@/domains/queries";

export const metadata = { title: "Domains · Klip" };
export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const [domains, verification] = await Promise.all([
    listDomains(workspaceId),
    getPendingVerification(workspaceId),
  ]);

  return <DomainsScreen domains={domains} verification={verification} />;
}
