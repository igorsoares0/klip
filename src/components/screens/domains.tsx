import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DomainStatusBadge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import type { DomainStatus } from "@/lib/types";

export interface DomainRow {
  id: string;
  host: string;
  note: string | null;
  links: number;
  status: DomainStatus;
}

export function DomainsScreen({ domains }: { domains: DomainRow[] }) {
  return (
    <div className="mx-auto max-w-domains animate-klip-in">
      <PageHeader
        title="Domains"
        sub="Serve short links from your own hostname."
      />

      <Card className="overflow-hidden">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center gap-4 border-b border-divider px-5 py-[14px] last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-body font-medium text-ink">
                {domain.host}
              </p>
              {domain.note ? (
                <p className="mt-1 truncate text-meta text-muted">{domain.note}</p>
              ) : null}
            </div>
            <span className="font-mono text-cell text-muted whitespace-nowrap">
              {domain.links} links
            </span>
            <DomainStatusBadge status={domain.status} />
          </div>
        ))}
      </Card>

      <ComingSoon title="Your own domain" className="mt-[18px]">
        Adding a domain and verifying its DNS arrive in a later release.
      </ComingSoon>
    </div>
  );
}
