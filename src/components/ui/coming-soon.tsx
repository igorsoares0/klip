import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Stands in for a feature whose screen exists before the feature does. The
 * design filled these spots with working-looking buttons and sample output;
 * a control that does nothing reads as a bug, so it says plainly what is coming
 * instead.
 */
export function ComingSoon({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-card-title font-semibold text-ink">{title}</h2>
          <Badge>Coming soon</Badge>
        </div>
        <p className="mt-2 text-meta text-muted">{children}</p>
      </div>
    </Card>
  );
}
