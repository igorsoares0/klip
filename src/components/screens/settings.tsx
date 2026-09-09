"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Toggle } from "@/components/ui/form";
import { domains } from "@/lib/mock/domains";
import { privacyToggles, workspace } from "@/lib/mock/workspace";

export function SettingsScreen() {
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(privacyToggles.map((t) => [t.id, t.enabled])),
  );

  return (
    <div className="mx-auto max-w-settings animate-klip-in">
      <PageHeader title="Settings" sub="Workspace, privacy and danger zone." />

      <Card className="px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">Workspace</h2>
        <div className="mt-4 flex flex-col gap-[18px]">
          <Field label="Name">
            <Input defaultValue={workspace.name} className="h-10" />
          </Field>
          <Field label="Slug">
            <Input mono defaultValue={workspace.slug} className="h-10" />
          </Field>
          <Field label="Default short domain">
            <Select defaultValue={workspace.defaultDomain} className="h-10">
              {domains.map((domain) => (
                <option key={domain.id} value={domain.host}>
                  {domain.host}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">
          Privacy &amp; tracking
        </h2>
        <div className="mt-4 flex flex-col">
          {privacyToggles.map((toggle) => (
            <div
              key={toggle.id}
              className="flex items-center gap-4 border-b border-divider py-[13px] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-ink">{toggle.label}</p>
                <p className="mt-1 text-meta text-muted">{toggle.description}</p>
              </div>
              <Toggle
                label={toggle.label}
                checked={toggles[toggle.id]}
                onChange={(next) =>
                  setToggles((current) => ({ ...current, [toggle.id]: next }))
                }
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
        <Button variant="danger" className="mt-4">
          Delete workspace
        </Button>
      </Card>
    </div>
  );
}
