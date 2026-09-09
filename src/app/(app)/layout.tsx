import { AppShell } from "@/components/shell/app-shell";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getShellData } from "@/workspaces/queries";
import { listProjectOptions } from "@/projects/queries";
import { listDomains } from "@/domains/queries";

// Reads live workspace data on every request.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const workspaceId = await getCurrentWorkspaceId();
  const [shell, options, domains] = await Promise.all([
    getShellData(workspaceId),
    listProjectOptions(workspaceId),
    listDomains(workspaceId),
  ]);

  return (
    <AppShell
      workspace={shell.workspace}
      user={shell.user}
      usage={shell.usage}
      drawerOptions={{
        projects: options.projects,
        folders: options.folders,
        domains: domains.map((domain) => ({ id: domain.id, host: domain.host })),
      }}
    >
      {children}
    </AppShell>
  );
}
