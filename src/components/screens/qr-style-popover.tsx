"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form";
import { useDismiss } from "@/components/ui/use-dismiss";
import { updateQrColors } from "@/qr/actions";
import { DEFAULT_QR_COLORS, contrastRatio, isHexColor, validateQrColors } from "@/qr/colors";

/**
 * The "Style" control on a QR card: foreground and background colour, the
 * "basic customization" of spec §15. The customizer panel is not in the design
 * handoff; this is built from the same tokens as the table's row menu.
 *
 * Validation runs as you pick, so an unscannable pair is refused before it is
 * saved — and the server repeats the check for anything that skips this UI.
 */
export function QrStylePopover({
  qrId,
  fg: initialFg,
  bg: initialBg,
}: {
  qrId: string;
  fg: string;
  bg: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fg, setFg] = useState(initialFg);
  const [bg, setBg] = useState(initialBg);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(container, open, close);

  const problem = validateQrColors({ fg, bg });
  const ratio = isHexColor(fg) && isHexColor(bg) ? contrastRatio(fg, bg) : null;
  const unchanged = fg === initialFg && bg === initialBg;

  function save() {
    setServerError(null);
    startTransition(async () => {
      const result = await updateQrColors(qrId, fg, bg);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  function swatch(label: string, value: string, onChange: (next: string) => void) {
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="text-cell text-ink-secondary">{label}</span>
        <span className="flex items-center gap-2">
          <input
            type="color"
            value={isHexColor(value) ? value : "#000000"}
            onChange={(event) => onChange(event.target.value)}
            className="h-7 w-7 cursor-pointer rounded-chip border border-border-strong bg-surface p-0"
            aria-label={`${label} colour`}
          />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="h-7 w-[86px] rounded-chip border border-border-strong bg-surface px-2 font-mono text-[11.5px] text-ink"
          />
        </span>
      </label>
    );
  }

  return (
    <div className="relative" ref={container}>
      <Button
        size="sm"
        block
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
      >
        Style
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="QR code colours"
          className="absolute bottom-[38px] right-0 z-40 w-[248px] rounded-card border border-border bg-surface p-4 shadow-dock animate-klip-pop"
        >
          <div className="flex flex-col gap-3">
            {swatch("Code", fg, setFg)}
            {swatch("Background", bg, setBg)}
          </div>

          <p className="mt-3 font-mono text-[11px] text-faint">
            {ratio ? `Contrast ${ratio.toFixed(1)}:1` : "—"}
          </p>

          {problem ? (
            <div className="mt-2">
              <FieldError>{problem}</FieldError>
            </div>
          ) : null}
          {serverError ? (
            <div className="mt-2">
              <FieldError>{serverError}</FieldError>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setFg(DEFAULT_QR_COLORS.fg);
                setBg(DEFAULT_QR_COLORS.bg);
              }}
              className="cursor-pointer text-caption font-medium text-muted hover:text-ink"
            >
              Reset
            </button>
            <Button
              size="sm"
              variant="primary"
              onClick={save}
              disabled={Boolean(problem) || unchanged || pending}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
