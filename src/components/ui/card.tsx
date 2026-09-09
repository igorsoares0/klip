import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cards use borders, not shadows. */
export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  sub,
  action,
  className,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-4 pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-card-title font-semibold text-ink">{title}</h2>
        {sub ? <p className="mt-1 text-meta text-muted">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}
