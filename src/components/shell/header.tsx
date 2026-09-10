"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

/**
 * Searches links, through the same `?q=` the links list already filters on.
 * The design's placeholder promised projects and domains too; that needs a
 * results dropdown, and until it exists the field promises only what it does.
 */
function HeaderSearch() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // ⌘K on a Mac, Ctrl+K elsewhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/links?q=${encodeURIComponent(q)}` : "/dashboard/links");
    input.current?.blur();
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="relative min-w-[110px] max-w-[400px] flex-[1_1_160px]"
    >
      <SearchIcon
        size={15}
        className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-faint"
      />
      <input
        ref={input}
        type="search"
        aria-label="Search links"
        placeholder="Search links"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        className="h-[34px] w-full rounded-nav border border-border-strong bg-surface pl-[34px] pr-[50px] text-[13px] text-ink transition-colors hover:border-border-hover"
      />
      <span className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 rounded-kbd bg-surface-muted px-[6px] py-[2px] font-mono text-[11px] text-muted">
        ⌘K
      </span>
    </form>
  );
}

export function Header({
  onCreateLink,
  workspace,
  userInitials,
  userEmail,
}: {
  onCreateLink: () => void;
  workspace: { name: string; avatar: string };
  userInitials: string;
  userEmail: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-[rgba(245,244,241,.86)] px-6 backdrop-blur-[10px]">
      {/* A label, not a menu: each account has one workspace. It becomes a
          switcher when there is something to switch to. */}
      <div className="flex flex-none items-center gap-2 px-2 py-[6px]">
        <span className="flex h-5 w-5 items-center justify-center rounded-chip bg-lime text-[11px] font-bold text-ink">
          {workspace.avatar}
        </span>
        <span className="text-[13px] font-semibold whitespace-nowrap text-ink">
          {workspace.name}
        </span>
      </div>

      <HeaderSearch />

      <div className="flex-1" />

      <Button
        variant="primary"
        onClick={onCreateLink}
        icon={<PlusIcon size={15} />}
      >
        Create link
      </Button>

      <UserMenu initials={userInitials} email={userEmail} />
    </header>
  );
}
