import { ApiScreen } from "@/components/screens/api";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { listApiKeys } from "@/api-keys/queries";

export const metadata = { title: "API · Klip" };
export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const apiKeys = await listApiKeys(workspaceId);
  return <ApiScreen apiKeys={apiKeys} />;
}
