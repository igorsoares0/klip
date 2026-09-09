"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScopeBadge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/icons";
import { apiKeys, endpoints, quickStartCurl } from "@/lib/mock/api-keys";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  positive: "text-positive",
  accent: "text-accent",
  warning: "text-warning",
  danger: "text-danger",
};

export function ApiScreen() {
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="API"
        sub="Create links programmatically. Keys are scoped to this workspace."
        action={
          <Button
            variant="primary"
            icon={<PlusIcon size={15} />}
            onClick={() =>
              // Display only. The real endpoint returns the key once and stores
              // nothing but a hash.
              setNewKey(
                `klip_live_${Math.random().toString(36).slice(2, 12)}${Math.random()
                  .toString(36)
                  .slice(2, 12)}`,
              )
            }
          >
            Create API key
          </Button>
        }
      />

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
              className="cursor-pointer rounded-chip px-[9px] py-[5px] text-meta font-semibold text-danger transition-colors hover:bg-danger-bg"
            >
              Revoke
            </button>
          </div>
        ))}
      </Card>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-card-title font-semibold text-ink">Quick start</h2>
          <span className="text-meta text-muted">
            Rate limit: 60 req/min per key
          </span>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-block bg-ink px-4 py-4 font-mono text-[11.5px] leading-[1.7] text-code-fg">
          {quickStartCurl}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          {endpoints.map((endpoint) => (
            <span
              key={`${endpoint.method} ${endpoint.path}`}
              className="inline-flex items-center gap-2 rounded-chip border border-border bg-surface-sunken px-[10px] py-[6px] font-mono text-[11.5px]"
            >
              <span className={cn("font-semibold", TONE[endpoint.tone])}>
                {endpoint.method}
              </span>
              <span className="text-ink-secondary">{endpoint.path}</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
