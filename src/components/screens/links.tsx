"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, LinkStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/shared/format";
import type { LinkListResult } from "@/links/queries";
import { LinkRowMenu } from "./link-row-menu";
import { LinksToolbar, useClearFilters, type ToolbarState } from "./links-toolbar";

export interface LinksData {
  list: LinkListResult;
  counts: { active: number; paused: number; archived: number; total: number };
  filters: ToolbarState & { page: number };
  /** Whether anything narrows the list — separates "no matches" from "no links". */
  filtered: boolean;
  projects: Array<{ id: string; name: string }>;
}

/**
 * The header row and every data row share this grid and min-width inside an
 * `overflow-x-auto` wrapper. Without it the two fluid columns collapse and the
 * text collides at narrow widths.
 */
const ROW =
  "grid min-w-[920px] gap-[14px] [grid-template-columns:minmax(0,1.5fr)_minmax(0,1.4fr)_90px_140px_96px_90px_40px]";

const DOT_COLORS: Record<number, string> = {
  1: "var(--color-dot-1)",
  2: "var(--color-dot-2)",
  3: "var(--color-dot-3)",
  4: "var(--color-dot-4)",
  5: "var(--color-dot-5)",
  6: "var(--color-dot-6)",
};

function Pagination({ list }: { list: LinkListResult }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-[18px] py-3">
      <span className="text-meta text-muted">
        {list.total === 0
          ? "No links"
          : `Showing ${from}–${to} of ${formatNumber(list.total)}`}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={list.page <= 1} onClick={() => go(list.page - 1)}>
          Previous
        </Button>
        <Button
          size="sm"
          disabled={list.page >= list.pageCount}
          onClick={() => go(list.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function LinksScreen({ data }: { data: LinksData }) {
  const { list, counts } = data;
  const clearFilters = useClearFilters();

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Links"
        sub={`${counts.active} active · ${counts.paused} paused · ${counts.archived} archived`}
      />

      <LinksToolbar state={data.filters} projects={data.projects} />

      <Card>
        <div className="overflow-x-auto">
          <div
            className={`${ROW} border-b border-border bg-surface-sunken px-[18px] py-[10px] text-col font-semibold tracking-col text-muted-soft uppercase`}
          >
            <span>Link</span>
            <span>Destination</span>
            <span className="text-right">Clicks</span>
            <span>Project</span>
            <span>Created</span>
            <span>Status</span>
            <span />
          </div>

          {list.rows.length === 0 ? (
            // Distinct from the first-link empty state: the workspace has links,
            // this search or filter just matches none of them.
            <div className="flex flex-col items-center gap-3 px-[18px] py-14 text-center">
              <p className="text-body font-medium text-ink">No links match</p>
              <p className="text-meta text-muted">
                Try a different search, or clear the filters.
              </p>
              {data.filtered ? (
                <Button size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            list.rows.map((link) => (
              <div
                key={link.id}
                className={`${ROW} items-center border-b border-divider px-[18px] py-[13px] transition-colors last:border-b-0 hover:bg-surface-sunken`}
              >
                <div className="flex min-w-0 items-center gap-[10px]">
                  <span
                    aria-hidden="true"
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-chip bg-surface-muted text-[13px] text-muted"
                  >
                    {link.favicon}
                  </span>
                  <span className="min-w-0">
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="block truncate font-mono text-cell font-medium text-ink transition-colors hover:text-accent"
                    >
                      {link.domain}/{link.slug}
                    </Link>
                    <span className="block truncate text-[11px] text-faint">
                      {link.title}
                    </span>
                  </span>
                </div>

                <span className="truncate text-cell text-muted">
                  {link.destinationUrl.replace(/^https?:\/\//, "")}
                </span>

                <span className="text-right font-mono text-cell font-medium text-ink">
                  {formatNumber(link.clicks)}
                </span>

                <span className="min-w-0">
                  {link.projectName ? (
                    <Badge tone="neutral" className="max-w-full">
                      <span
                        aria-hidden="true"
                        className="h-[6px] w-[6px] shrink-0 rounded-pill"
                        style={{ background: DOT_COLORS[link.projectDot ?? 6] }}
                      />
                      <span className="truncate">{link.projectName}</span>
                    </Badge>
                  ) : (
                    <span className="text-cell text-faint">—</span>
                  )}
                </span>

                <span className="text-cell text-muted">{link.createdAt}</span>

                <span>
                  <LinkStatusBadge status={link.status} />
                </span>

                <span className="flex justify-end">
                  <LinkRowMenu
                    id={link.id}
                    shortUrl={`${link.domain}/${link.slug}`}
                    status={link.status}
                  />
                </span>
              </div>
            ))
          )}
        </div>

        <Pagination list={list} />
      </Card>
    </div>
  );
}
