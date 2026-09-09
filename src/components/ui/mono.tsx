import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Slugs, URLs, numerals, code and keyboard hints are all JetBrains Mono. */
export function Mono({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("font-mono", className)} {...props}>
      {children}
    </span>
  );
}
