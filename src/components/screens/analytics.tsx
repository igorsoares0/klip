import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/bar-chart";
import { BreakdownPanelCard } from "@/components/ui/breakdown";
import { buildSeries, workspacePanels, workspaceStats } from "@/lib/mock/analytics";

/**
 * Workspace-level analytics. The handoff has no screen for this nav item — it
 * is composed from the same pieces as the link detail, aggregating every link
 * in the workspace instead of one.
 */
export function AnalyticsScreen() {
  const series = buildSeries("30d", 2);

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Analytics"
        sub="Every click across the workspace, last 30 days."
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {workspaceStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">
          Clicks · last 30 days
        </h2>
        <div className="mt-5">
          <BarChart series={series} variant="single" height={150} />
        </div>
      </Card>

      <div className="mt-[18px] grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {workspacePanels.map((panel) => (
          <BreakdownPanelCard key={panel.title} panel={panel} />
        ))}
      </div>
    </div>
  );
}
