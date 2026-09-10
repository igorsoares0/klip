"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldError, Input } from "@/components/ui/form";
import { createProject, updateProject } from "@/projects/actions";
import { cn } from "@/lib/utils";
import type { ProjectDot } from "@/lib/types";

const DOTS: ProjectDot[] = [1, 2, 3, 4, 5, 6];

export interface ProjectDraft {
  id?: string;
  name: string;
  description: string;
  color: ProjectDot;
}

/**
 * Create and rename share one dialog. Not in the design handoff — the grid, the
 * dashed tile and the tree are; the form behind them is built from the same
 * tokens, with the six accent dots the cards already use.
 */
export function ProjectDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: ProjectDraft;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [color, setColor] = useState<ProjectDot>(initial.color);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial.id);

  function save() {
    setError(null);
    const form = new FormData();
    form.set("name", name);
    form.set("description", description);
    form.set("color", String(color));

    startTransition(async () => {
      const result = editing
        ? await updateProject(initial.id!, form)
        : await createProject(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      // A new project becomes the selected one, so its (empty) tree shows.
      if (!editing) router.push(`/dashboard/projects?project=${result.data.id}`);
      else router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Rename project" : "New project"}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending || !name.trim()}>
            {pending ? "Saving…" : editing ? "Save" : "Create project"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <Field label="Name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Summer Campaign"
            className="h-10"
          />
        </Field>
        <Field label="Description">
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Seasonal promo across paid + organic"
            className="h-10"
          />
        </Field>
        <div>
          <p className="text-label font-medium text-ink-secondary">Colour</p>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Project colour">
            {DOTS.map((dot) => (
              <button
                key={dot}
                type="button"
                role="radio"
                aria-checked={color === dot}
                aria-label={`Colour ${dot}`}
                onClick={() => setColor(dot)}
                className={cn(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-pill border-2 transition-colors",
                  color === dot ? "border-ink" : "border-transparent hover:border-border-hover",
                )}
              >
                <span
                  className="h-4 w-4 rounded-pill"
                  style={{ background: `var(--color-dot-${dot})` }}
                />
              </button>
            ))}
          </div>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </Dialog>
  );
}
