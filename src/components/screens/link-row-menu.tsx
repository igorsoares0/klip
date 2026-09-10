"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DotsIcon } from "@/components/icons";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useAppShell } from "@/components/shell/app-shell-context";
import { deleteLink, setLinkStatus } from "@/links/actions";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/lib/types";

/**
 * The row "⋯" menu, in spec §22 order: Copy, Edit, Analytics, QR Code, Pause,
 * Archive, Delete. Its open state is not in the design handoff; it is built
 * from the same tokens as the account menu in the header.
 */
export function LinkRowMenu({
  id,
  shortUrl,
  status,
}: {
  id: string;
  shortUrl: string;
  status: LinkStatus;
}) {
  const router = useRouter();
  const { editLink } = useAppShell();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  // The table scrolls horizontally, and overflow-x:auto clips vertically too —
  // an absolutely positioned menu on the last rows would be cut off. So the
  // menu is portalled to <body> and pinned under the trigger's screen position.
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss([container, menu], open, close);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = container.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const item =
    "block w-full cursor-pointer rounded-chip px-3 py-[7px] text-left text-cell text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-disabled-fg";

  return (
    <div className="relative" ref={container}>
      <IconButton
        label="Link actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <DotsIcon size={16} />
      </IconButton>

      {open && position
        ? createPortal(
        <div
          ref={menu}
          role="menu"
          style={{ top: position.top, right: position.right }}
          className="fixed z-50 w-[184px] rounded-card border border-border bg-surface p-1 shadow-dock animate-klip-pop"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              navigator.clipboard?.writeText(`https://${shortUrl}`);
              setOpen(false);
            }}
          >
            Copy link
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              editLink(id);
            }}
          >
            Edit
          </button>
          <Link role="menuitem" href={`/dashboard/links/${id}`} className={item}>
            Analytics
          </Link>
          <Link role="menuitem" href="/dashboard/qr-codes" className={item}>
            QR code
          </Link>

          <div className="my-1 h-px bg-divider" />

          {status === "PAUSED" ? (
            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={pending}
              onClick={() => run(() => setLinkStatus(id, "ACTIVE"))}
            >
              Resume
            </button>
          ) : status === "ACTIVE" ? (
            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={pending}
              onClick={() => run(() => setLinkStatus(id, "PAUSED"))}
            >
              Pause
            </button>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className={item}
            disabled={pending}
            onClick={() =>
              run(() => setLinkStatus(id, status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"))
            }
          >
            {status === "ARCHIVED" ? "Unarchive" : "Archive"}
          </button>

          <div className="my-1 h-px bg-divider" />

          <button
            type="button"
            role="menuitem"
            className={cn(item, "text-danger hover:bg-danger-bg")}
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
          >
            Delete
          </button>

          {error ? <p className="px-3 py-2 text-caption text-danger">{error}</p> : null}
        </div>,
            document.body,
          )
        : null}

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this link?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => run(() => deleteLink(id))}
            >
              {pending ? "Deleting…" : "Delete link"}
            </Button>
          </>
        }
      >
        <p>
          <span className="font-mono text-ink">{shortUrl}</span> disappears from
          your lists and starts answering <span className="font-mono">410 Gone</span>.
        </p>
        <p className="mt-2">
          Its click history is kept, and the slug stays reserved — no other link
          can ever take it, so a QR code already printed will never lead somewhere
          else.
        </p>
        {error ? <p className="mt-2 text-danger">{error}</p> : null}
      </Dialog>
    </div>
  );
}
