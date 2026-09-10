import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/icons";
import { ComingSoon } from "@/components/ui/coming-soon";
import { formatNumber } from "@/shared/format";

export interface BillingData {
  plan: { name: string; badge: string; purchased: string };
  usage: { label: string; used: number; limit: number; resets: string };
  entitlements: string[];
}

export function BillingScreen({ data }: { data: BillingData }) {
  const { plan, usage, entitlements } = data;
  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader title="Billing" sub="Your plan and usage." />

      <div className="rounded-panel bg-ink px-6 py-6">
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          <div>
            <span className="inline-flex rounded-pill border border-lime px-[10px] py-[3px] font-mono text-[10.5px] font-semibold tracking-eyebrow text-lime uppercase">
              {plan.badge}
            </span>
            <h2 className="mt-4 text-metric font-bold tracking-tighter text-white">
              {plan.name}
            </h2>
            <p className="mt-2 text-meta text-white/60">{plan.purchased}</p>
          </div>

          <div className="self-center">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-meta text-white/60">{usage.label}</span>
              <span className="font-mono text-cell font-semibold text-white">
                {formatNumber(usage.used)} / {formatNumber(usage.limit)}
              </span>
            </div>
            <div className="mt-[10px] h-[6px] w-full overflow-hidden rounded-pill bg-white/15">
              <div
                className="h-full rounded-pill bg-lime"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-[10px] text-[11.5px] text-white/50">{usage.resets}</p>
          </div>
        </div>
      </div>

      <div className="mt-[18px] grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <Card className="px-5 pb-5 pt-4">
          <h2 className="text-card-title font-semibold text-ink">
            What&apos;s included
          </h2>
          <ul className="mt-4 flex flex-col gap-[10px]">
            {entitlements.map((item) => (
              <li key={item} className="flex items-center gap-[10px] text-cell text-ink-secondary">
                <CheckIcon size={14} className="shrink-0 text-positive" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <ComingSoon title="Receipts" className="self-start">
          Purchases and receipts arrive with Paddle checkout, in a later release.
        </ComingSoon>
      </div>
    </div>
  );
}
