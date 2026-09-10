"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDismiss } from "@/components/ui/use-dismiss";
import { DotsIcon, FolderIcon, PlusIcon } from "@/components/icons";
import { formatNumber } from "@/shared/format";
import { cn } from "@/lib/utils";
import { deleteProject } from "@/projects/actions";
import type { ProjectDot } from "@/lib/types";
import type { FolderNodeRow, ProjectCard } from "@/projects/queries";
import { FolderTree } from "./folder-tree";
import { ProjectDialog, type ProjectDraft } from "./project-dialog";

export interface ProjectsData {
  projects: ProjectCard[];
  tree: FolderNodeRow[];
  selectedId: string | null;
}

const TINT: Record<ProjectDot, string> = {
  1: "#EEEBFF",
  2: "#FBEDE9",
  3: "#E6F4EE",
  4: "#FDF3E3",
  5: "#EFEDFB",
  6: "#F2F1EE",
};

const BLANK: ProjectDraft = { name: "", description: "", color: 1 };

function CardMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(container, open, close);

  const item =
    "block w-full cursor-pointer rounded-chip px-3 py-[7px] text-left text-cell transition-colors";

  return (
    <div className="relative" ref={container}>
      <IconButton
        label="Project actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          // The card itself is clickable; the menu must not also select it.
          event.stopPropagation();
          setOpen((state) => !state);
        }}
      >
        <DotsIcon size={16} />
      </IconButton>
      {open ? (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-[32px] z-40 w-[150px] rounded-card border border-border bg-surface p-1 shadow-dock animate-klip-pop"
        >
          <button
            type="button"
            role="menuitem"
            className={cn(item, "text-ink hover:bg-surface-muted")}
            onClick={() => {
              setOpen(false);
              onRename();
            }}
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className={cn(item, "text-danger hover:bg-danger-bg")}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ProjectsScreen({ data }: { data: ProjectsData }) {
  const router = useRouter();
  const { projects, tree, selectedId } = data;
  const selected = projects.find((project) => project.id === selectedId) ?? null;

  // The dialog is remounted per draft (via key) so it always opens clean.
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [deleting, setDeleting] = useState<ProjectCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete(project: ProjectCard) {
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeleting(null);
      // Drop the selection: the tree cannot show a project that is gone.
      router.push("/dashboard/projects");
    });
  }

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader title="Projects" sub="Group links by campaign, client or channel." />

      <div className="grid items-start gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
          {projects.map((project) => {
            const active = project.id === selectedId;
            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => router.push(`/dashboard/projects?project=${project.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/dashboard/projects?project=${project.id}`);
                  }
                }}
                className={cn(
                  "flex cursor-pointer flex-col rounded-card border bg-surface px-4 pb-3 pt-4 transition-colors",
                  active ? "border-ink" : "border-border hover:border-border-hover",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-chip"
                    style={{ background: TINT[project.dot], color: `var(--color-dot-${project.dot})` }}
                  >
                    <FolderIcon size={15} />
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-faint">{project.updatedAt}</span>
                    <CardMenu
                      onRename={() =>
                        setDraft({
                          id: project.id,
                          name: project.name,
                          description: project.description,
                          color: project.dot,
                        })
                      }
                      onDelete={() => {
                        setError(null);
                        setDeleting(project);
                      }}
                    />
                  </div>
                </div>
                <h2 className="mt-3 text-card-title-lg font-semibold text-ink">{project.name}</h2>
                <p className="mt-1 flex-1 text-meta text-muted">{project.description}</p>
                <p className="mt-3 border-t border-divider pt-[10px] font-mono text-[11.5px] text-muted">
                  {project.links} links · {formatNumber(project.clicks)} clicks
                </p>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setDraft(BLANK)}
            className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-hover text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <PlusIcon size={16} />
            <span className="text-cell font-medium">New project</span>
          </button>
        </div>

        {selected ? (
          <FolderTree
            key={selected.id}
            projectId={selected.id}
            projectName={selected.name}
            tree={tree}
          />
        ) : (
          <div className="rounded-card border border-dashed border-border-hover px-5 py-10 text-center text-meta text-muted">
            Create a project to start organising links into folders.
          </div>
        )}
      </div>

      {draft ? (
        <ProjectDialog
          key={draft.id ?? "new"}
          open
          initial={draft}
          onClose={() => setDraft(null)}
        />
      ) : null}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => deleting && confirmDelete(deleting)}
            >
              {pending ? "Deleting…" : "Delete project"}
            </Button>
          </>
        }
      >
        <p>The project and its folders are removed.</p>
        <p className="mt-2">
          {deleting && deleting.links > 0
            ? `Its ${formatNumber(deleting.links)} link${deleting.links === 1 ? "" : "s"} stay, move to “No project”, and keep redirecting — nothing you have shared or printed breaks.`
            : "It has no links."}
        </p>
        {error ? <p className="mt-2 text-danger">{error}</p> : null}
      </Dialog>
    </div>
  );
}
