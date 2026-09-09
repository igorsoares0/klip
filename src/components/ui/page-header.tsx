import type { ReactNode } from "react";

export function PageHeader({
  title,
  sub,
  action,
  mono,
  badge,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  /** The link-detail page renders its slug as an h1 in JetBrains Mono. */
  mono?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-[10px]">
          <h1
            className={
              mono
                ? "font-mono text-h1 font-bold tracking-tighter text-ink"
                : "text-h1 font-bold tracking-tight text-ink"
            }
          >
            {title}
          </h1>
          {badge}
        </div>
        {sub ? <p className="mt-[6px] text-body text-muted">{sub}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
