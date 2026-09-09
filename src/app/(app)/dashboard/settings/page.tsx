import { notFound } from "next/navigation";
import { SettingsScreen } from "@/components/screens/settings";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getWorkspaceSettings } from "@/workspaces/queries";
import { listDomains } from "@/domains/queries";

export const metadata = { title: "Settings · Klip" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const [settings, domains] = await Promise.all([
    getWorkspaceSettings(workspaceId),
    listDomains(workspaceId),
  ]);
  if (!settings) notFound();

  return (
    <SettingsScreen
      data={{
        ...settings,
        domains: domains.map((d) => ({ id: d.id, host: d.host })),
      }}
    />
  );
}
