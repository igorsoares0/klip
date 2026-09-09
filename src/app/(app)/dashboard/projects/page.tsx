import { ProjectsScreen } from "@/components/screens/projects";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getFolderTree, listProjects } from "@/projects/queries";

export const metadata = { title: "Projects · Klip" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const projects = await listProjects(workspaceId);

  // The panel shows the folders of whichever project has the most links.
  const featured = [...projects].sort((a, b) => b.links - a.links)[0] ?? null;
  const tree = featured ? await getFolderTree(workspaceId, featured.id) : [];

  return (
    <ProjectsScreen
      data={{ projects, tree, treeProjectName: featured?.name ?? null }}
    />
  );
}
