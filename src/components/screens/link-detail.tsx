import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LinkStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/ui/bar-chart";
import { BreakdownPanelCard } from "@/components/ui/breakdown";
import { ChevronLeft } from "@/components/icons";
import { buildSeries, detailPanels, detailStats } from "@/lib/mock/analytics";
import { getLink } from "@/lib/mock/links";
import { buildFinalUrl } from "@/lib/utils";

const ACTIONS = ["Copy", "QR code", "Edit", "Pause"];

export function LinkDetailScreen({ id }: { id: string }) {
  const link = getLink(id);
  if (!link) notFound();

  const series = buildSeries("30d", 1);
  const destination = buildFinalUrl(link.destinationUrl, link.utm);

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
        title={`${link.domain}/${link.slug}`}
        badge={<LinkStatusBadge status={link.status} />}
        sub={<span className="break-all font-mono text-meta">{destination}</span>}
        action={ACTIONS.map((action) => (
          <Button key={action}>{action}</Button>
        ))}
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {detailStats.map((stat) => (
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
        {detailPanels.map((panel) => (
          <BreakdownPanelCard key={panel.title} panel={panel} />
        ))}
      </div>
    </div>
  );
}
