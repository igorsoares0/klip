"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScopeBadge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/icons";
import { ComingSoon } from "@/components/ui/coming-soon";
import type { ApiKeyRow } from "@/api-keys/queries";
import { createApiKey, revokeApiKey } from "@/api-keys/actions";

export function ApiScreen({ apiKeys }: { apiKeys: ApiKeyRow[] }) {
  // Held in memory only, and only until the next navigation: this is the one
  // moment the plaintext key exists outside the creating request.
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createApiKey();
      if (result.ok) {
        setNewKey(result.data.plaintext);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function revoke(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeApiKey(id);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="API"
        sub="Keys are scoped to this workspace."
        action={
          <Button
            variant="primary"
            icon={<PlusIcon size={15} />}
            onClick={create}
            disabled={pending}
          >
            Create API key
          </Button>
        }
      />

      {error ? (
        <Card className="mb-[14px] border-border-danger px-5 py-4">
          <p className="text-cell text-danger">{error}</p>
        </Card>
      ) : null}

      {newKey ? (
        <Card className="mb-[14px] border-accent px-5 pb-5 pt-4 shadow-reveal">
          <h2 className="text-card-title font-semibold text-ink">
            Copy your key now
          </h2>
          <p className="mt-1 text-meta text-muted">
            This is the only time it will be shown. Store it in your server
            environment.
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-block bg-ink px-4 py-3">
            <code className="min-w-0 flex-1 truncate font-mono text-cell text-lime">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(newKey)}
              className="cursor-pointer rounded-chip bg-white/10 px-3 py-[5px] text-meta font-semibold text-white transition-colors hover:bg-white/20"
            >
              Copy
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            className="flex items-center gap-4 border-b border-divider px-5 py-[14px] last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-ink">
                {key.name}
              </p>
              <p className="mt-1 truncate font-mono text-[11.5px] text-muted">
                {key.masked}
              </p>
            </div>
            <span className="text-meta text-faint whitespace-nowrap">
              {key.lastUsed}
            </span>
            <ScopeBadge scope={key.scope} />
            <button
              type="button"
              onClick={() => revoke(key.id)}
              disabled={pending}
              className="cursor-pointer rounded-chip px-[9px] py-[5px] text-meta font-semibold text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:text-disabled-fg"
            >
              Revoke
            </button>
          </div>
        ))}
      </Card>

      <ComingSoon title="REST API" className="mt-[18px]">
        The endpoints for creating and managing links arrive in a later release.
        Keys created here are the ones they will accept.
      </ComingSoon>
    </div>
  );
}
