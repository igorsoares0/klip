import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  width,
  height = 12,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <div className={cn("skeleton", className)} style={{ width, height }} />
  );
}
