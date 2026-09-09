import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actions,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-empty flex-col items-center py-16 text-center">
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-tile border border-border bg-surface text-accent">
          {icon}
        </div>
      ) : null}
      <h2 className="text-[19px] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-[440px] text-body text-muted">{description}</p>
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
      {children}
    </div>
  );
}
