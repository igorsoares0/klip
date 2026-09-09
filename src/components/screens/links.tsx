import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, LinkStatusBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ChevronDown, DotsIcon } from "@/components/icons";
import { links, linkCounts, linkFilters } from "@/lib/mock/links";
import { formatNumber } from "@/lib/utils";

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

export function LinksScreen() {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Links"
        sub={`${linkCounts.active} active · ${linkCounts.paused} paused · ${linkCounts.archived} archived`}
      />

      <div className="mb-[14px] flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Filter by slug, destination or title"
          className="h-9 min-w-[220px] flex-1 rounded-input border border-border-strong bg-surface px-3 text-body text-ink transition-colors hover:border-border-hover"
        />
        {linkFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className="flex h-9 cursor-pointer items-center gap-[6px] rounded-input border border-border-strong bg-surface px-3 text-cell whitespace-nowrap transition-colors hover:border-border-hover"
          >
            <span className="text-muted">{filter.label}</span>
            <span className="font-semibold text-ink">{filter.value}</span>
            <ChevronDown size={13} className="text-faint" />
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
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

          {links.map((link) => (
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
                      style={{
                        background: DOT_COLORS[link.projectDot ?? 6],
                      }}
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
                <IconButton label="Link actions">
                  <DotsIcon size={16} />
                </IconButton>
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-[18px] py-3">
          <span className="text-meta text-muted">
            Showing {links.length} of {linkCounts.total} links
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled>
              Previous
            </Button>
            <Button size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
