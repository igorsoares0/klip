"use client";

import { useCallback, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useDismiss } from "@/components/ui/use-dismiss";

export function UserMenu({ initials, email }: { initials: string; email: string }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(container, open, close);

  return (
    <div className="relative flex-none" ref={container}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        onClick={() => setOpen((current) => !current)}
        className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-pill bg-accent text-[11.5px] font-semibold text-white"
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[38px] w-[220px] rounded-card border border-border bg-surface p-1 shadow-dock animate-klip-pop"
        >
          <p className="truncate px-3 py-2 text-caption text-muted">{email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full cursor-pointer rounded-chip px-3 py-2 text-left text-cell font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
