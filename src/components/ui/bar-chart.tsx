import { cn } from "@/lib/utils";
import type { SeriesPoint } from "@/lib/types";

/**
 * Two variants, both 30 bars with a 3px gap:
 * - "stacked" (dashboard): clicks segment over a unique-visitors segment.
 * - "single" (link/workspace detail): one ink-toned bar, accent on hover.
 *
 * Heights follow the prototype's 66% / 30% split of the plot area.
 */
export function BarChart({
  series,
  variant = "stacked",
  height = 170,
  axis,
}: {
  series: SeriesPoint[];
  variant?: "stacked" | "single";
  height?: number;
  axis?: string[];
}) {
  const max = Math.max(...series.map((point) => point.clicks), 1);

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {series.map((point, index) => {
          const ratio = point.clicks / max;
          return (
            <div
              key={index}
              title={point.label}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div
                className={cn(
                  "w-full transition-colors",
                  variant === "stacked"
                    ? "rounded-t-[3px] bg-accent hover:bg-accent-hover"
                    : "rounded-[3px] bg-ink hover:bg-accent",
                )}
                style={{ height: `${ratio * 66}%` }}
              />
              {variant === "stacked" ? (
                <div
                  className="w-full rounded-b-[3px] bg-accent-soft"
                  style={{ height: `${(point.unique / max) * 30}%` }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {axis ? (
        <div className="mt-[10px] flex justify-between font-mono text-[10.5px] text-faint">
          {axis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div className="flex items-center gap-[14px]">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-[6px] text-caption text-muted"
        >
          <span
            className="h-[8px] w-[8px] rounded-[2px]"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
