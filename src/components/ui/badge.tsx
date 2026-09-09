import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ApiKeyScope, DomainStatus, LinkStatus } from "@/lib/types";

export type Tone = "positive" | "warning" | "danger" | "neutral" | "accent";

const TONES: Record<Tone, string> = {
  positive: "bg-positive-bg text-positive",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-surface-muted text-muted",
  accent: "bg-accent-tint text-accent",
};

/** One badge covers all three pill builders in the prototype: link status,
 *  domain status and API-key scope. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-pill px-[9px] py-[3px] text-caption font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const LINK_STATUS: Record<LinkStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "positive" },
  PAUSED: { label: "Paused", tone: "warning" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export function LinkStatusBadge({ status }: { status: LinkStatus }) {
  const { label, tone } = LINK_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const DOMAIN_STATUS: Record<DomainStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "positive" },
  PENDING_DNS: { label: "Pending DNS", tone: "warning" },
  ERROR: { label: "Error", tone: "danger" },
};

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const { label, tone } = DOMAIN_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const SCOPE: Record<ApiKeyScope, { label: string; tone: Tone }> = {
  FULL: { label: "Full access", tone: "accent" },
  LINKS: { label: "Links only", tone: "neutral" },
  READ: { label: "Read only", tone: "positive" },
};

export function ScopeBadge({ scope }: { scope: ApiKeyScope }) {
  const { label, tone } = SCOPE[scope];
  return <Badge tone={tone}>{label}</Badge>;
}

export function DeltaPill({
  value,
  direction = "up",
}: {
  value: string;
  direction?: "up" | "down";
}) {
  return (
    <span
      className={cn(
        "rounded-pill px-[7px] py-[2px] text-meta font-semibold whitespace-nowrap",
        direction === "up"
          ? "bg-positive-bg text-positive"
          : "bg-danger-bg text-danger",
      )}
    >
      {value}
    </span>
  );
}

export function Chip({
  selected,
  children,
  onClick,
  as = "button",
}: {
  selected?: boolean;
  children: ReactNode;
  onClick?: () => void;
  as?: "button" | "span";
}) {
  const className = cn(
    "inline-flex items-center gap-[6px] rounded-pill border px-[13px] py-[7px] text-cell font-medium whitespace-nowrap transition-colors",
    selected
      ? "border-ink bg-ink text-white"
      : "border-border-strong bg-surface text-ink-secondary hover:border-border-hover",
  );

  if (as === "span") return <span className={className}>{children}</span>;

  return (
    <button type="button" onClick={onClick} className={cn(className, "cursor-pointer")}>
      {children}
    </button>
  );
}
