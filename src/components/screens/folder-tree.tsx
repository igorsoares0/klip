"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/form";
import { formatNumber } from "@/shared/format";
import { createFolder, deleteFolder, renameFolder } from "@/projects/actions";
import type { FolderNodeRow } from "@/projects/queries";

/**
 * The folder panel beside the project grid. Creating and renaming happen inline
 * — a tree reads better editing in place than through a dialog — and deleting
 * asks first, because it takes subfolders with it.
 */

/** Which inline editor is open: a new root, a new child of a root, or a rename. */
type Editing =
  | { kind: "new-root" }
  | { kind: "new-child"; parentId: string }
  | { kind: "rename"; id: string; name: string }
  | null;

function InlineInput({
  initial,
  depth,
  onSubmit,
  onCancel,
  pending,
}: {
  initial: string;
  depth: 0 | 1;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [value, setValue] = useState(initial);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") onSubmit(value);
    if (event.key === "Escape") onCancel();
  }

  return (
    <div className="flex items-center gap-2 py-[5px]" style={{ paddingLeft: depth === 0 ? 0 : 20 }}>
      <input
        autoFocus
        value={value}
        disabled={pending}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        // Leaving the field commits a real change and drops an empty one.
        onBlur={() => (value.trim() && value.trim() !== initial ? onSubmit(value) : onCancel())}
        placeholder="Folder name"
        className="h-7 min-w-0 flex-1 rounded-chip border border-border-strong bg-surface px-2 text-cell text-ink"
      />
    </div>
  );
}

export function FolderTree({
  projectId,
  projectName,
  tree,
}: {
  projectId: string;
  projectName: string;
  tree: FolderNodeRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<FolderNodeRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setEditing(null);
        setConfirming(null);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  // What the delete confirmation has to say, worked out from the tree itself.
  const doomed = confirming
    ? {
        subfolders: tree.filter((node) => node.parentId === confirming.id),
        links:
          confirming.count +
          tree
            .filter((node) => node.parentId === confirming.id)
            .reduce((sum, node) => sum + node.count, 0),
      }
    : null;

  const action =
    "cursor-pointer rounded-chip px-[6px] py-[2px] text-[11px] font-medium text-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-ink group-hover:opacity-100 focus:opacity-100";

  return (
    <Card className="px-5 pb-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[13.5px] font-semibold text-ink">{projectName}</h2>
          <p className="mt-1 text-meta text-muted">Folders inside this project</p>
        </div>
        <Link
          href={`/dashboard/links?project=${projectId}`}
          className="flex shrink-0 items-center gap-1 text-meta font-semibold text-accent hover:text-accent-hover"
        >
          View links <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-3 flex flex-col">
        {tree.length === 0 && editing?.kind !== "new-root" ? (
          <p className="py-3 text-meta text-faint">No folders yet.</p>
        ) : null}

        {tree.map((node) => {
          if (editing?.kind === "rename" && editing.id === node.id) {
            return (
              <InlineInput
                key={node.id}
                initial={editing.name}
                depth={node.depth}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSubmit={(name) => run(() => renameFolder(node.id, name))}
              />
            );
          }

          return (
            <div key={node.id}>
              <div
                className="group -mx-5 flex items-center gap-2 px-5 py-[7px] transition-colors hover:bg-surface-hover"
                style={{ paddingLeft: node.depth === 0 ? 20 : 40 }}
              >
                <span aria-hidden="true" className="font-mono text-[11px] text-tree-marker">
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

                {node.depth === 0 ? (
                  <button
                    type="button"
                    className={action}
                    onClick={() => setEditing({ kind: "new-child", parentId: node.id })}
                  >
                    + sub
                  </button>
                ) : null}
                <button
                  type="button"
                  className={action}
                  onClick={() => setEditing({ kind: "rename", id: node.id, name: node.name })}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className={`${action} hover:bg-danger-bg hover:text-danger`}
                  onClick={() => setConfirming(node)}
                >
                  Delete
                </button>

                <span className="w-8 text-right font-mono text-[11.5px] text-muted">
                  {formatNumber(node.count)}
                </span>
              </div>

              {editing?.kind === "new-child" && editing.parentId === node.id ? (
                <div className="-mx-5 px-5" style={{ paddingLeft: 20 }}>
                  <InlineInput
                    initial=""
                    depth={1}
                    pending={pending}
                    onCancel={() => setEditing(null)}
                    onSubmit={(name) => run(() => createFolder(projectId, name, node.id))}
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {editing?.kind === "new-root" ? (
          <InlineInput
            initial=""
            depth={0}
            pending={pending}
            onCancel={() => setEditing(null)}
            onSubmit={(name) => run(() => createFolder(projectId, name))}
          />
        ) : null}
      </div>

      {error ? (
        <div className="mt-2">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setEditing({ kind: "new-root" })}
        className="mt-3 flex cursor-pointer items-center gap-1 text-meta font-semibold text-accent hover:text-accent-hover"
      >
        <PlusIcon size={13} /> Folder
      </button>

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Delete “${confirming?.name ?? ""}”?`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => confirming && run(() => deleteFolder(confirming.id))}
            >
              {pending ? "Deleting…" : "Delete folder"}
            </Button>
          </>
        }
      >
        {doomed && doomed.subfolders.length > 0 ? (
          <p>
            Its {doomed.subfolders.length} subfolder
            {doomed.subfolders.length === 1 ? "" : "s"} go with it.
          </p>
        ) : null}
        <p className={doomed && doomed.subfolders.length > 0 ? "mt-2" : undefined}>
          {doomed && doomed.links > 0
            ? `${formatNumber(doomed.links)} link${doomed.links === 1 ? "" : "s"} inside stay in the project, just without a folder. They keep working.`
            : "There are no links inside."}
        </p>
      </Dialog>
    </Card>
  );
}
