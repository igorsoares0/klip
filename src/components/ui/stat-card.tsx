import { Card } from "./card";
import { DeltaPill } from "./badge";
import type { Stat } from "@/lib/types";

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-meta text-muted">{stat.label}</p>
      <div className="mt-[10px] flex items-center gap-[10px]">
        <span className="font-mono text-metric font-bold tracking-tighter text-ink">
          {stat.value}
        </span>
        {stat.delta ? (
          <DeltaPill value={stat.delta} direction={stat.deltaDirection} />
        ) : null}
      </div>
      {stat.sub ? (
        <p className="mt-[6px] text-caption text-faint">{stat.sub}</p>
      ) : null}
    </Card>
  );
}
