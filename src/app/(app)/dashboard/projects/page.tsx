import { ProjectsScreen } from "@/components/screens/projects";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { getFolderTree, listProjects } from "@/projects/queries";

export const metadata = { title: "Projects · Klip" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage(props: PageProps<"/dashboard/projects">) {
  const workspaceId = await getCurrentWorkspaceId();
  const params = await props.searchParams;
  const requested = Array.isArray(params.project) ? params.project[0] : params.project;

  const projects = await listProjects(workspaceId);

  // The tree shows the selected project. An unknown or stale id (say, a project
  // just deleted) falls back to the first one rather than an empty panel.
  const selected = projects.find((project) => project.id === requested) ?? projects[0] ?? null;
  const tree = selected ? await getFolderTree(workspaceId, selected.id) : [];

  return (
    <ProjectsScreen
      data={{ projects, tree, selectedId: selected?.id ?? null }}
    />
  );
}
