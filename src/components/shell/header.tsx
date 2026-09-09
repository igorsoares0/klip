"use client";

import { ChevronDown, PlusIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function Header({
  onCreateLink,
  workspace,
  userInitials,
}: {
  onCreateLink: () => void;
  workspace: { name: string; avatar: string };
  userInitials: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-[rgba(245,244,241,.86)] px-6 backdrop-blur-[10px]">
      <button
        type="button"
        className="flex flex-none cursor-pointer items-center gap-2 rounded-nav px-2 py-[6px] transition-colors hover:bg-surface-muted"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-chip bg-lime text-[11px] font-bold text-ink">
          {workspace.avatar}
        </span>
        <span className="text-[13px] font-semibold whitespace-nowrap text-ink">
          {workspace.name}
        </span>
        <ChevronDown size={14} className="text-faint" />
      </button>

      <div className="relative min-w-[110px] max-w-[400px] flex-[1_1_160px]">
        <SearchIcon
          size={15}
          className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          placeholder="Search links, projects, domains"
          className="h-[34px] w-full rounded-nav border border-border-strong bg-surface pl-[34px] pr-[50px] text-[13px] text-ink transition-colors hover:border-border-hover"
        />
        <span className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 rounded-kbd bg-surface-muted px-[6px] py-[2px] font-mono text-[11px] text-muted">
          ⌘K
        </span>
      </div>

      <div className="flex-1" />

      <Button
        variant="primary"
        onClick={onCreateLink}
        icon={<PlusIcon size={15} />}
      >
        Create link
      </Button>

      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-pill bg-accent text-[11.5px] font-semibold text-white">
        {userInitials}
      </span>
    </header>
  );
}
