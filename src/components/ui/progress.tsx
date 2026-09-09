import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  color = "bg-accent",
  track = "bg-surface-track",
  height = 5,
  className,
}: {
  /** 0-100 */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-pill", track, className)}
      style={{ height }}
    >
      <div
        className={cn("h-full rounded-pill", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
