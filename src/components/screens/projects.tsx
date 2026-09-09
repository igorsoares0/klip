import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { FolderIcon, PlusIcon } from "@/components/icons";
import { folderTree, projects } from "@/lib/mock/projects";
import { formatNumber } from "@/lib/utils";
import type { ProjectDot } from "@/lib/types";

const DOT: Record<ProjectDot, { color: string; tint: string }> = {
  1: { color: "var(--color-dot-1)", tint: "#EEEBFF" },
  2: { color: "var(--color-dot-2)", tint: "#FBEDE9" },
  3: { color: "var(--color-dot-3)", tint: "#E6F4EE" },
  4: { color: "var(--color-dot-4)", tint: "#FDF3E3" },
  5: { color: "var(--color-dot-5)", tint: "#EFEDFB" },
  6: { color: "var(--color-dot-6)", tint: "#F2F1EE" },
};

export function ProjectsScreen() {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Projects"
        sub="Group links by campaign, client or channel."
      />

      <div className="grid items-start gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
          {projects.map((project) => {
            const dot = DOT[project.dot];
            return (
              <Card
                key={project.id}
                className="flex flex-col px-4 pb-3 pt-4 transition-colors hover:border-border-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-chip"
                    style={{ background: dot.tint, color: dot.color }}
                  >
                    <FolderIcon size={15} />
                  </span>
                  <span className="text-[11px] text-faint">
                    {project.updatedAt}
                  </span>
                </div>
                <h2 className="mt-3 text-card-title-lg font-semibold text-ink">
                  {project.name}
                </h2>
                <p className="mt-1 flex-1 text-meta text-muted">
                  {project.description}
                </p>
                <p className="mt-3 border-t border-divider pt-[10px] font-mono text-[11.5px] text-muted">
                  {project.links} links · {formatNumber(project.clicks)} clicks
                </p>
              </Card>
            );
          })}

          <button
            type="button"
            className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-hover text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <PlusIcon size={16} />
            <span className="text-cell font-medium">New project</span>
          </button>
        </div>

        <Card className="px-5 pb-4 pt-4">
          <h2 className="text-[13.5px] font-semibold text-ink">
            Summer Campaign
          </h2>
          <p className="mt-1 text-meta text-muted">Folders inside this project</p>
          <div className="mt-3 flex flex-col">
            {folderTree.map((node) => (
              <div
                key={node.id}
                className="-mx-5 flex items-center gap-2 px-5 py-[7px] transition-colors hover:bg-surface-hover"
                style={{ paddingLeft: node.depth === 0 ? 20 : 40 }}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] text-tree-marker"
                >
                  {node.depth === 0 ? "▸" : "·"}
                </span>
                <span
                  className={
                    node.depth === 0
                      ? "flex-1 truncate text-cell font-semibold text-ink"
                      : "flex-1 truncate text-cell text-ink-secondary"
                  }
                >
                  {node.name}
                </span>
                <span className="font-mono text-[11.5px] text-muted">
                  {formatNumber(node.count)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
