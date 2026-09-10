"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Select, Toggle } from "@/components/ui/form";
import { setPrivacyToggle, updateWorkspaceProfile } from "@/workspaces/actions";
import type { ActionField } from "@/shared/action";

export interface SettingsData {
  name: string;
  slug: string;
  defaultDomainId: string | null;
  toggles: Array<{ id: string; label: string; description: string; enabled: boolean }>;
  domains: Array<{ id: string; host: string }>;
}

/** Brief "Saved" caption — the handoff gives this screen no save button. */
function SavedFlag({ shown }: { shown: boolean }) {
  return (
    <span
      className={
        shown
          ? "text-caption font-medium text-positive opacity-100 transition-opacity"
          : "text-caption font-medium text-positive opacity-0 transition-opacity"
      }
      aria-live="polite"
    >
      {shown ? "Saved" : ""}
    </span>
  );
}

export function SettingsScreen({ data }: { data: SettingsData }) {
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(data.toggles.map((t) => [t.id, t.enabled])),
  );
  const [error, setError] = useState<{ message: string; field: ActionField } | null>(null);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function flagSaved() {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  }

  /** Text fields have no save button, so they commit on blur. */
  function saveProfile() {
    const form = formRef.current;
    if (!form) return;
    startTransition(async () => {
      const result = await updateWorkspaceProfile(new FormData(form));
      if (result.ok) {
        setError(null);
        flagSaved();
      } else {
        setError({ message: result.error, field: result.field });
      }
    });
  }

  function toggle(id: string, next: boolean) {
    const previous = toggles[id];
    setToggles((current) => ({ ...current, [id]: next }));
    startTransition(async () => {
      const result = await setPrivacyToggle(id, next);
      if (result.ok) {
        flagSaved();
      } else {
        // Put the switch back where it was — the server refused.
        setToggles((current) => ({ ...current, [id]: previous }));
        setError({ message: result.error, field: result.field });
      }
    });
  }

  return (
    <div className="mx-auto max-w-settings animate-klip-in">
      <PageHeader title="Settings" sub="Workspace, privacy and danger zone." />

      <form ref={formRef}>
        <Card className="px-5 pb-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-card-title font-semibold text-ink">Workspace</h2>
            <SavedFlag shown={saved} />
          </div>
          <div className="mt-4 flex flex-col gap-[18px]">
            <Field
              label="Name"
              hint={
                error?.field === "name" ? <FieldError>{error.message}</FieldError> : null
              }
            >
              <Input
                name="name"
                defaultValue={data.name}
                onBlur={saveProfile}
                invalid={error?.field === "name"}
                className="h-10"
              />
            </Field>
            <Field
              label="Slug"
              hint={
                error?.field === "workspaceSlug" ? (
                  <FieldError>{error.message}</FieldError>
                ) : null
              }
            >
              <Input
                mono
                name="slug"
                defaultValue={data.slug}
                onBlur={saveProfile}
                invalid={error?.field === "workspaceSlug"}
                className="h-10"
              />
            </Field>
            <Field label="Default short domain">
              <Select
                name="defaultDomainId"
                defaultValue={data.defaultDomainId ?? ""}
                onChange={saveProfile}
                className="h-10"
              >
                {data.domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.host}
                  </option>
                ))}
              </Select>
            </Field>
            {error?.field === "form" ? <FieldError>{error.message}</FieldError> : null}
          </div>
        </Card>
      </form>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">
          Privacy &amp; tracking
        </h2>
        <div className="mt-4 flex flex-col">
          {data.toggles.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-4 border-b border-divider py-[13px] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-ink">{row.label}</p>
                <p className="mt-1 text-meta text-muted">{row.description}</p>
              </div>
              <Toggle
                label={row.label}
                checked={toggles[row.id]}
                onChange={(next) => toggle(row.id, next)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-[18px] border-border-danger px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-danger">Danger zone</h2>
        <p className="mt-2 text-body text-muted">
          Deleting the workspace removes all links immediately — existing short
          URLs will start returning 410.
        </p>
        {/* Deletion is not wired: the handoff has no confirmation modal. */}
        <Button variant="danger" className="mt-4" disabled>
          Delete workspace
        </Button>
      </Card>
    </div>
  );
}
