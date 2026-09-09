import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DomainStatusBadge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/icons";
import { domains, verification } from "@/lib/mock/domains";

export function DomainsScreen() {
  return (
    <div className="mx-auto max-w-domains animate-klip-in">
      <PageHeader
        title="Domains"
        sub="Serve short links from your own hostname."
        action={
          <Button variant="primary" icon={<PlusIcon size={15} />}>
            Add domain
          </Button>
        }
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
              <p className="mt-1 truncate text-meta text-muted">{domain.note}</p>
            </div>
            <span className="font-mono text-cell text-muted whitespace-nowrap">
              {domain.links} links
            </span>
            <DomainStatusBadge status={domain.status} />
          </div>
        ))}
      </Card>

      <Card className="mt-[18px] px-5 pb-5 pt-4">
        <h2 className="text-card-title font-semibold text-ink">
          Verify <span className="font-mono">{verification.host}</span>
        </h2>
        <p className="mt-1 text-meta text-muted">
          Add this record at your DNS provider. Verification usually completes
          within a few minutes.
        </p>

        <div className="mt-4 rounded-block bg-ink px-4 py-[14px]">
          <div className="grid gap-y-2 [grid-template-columns:70px_1fr]">
            {verification.record.map((row) => (
              <div key={row.key} className="contents">
                <span className="font-mono text-[11.5px] text-white/45">
                  {row.key}
                </span>
                <span
                  className={
                    row.key === "VALUE"
                      ? "font-mono text-cell text-lime"
                      : "font-mono text-cell text-white"
                  }
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary">Check DNS</Button>
          <Button>Copy record</Button>
        </div>
      </Card>
    </div>
  );
}
