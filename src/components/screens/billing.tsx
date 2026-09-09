import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/icons";
import { formatNumber } from "@/shared/format";
import type { Invoice } from "@/lib/types";

export interface BillingData {
  plan: { name: string; badge: string; purchased: string };
  usage: { label: string; used: number; limit: number; resets: string };
  invoices: Invoice[];
  entitlements: string[];
}

export function BillingScreen({ data }: { data: BillingData }) {
  const { plan, usage, invoices, entitlements } = data;
  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));

  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader title="Billing" sub="Your plan, usage and receipts." />

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

        <Card className="px-5 pb-4 pt-4">
          <h2 className="text-card-title font-semibold text-ink">Receipts</h2>
          <div className="mt-3 flex flex-col">
            {invoices.map((invoice, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 border-b border-divider py-[11px] last:border-b-0"
              >
                <span className="text-cell text-ink-secondary">
                  {invoice.date}
                </span>
                <span className="font-mono text-cell text-ink">
                  {invoice.amount}
                </span>
                {index === 0 ? (
                  <button
                    type="button"
                    className="cursor-pointer text-meta font-semibold text-accent hover:text-accent-hover"
                  >
                    PDF
                  </button>
                ) : (
                  <span className="w-[26px]" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
