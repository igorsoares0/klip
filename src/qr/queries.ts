import { db } from "@/lib/db";
import { shortDate } from "@/shared/format";
import { renderQrSvg } from "./render";
import { qrTargetUrl } from "./url";
import { NOT_DELETED } from "@/links/live";

export interface QrCard {
  id: string;
  slug: string;
  domain: string;
  scans: number;
  createdAt: string;
  fgColor: string;
  bgColor: string;
  /** Rendered on the server: the card shows a real, scannable code with no client JS. */
  svg: string;
}

export async function listQrCodes(workspaceId: string): Promise<QrCard[]> {
  const rows = await db.qrCode.findMany({
    // A QR whose link was deleted has nothing to point at any more.
    where: { workspaceId, link: NOT_DELETED },
    include: {
      link: { include: { domain: { select: { host: true } } } },
    },
    orderBy: { scans: "desc" },
  });

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      slug: row.link.slug,
      domain: row.link.domain.host,
      scans: row.scans,
      createdAt: shortDate(row.createdAt),
      fgColor: row.fgColor,
      bgColor: row.bgColor,
      svg: await renderQrSvg(qrTargetUrl(row.link.domain.host, row.link.slug), {
        fg: row.fgColor,
        bg: row.bgColor,
      }),
    })),
  );
}
