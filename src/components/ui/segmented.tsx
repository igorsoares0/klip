"use client";

import { cn } from "@/lib/utils";

/**
 * Two looks from the handoff:
 * - "dark": white container, active option is an ink-filled pill (range picker).
 * - "raised": sunken track, active option is a white raised tab (breakdown tabs).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "dark",
  className,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  variant?: "dark" | "raised";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-[3px]",
        variant === "dark"
          ? "rounded-input border border-border bg-surface"
          : "w-full rounded-btn bg-canvas",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "cursor-pointer whitespace-nowrap transition-colors",
              variant === "dark"
                ? "rounded-sk px-[11px] py-[5px] text-cell"
                : "flex-1 rounded-chip px-2 py-[6px] text-meta",
              active
                ? variant === "dark"
                  ? "bg-ink font-semibold text-white"
                  : "bg-surface font-semibold text-ink shadow-tab"
                : "bg-transparent font-medium text-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
