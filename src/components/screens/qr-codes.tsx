import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/shared/format";
import type { QrCard } from "@/qr/queries";
import { QrStylePopover } from "./qr-style-popover";

const DOWNLOAD =
  "inline-flex h-[30px] items-center justify-center rounded-nav border border-border-strong bg-surface px-3 text-meta font-semibold whitespace-nowrap text-ink transition-colors hover:border-border-hover";

export function QrCodesScreen({ qrCodes }: { qrCodes: QrCard[] }) {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="QR Codes"
        sub="Every code points to the short link — change the destination anytime without reprinting."
      />

      {qrCodes.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-body font-medium text-ink">No QR codes yet</p>
          <p className="mt-1 text-meta text-muted">
            Tick “Generate QR code” when creating a link, or use “QR code” on any
            link to make one.
          </p>
        </Card>
      ) : (
        <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {qrCodes.map((qr) => (
            <Card key={qr.id} className="px-4 pb-4 pt-4">
              <div
                className="flex items-center justify-center rounded-block p-4"
                style={{ background: qr.bgColor }}
              >
                {/* Server-rendered SVG from the qrcode library: a real code that scans. */}
                <div
                  className="w-[140px] [&>svg]:h-auto [&>svg]:w-full"
                  role="img"
                  aria-label={`QR code for ${qr.domain}/${qr.slug}`}
                  dangerouslySetInnerHTML={{ __html: qr.svg }}
                />
              </div>
              <p className="mt-3 truncate font-mono text-cell font-medium text-ink">
                {qr.domain}/{qr.slug}
              </p>
              <p className="mt-1 text-[11.5px] text-muted">
                {formatNumber(qr.scans)} scans · {qr.createdAt}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <a className={DOWNLOAD} href={`/api/qr/${qr.id}?format=png`} download>
                  PNG
                </a>
                <a className={DOWNLOAD} href={`/api/qr/${qr.id}?format=svg`} download>
                  SVG
                </a>
                <QrStylePopover qrId={qr.id} fg={qr.fgColor} bg={qr.bgColor} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
