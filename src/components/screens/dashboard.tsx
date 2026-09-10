"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SegmentedControl } from "@/components/ui/segmented";
import { RangePicker } from "@/components/ui/range-picker";
import { BarChart, ChartLegend } from "@/components/ui/bar-chart";
import { BreakdownRow } from "@/components/ui/breakdown";
import { ArrowRight } from "@/components/icons";
import type { WindowSpec } from "@/analytics/range";
import type { BreakdownItem, SeriesPoint, Stat, TopLink } from "@/lib/types";

export type BreakdownTab = "countries" | "referrers" | "devices";

const TABS: Array<{ id: BreakdownTab; label: string }> = [
  { id: "countries", label: "Countries" },
  { id: "referrers", label: "Referrers" },
  { id: "devices", label: "Devices" },
];

export interface DashboardData {
  period: WindowSpec;
  /** "30 days", or "Sep 1 – Sep 10" for a custom range. */
  periodLabel: string;
  stats: Stat[];
  series: SeriesPoint[];
  axis: string[];
  topLinks: TopLink[];
  breakdowns: Record<BreakdownTab, BreakdownItem[]>;
  fastestGrowing: {
    slug: string;
    clicks: string;
    delta: string;
    note: string;
  } | null;
  activeLinks: number;
}

export function DashboardScreen({ data }: { data: DashboardData }) {
  // Only the breakdown tab stays client-side: all three sets already arrived,
  // so switching costs nothing. The period drives every query, so it lives in
  // the URL (via RangePicker) and re-runs them on the server.
  const [tab, setTab] = useState<BreakdownTab>("countries");

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Overview"
        sub={`Everything happening across ${data.activeLinks} active links.`}
        action={<RangePicker value={data.period} />}
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-card-title font-semibold text-ink">
              Clicks over time
            </h2>
            <p className="mt-1 text-meta text-muted">
              {data.periodLabel} · hover a bar for detail
            </p>
          </div>
          <ChartLegend
            items={[
              { label: "Clicks", color: "var(--color-accent)" },
              { label: "Unique", color: "var(--color-accent-soft)" },
            ]}
          />
        </div>
        <div className="mt-5">
          <BarChart series={data.series} axis={data.axis} />
        </div>
      </Card>

      <div className="mt-[18px] grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <Card className="px-5 pb-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-card-title font-semibold text-ink">Top links</h2>
            <Link
              href="/dashboard/links"
              className="flex items-center gap-1 text-meta font-semibold text-accent hover:text-accent-hover"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-3 flex flex-col">
            {data.topLinks.map((link) => (
              <Link
                key={link.slug}
                href="/dashboard/links"
                className="-mx-5 flex items-center gap-3 px-5 py-[9px] transition-colors hover:bg-surface-hover"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-cell font-medium text-ink">
                    {link.slug}
                  </span>
                  <span className="block truncate text-[11px] text-faint">
                    {link.destinationUrl}
                  </span>
                </span>
                <span className="h-[5px] w-[110px] shrink-0 overflow-hidden rounded-pill bg-surface-track">
                  <span
                    className="block h-full rounded-pill bg-ink"
                    style={{ width: `${link.pct}%` }}
                  />
                </span>
                <span className="w-[52px] shrink-0 text-right font-mono text-cell font-medium text-ink">
                  {link.clicks}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="px-5 pb-5 pt-4">
          <h2 className="text-card-title font-semibold text-ink">Breakdown</h2>
          <div className="mt-3">
            <SegmentedControl
              variant="raised"
              options={TABS}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="mt-4 flex flex-col gap-[14px]">
            {data.breakdowns[tab].map((item) => (
              <BreakdownRow key={item.label} item={item} />
            ))}
          </div>
        </Card>

        {data.fastestGrowing ? (
          <Card className="border-transparent bg-ink px-5 pb-5 pt-4">
            <h2 className="text-card-title font-semibold text-white">
              Fastest growing
            </h2>
            <p className="mt-5 font-mono text-body text-lime">
              {data.fastestGrowing.slug}
            </p>
            <p className="mt-2 font-mono text-metric font-bold tracking-tighter text-white">
              {data.fastestGrowing.clicks}
            </p>
            <p className="mt-2 text-cell font-semibold text-lime">
              {data.fastestGrowing.delta}
            </p>
            <p className="mt-3 text-caption text-white/60">
              {data.fastestGrowing.note}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
