"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "@/components/icons";
import { useDismiss } from "@/components/ui/use-dismiss";
import { cn } from "@/lib/utils";

/**
 * Every filter lives in the URL — the same choice as the dashboard's range —
 * so a filtered view survives a reload and can be shared.
 */

export interface ToolbarState {
  q: string;
  status: string;
  projectId: string | null;
  sort: string;
}

interface Option {
  value: string;
  label: string;
}

const STATUS_OPTIONS: Option[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORT_OPTIONS: Option[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "clicks", label: "Most clicks" },
];

/** Returns a setter that rewrites one search param and resets pagination. */
function useParamSetter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (key: string, value: string | null, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      // Any change to what is being listed puts you back on the first page.
      params.delete("page");
      const query = params.toString();
      router[mode](query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(container, open, close);

  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
        className="flex h-9 cursor-pointer items-center gap-[6px] rounded-input border border-border-strong bg-surface px-3 text-cell whitespace-nowrap transition-colors hover:border-border-hover"
      >
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{current.label}</span>
        <ChevronDown size={13} className="text-faint" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-[40px] z-40 min-w-[168px] rounded-card border border-border bg-surface p-1 shadow-dock animate-klip-pop"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full cursor-pointer rounded-chip px-3 py-[7px] text-left text-cell transition-colors hover:bg-surface-muted",
                option.value === value ? "font-semibold text-ink" : "text-ink-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LinksToolbar({
  state,
  projects,
}: {
  state: ToolbarState;
  projects: Array<{ id: string; name: string }>;
}) {
  const setParam = useParamSetter();
  const [q, setQ] = useState(state.q);
  // What this field last wrote to the URL, and the last ?q= the URL showed.
  const [written, setWritten] = useState(state.q);
  const [seen, setSeen] = useState(state.q);

  // A ?q= this field did not write — the header search, the back button —
  // replaces what is in the field. One it did write is just the round trip of
  // the user's own typing, and adopting it would clobber whatever they typed
  // since.
  if (state.q !== seen) {
    setSeen(state.q);
    if (state.q !== written) {
      setQ(state.q);
      setWritten(state.q);
    }
  }

  // Debounced: typing rewrites the URL (replace, so history is not flooded)
  // once the user pauses, which re-runs the query on the server.
  useEffect(() => {
    const next = q.trim();
    if (next === written) return;
    const timer = setTimeout(() => {
      setWritten(next);
      setParam("q", next || null, "replace");
    }, 300);
    return () => clearTimeout(timer);
  }, [q, written, setParam]);

  const projectOptions: Option[] = [
    { value: "", label: "All" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  return (
    <div className="mb-[14px] flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Filter by slug, destination or title"
        aria-label="Filter links"
        className="h-9 min-w-[220px] flex-1 rounded-input border border-border-strong bg-surface px-3 text-body text-ink transition-colors hover:border-border-hover"
      />
      <FilterDropdown
        label="Project:"
        value={state.projectId ?? ""}
        options={projectOptions}
        onChange={(value) => setParam("project", value || null)}
      />
      <FilterDropdown
        label="Status:"
        value={state.status}
        options={STATUS_OPTIONS}
        onChange={(value) => setParam("status", value === "ALL" ? null : value)}
      />
      <FilterDropdown
        label="Sort:"
        value={state.sort}
        options={SORT_OPTIONS}
        onChange={(value) => setParam("sort", value === "newest" ? null : value)}
      />
    </div>
  );
}

export function useClearFilters() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => router.push(pathname), [router, pathname]);
}
