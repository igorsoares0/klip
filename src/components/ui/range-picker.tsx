"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form";
import { SegmentedControl } from "@/components/ui/segmented";
import { useDismiss } from "@/components/ui/use-dismiss";
import { MAX_CUSTOM_DAYS, RANGES, type WindowSpec } from "@/analytics/range";
import type { TimeRange } from "@/lib/types";

const DAY = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The period control, shared by the dashboard, analytics and link detail. It
 * writes to the URL of whatever page it sits on, so each of those pages re-runs
 * its queries on the server and the period survives a reload or a shared link.
 *
 * "Custom" used to be a label on a 30-day window. It now opens real dates.
 */
export function RangePicker({ value }: { value: WindowSpec }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  // "Today" and the default dates are read when the popover opens, in an event
  // handler, not during render: render must be pure, and a render-time clock
  // would also disagree between server and client around midnight.
  const [today, setToday] = useState("");
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");
  const container = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(container, open, close);

  function navigate(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, v] of Object.entries(next)) {
      if (v === null) params.delete(key);
      else params.set(key, v);
    }
    // A new period starts back on the first page of anything paginated.
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function choose(range: TimeRange) {
    if (range === "custom") {
      const now = Date.now();
      setToday(isoDay(new Date(now)));
      // First open with no custom range yet: start from the last 30 days.
      if (!from) setFrom(isoDay(new Date(now - 29 * DAY)));
      if (!to) setTo(isoDay(new Date(now)));
      setOpen(true);
      return;
    }
    setOpen(false);
    navigate({ range, from: null, to: null });
  }

  const span = (Date.parse(to) - Date.parse(from)) / DAY + 1;
  const problem =
    !from || !to
      ? "Pick both dates."
      : from > to
        ? "The start date is after the end date."
        : span > MAX_CUSTOM_DAYS
          ? `Pick at most ${MAX_CUSTOM_DAYS} days.`
          : null;

  return (
    <div className="relative" ref={container}>
      <SegmentedControl options={RANGES} value={value.range} onChange={choose} />

      {open ? (
        <div
          role="dialog"
          aria-label="Custom date range"
          className="absolute right-0 top-[42px] z-40 w-[288px] rounded-card border border-border bg-surface p-4 shadow-dock animate-klip-pop"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-label font-medium text-ink-secondary">From</span>
              <input
                type="date"
                value={from}
                max={today}
                onChange={(event) => setFrom(event.target.value)}
                className="h-9 rounded-input border border-border-strong bg-surface px-2 font-mono text-cell text-ink"
              />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-label font-medium text-ink-secondary">To</span>
              <input
                type="date"
                value={to}
                max={today}
                onChange={(event) => setTo(event.target.value)}
                className="h-9 rounded-input border border-border-strong bg-surface px-2 font-mono text-cell text-ink"
              />
            </label>
          </div>

          <p className="mt-3 text-caption text-faint">Days are measured in UTC.</p>
          {problem ? (
            <div className="mt-2">
              <FieldError>{problem}</FieldError>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={Boolean(problem)}
              onClick={() => {
                setOpen(false);
                navigate({ range: "custom", from, to });
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
