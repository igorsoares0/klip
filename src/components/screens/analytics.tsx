import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/bar-chart";
import { BreakdownPanelCard } from "@/components/ui/breakdown";
import { RangePicker } from "@/components/ui/range-picker";
import type { WindowSpec } from "@/analytics/range";
import type { BreakdownPanel, SeriesPoint, Stat } from "@/lib/types";

export interface AnalyticsData {
  period: WindowSpec;
  periodLabel: string;
  stats: Stat[];
  series: SeriesPoint[];
  axis: string[];
  panels: BreakdownPanel[];
  geoPanels: BreakdownPanel[];
  /** The export URL for the period on screen. */
  exportHref: string;
}

/**
 * Workspace-level analytics. The handoff has no screen for this nav item — it
 * is composed from the same pieces as the link detail, aggregating every link
 * in the workspace instead of one.
 */
export function AnalyticsScreen({ data }: { data: AnalyticsData }) {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Analytics"
        sub="Every click across the workspace."
        action={
          <>
            <a
              href={data.exportHref}
              download
              className="inline-flex h-[34px] items-center justify-center rounded-nav border border-border-strong bg-surface px-4 text-[13px] font-semibold whitespace-nowrap text-ink transition-colors hover:border-border-hover"
            >
              Export CSV
            </a>
            <RangePicker value={data.period} />
          </>
        }
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">
          Clicks · {data.periodLabel}
        </h2>
        <div className="mt-5">
          <BarChart series={data.series} variant="single" height={150} axis={data.axis} />
        </div>
      </Card>

      <div className="mt-[18px] grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {data.panels.map((panel) => (
          <BreakdownPanelCard key={panel.title} panel={panel} />
        ))}
        {data.geoPanels.map((panel) => (
          <BreakdownPanelCard
            key={panel.title}
            panel={panel}
            empty="Region and city come from the CDN in front of the app, so they only appear in production."
          />
        ))}
      </div>
    </div>
  );
}
