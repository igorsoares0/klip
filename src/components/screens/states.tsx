import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateLinkButton } from "@/components/shell/create-link-button";
import { LinkGlyph } from "@/components/icons";
import { DEFAULT_DOMAIN } from "@/lib/utils";

/** Deterministic bar heights, ported from the prototype's skeleton chart. */
const SKELETON_BARS = Array.from(
  { length: 30 },
  (_, i) => 28 + ((i * 37) % 62),
);

const FOUR = [0, 1, 2, 3];
const EIGHT = [0, 1, 2, 3, 4, 5, 6, 7];

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-content">
      <div className="mb-[22px]">
        <Skeleton width={180} height={22} />
        <Skeleton width={280} height={12} className="mt-[10px]" />
      </div>

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {FOUR.map((index) => (
          <Card key={index} className="px-5 py-4">
            <Skeleton width={90} height={11} />
            <Skeleton width={120} height={24} className="mt-[14px]" />
            <Skeleton width={150} height={10} className="mt-[10px]" />
          </Card>
        ))}
      </div>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <Skeleton width={140} height={14} />
        <Skeleton width={200} height={10} className="mt-[8px]" />
        <div className="mt-5 flex h-[170px] items-end gap-[3px]">
          {SKELETON_BARS.map((height, index) => (
            <div key={index} className="h-full flex-1">
              <div className="flex h-full flex-col justify-end">
                <Skeleton height={`${height}%`} className="w-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function LinksSkeleton() {
  return (
    <div className="mx-auto max-w-content">
      <div className="mb-[22px]">
        <Skeleton width={110} height={22} />
        <Skeleton width={240} height={12} className="mt-[10px]" />
      </div>
      <Card>
        {EIGHT.map((index) => (
          <div
            key={index}
            className="flex items-center gap-[14px] border-b border-divider px-[18px] py-[15px] last:border-b-0"
          >
            <Skeleton width={26} height={26} />
            <div className="flex-1">
              <Skeleton width="42%" height={11} />
              <Skeleton width="26%" height={9} className="mt-[7px]" />
            </div>
            <Skeleton width={54} height={11} />
            <Skeleton width={96} height={20} className="rounded-pill" />
            <Skeleton width={62} height={20} className="rounded-pill" />
          </div>
        ))}
      </Card>
    </div>
  );
}

const TIPS = [
  {
    step: "01",
    title: "Shorten",
    description: "Paste any destination and pick a memorable slug.",
  },
  {
    step: "02",
    title: "Share",
    description: "Drop it in a bio, ad, or QR code on a printed piece.",
  },
  {
    step: "03",
    title: "Optimize",
    description: "See which country, device and referrer converts best.",
  },
];

export function DashboardEmpty() {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <EmptyState
        icon={<LinkGlyph size={26} />}
        title="No clicks yet"
        description="Create your first link and share it — analytics start filling in within seconds of the first redirect."
        actions={
          <CreateLinkButton variant="primary">
            Create your first link
          </CreateLinkButton>
        }
      >
        <div className="mt-10 grid w-full gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {TIPS.map((tip) => (
            <Card key={tip.step} className="px-4 py-4 text-left">
              <span className="font-mono text-caption font-semibold text-faint">
                {tip.step}
              </span>
              <p className="mt-2 text-[13px] font-semibold text-ink">
                {tip.title}
              </p>
              <p className="mt-1 text-meta text-muted">{tip.description}</p>
            </Card>
          ))}
        </div>
      </EmptyState>
    </div>
  );
}

export function LinksEmpty() {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <div className="mt-6 flex flex-col items-center rounded-card-lg border border-dashed border-border-hover px-6 py-16 text-center">
        <p className="font-mono text-[19px] text-muted">
          {DEFAULT_DOMAIN}/<span className="text-accent">your-slug</span>
        </p>
        <h2 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">
          Your first short link takes about 10 seconds
        </h2>
        <p className="mt-2 max-w-[420px] text-body text-muted">
          Paste a destination, pick a slug, and every click starts being counted
          the moment someone opens it.
        </p>
        <CreateLinkButton variant="primary" className="mt-6" />
      </div>
    </div>
  );
}
