import { Card } from "./card";
import { ProgressBar } from "./progress";
import type { BreakdownItem, BreakdownPanel as Panel } from "@/lib/types";

export function BreakdownRow({
  item,
  color,
}: {
  item: BreakdownItem;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-cell text-ink-secondary">
          {item.icon ? (
            <span aria-hidden="true" className="shrink-0">
              {item.icon}
            </span>
          ) : null}
          <span className="truncate">{item.label}</span>
        </span>
        <span className="font-mono text-cell font-medium text-ink shrink-0">
          {item.value}
        </span>
      </div>
      <div className="mt-[6px] h-[5px] w-full overflow-hidden rounded-pill bg-surface-track">
        <div
          className="h-full rounded-pill"
          style={{ width: `${item.pct}%`, background: color ?? "var(--color-accent)" }}
        />
      </div>
    </div>
  );
}

export function BreakdownPanelCard({
  panel,
  empty = "No data for this period.",
}: {
  panel: Panel;
  /** Shown instead of a blank panel, which otherwise reads as a bug. */
  empty?: string;
}) {
  return (
    <Card className="px-5 py-4">
      <h2 className="text-[13.5px] font-semibold text-ink">{panel.title}</h2>
      {panel.rows.length === 0 ? (
        <p className="mt-4 text-meta text-faint">{empty}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-[14px]">
          {panel.rows.map((row) => (
            <BreakdownRow key={row.label} item={row} color={panel.color} />
          ))}
        </div>
      )}
    </Card>
  );
}

export { ProgressBar };
