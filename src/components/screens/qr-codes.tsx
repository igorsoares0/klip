import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { qrCells, qrCodes } from "@/lib/mock/qr";
import { DEFAULT_DOMAIN, formatNumber } from "@/lib/utils";

/**
 * The 13x13 grid is the prototype's placeholder pattern.
 * TODO: swap for a real QR renderer (`qrcode` / `qr-code-styling`) once the
 * short link resolves to a real URL.
 */
function QrPreview({ seed }: { seed: number }) {
  const cells = qrCells(seed);
  return (
    <div className="flex items-center justify-center rounded-block bg-surface-sunken py-6">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: "repeat(13, 7px)" }}
        aria-hidden="true"
      >
        {cells.map((on, index) => (
          <span
            key={index}
            className={on ? "bg-ink" : "bg-transparent"}
            style={{ width: 7, height: 7 }}
          />
        ))}
      </div>
    </div>
  );
}

export function QrCodesScreen() {
  return (
    <div className="mx-auto max-w-content animate-klip-in">
      <PageHeader
        title="QR Codes"
        sub="Every code points to the short link — change the destination anytime without reprinting."
      />

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {qrCodes.map((qr, index) => (
          <Card key={qr.id} className="px-4 pb-4 pt-4">
            <QrPreview seed={11 + index * 37} />
            <p className="mt-3 font-mono text-cell font-medium text-ink">
              {DEFAULT_DOMAIN}/{qr.slug}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {formatNumber(qr.scans)} scans · {qr.createdAt}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button size="sm">PNG</Button>
              <Button size="sm">SVG</Button>
              <Button size="sm">Style</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
