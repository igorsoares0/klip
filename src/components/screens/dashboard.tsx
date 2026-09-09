"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SegmentedControl } from "@/components/ui/segmented";
import { BarChart, ChartLegend } from "@/components/ui/bar-chart";
import { BreakdownRow } from "@/components/ui/breakdown";
import { ArrowRight } from "@/components/icons";
import {
  breakdownTabs,
  breakdowns,
  buildSeries,
  dashboardStats,
  fastestGrowing,
  rangeLabel,
  ranges,
  topLinks,
  type BreakdownTab,
} from "@/lib/mock/analytics";
import type { TimeRange } from "@/lib/types";

const AXIS = ["Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 07"];

export function DashboardScreen() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [tab, setTab] = useState<BreakdownTab>("countries");
  const series = useMemo(() => buildSeries(range), [range]);

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="Overview"
        sub="Everything happening across 248 active links."
        action={
          <SegmentedControl
            options={ranges}
            value={range}
            onChange={setRange}
          />
        }
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {dashboardStats.map((stat) => (
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
              {rangeLabel(range)} · hover a bar for detail
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
          <BarChart series={series} axis={AXIS} />
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
            {topLinks.map((link) => (
              <Link
                key={link.slug}
                href="/dashboard/links/link_summer_sale"
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
              options={breakdownTabs}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="mt-4 flex flex-col gap-[14px]">
            {breakdowns[tab].map((item) => (
              <BreakdownRow key={item.label} item={item} />
            ))}
          </div>
        </Card>

        <Card className="border-transparent bg-ink px-5 pb-5 pt-4">
          <h2 className="text-card-title font-semibold text-white">
            Fastest growing
          </h2>
          <p className="mt-5 font-mono text-body text-lime">
            {fastestGrowing.slug}
          </p>
          <p className="mt-2 font-mono text-metric font-bold tracking-tighter text-white">
            {fastestGrowing.clicks}
          </p>
          <p className="mt-2 text-cell font-semibold text-lime">
            {fastestGrowing.delta}
          </p>
          <p className="mt-3 text-caption text-white/60">{fastestGrowing.note}</p>
        </Card>
      </div>
    </div>
  );
}
