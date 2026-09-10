import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LinkStatusBadge } from "@/components/ui/badge";
import { BarChart } from "@/components/ui/bar-chart";
import { BreakdownPanelCard } from "@/components/ui/breakdown";
import { ChevronLeft } from "@/components/icons";
import { RangePicker } from "@/components/ui/range-picker";
import type { WindowSpec } from "@/analytics/range";
import type { BreakdownPanel, LinkStatus, SeriesPoint, Stat } from "@/lib/types";
import { LinkDetailActions } from "./link-detail-actions";

export interface LinkDetailData {
  id: string;
  period: WindowSpec;
  periodLabel: string;
  shortUrl: string;
  destination: string;
  status: LinkStatus;
  stats: Stat[];
  series: SeriesPoint[];
  panels: BreakdownPanel[];
}

export function LinkDetailScreen({ data }: { data: LinkDetailData }) {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <Link
        href="/dashboard/links"
        className="mb-4 inline-flex items-center gap-1 text-meta font-medium text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={13} /> Back to links
      </Link>

      <PageHeader
        mono
        title={data.shortUrl}
        badge={<LinkStatusBadge status={data.status} />}
        sub={<span className="break-all font-mono text-meta">{data.destination}</span>}
        action={
          <LinkDetailActions id={data.id} shortUrl={data.shortUrl} status={data.status} />
        }
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-card-title font-semibold text-ink">
            Clicks · {data.periodLabel}
          </h2>
          <RangePicker value={data.period} />
        </div>
        <div className="mt-5">
          <BarChart series={data.series} variant="single" height={150} />
        </div>
      </Card>

      <div className="mt-[18px] grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {data.panels.map((panel) => (
          <BreakdownPanelCard key={panel.title} panel={panel} />
        ))}
      </div>
    </div>
  );
}
