"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Modal confirmation. Not in the design handoff (README line 19 lists the
 * delete-confirmation modal as uncovered) — built from the drawer's backdrop
 * and the card tokens so it reads as part of the same system.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    // Move focus into the dialog so keyboard users land on its actions.
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-[rgba(20,20,26,.32)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-[70] w-[420px] max-w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 rounded-card-lg border border-border bg-surface p-6 shadow-dock animate-klip-pop"
      >
        <h2 id={titleId} className="text-[16px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <div className="mt-2 text-body text-muted">{children}</div>
        <div className="mt-6 flex items-center justify-end gap-2">{actions}</div>
      </div>
    </>
  );
}
