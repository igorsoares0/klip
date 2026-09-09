"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav";
import { ChevronLeft, ChevronRight, LinkGlyph, NavIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui/progress";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface UsageMeter {
  label: string;
  display: string;
  pct: number;
  note: string;
}

export function Sidebar({
  expanded,
  onToggle,
  usage,
}: {
  expanded: boolean;
  onToggle: () => void;
  usage: UsageMeter;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-[180ms] ease-out"
      style={{ width: expanded ? 236 : 68 }}
    >
      <div className="flex h-[60px] items-center gap-[10px] border-b border-border px-[18px]">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-nav bg-ink text-lime">
          <LinkGlyph size={15} />
        </span>
        {expanded ? (
          <span className="text-brand font-bold tracking-tight text-ink">Klip</span>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-[2px] overflow-y-auto px-[10px] py-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-[11px] rounded-nav px-[10px] py-2 text-body transition-colors",
                expanded ? "" : "justify-center",
                active
                  ? "bg-surface-muted font-semibold text-ink"
                  : "font-medium text-muted hover:bg-surface-muted",
              )}
            >
              <NavIcon name={item.icon} className="shrink-0" />
              {expanded ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 px-[10px] pb-3">
        {expanded ? (
          <div className="rounded-input bg-canvas p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-caption text-muted">{usage.label}</span>
              <span className="font-mono text-caption font-semibold text-ink">
                {usage.display}
              </span>
            </div>
            <ProgressBar value={usage.pct} className="mt-[9px]" />
            <p className="mt-[9px] text-[11px] text-faint">{usage.note}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex cursor-pointer items-center gap-[11px] rounded-nav px-[10px] py-2 text-body font-medium text-muted transition-colors hover:bg-surface-muted",
            expanded ? "" : "justify-center",
          )}
        >
          {expanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          {expanded ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
