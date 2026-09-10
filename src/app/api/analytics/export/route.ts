import { db } from "@/lib/db";
import { requireSession, UnauthenticatedError } from "@/auth/session";
import { parseWindowParams, resolveWindow } from "@/analytics/range";
import { csvRow } from "@/analytics/csv";

export const dynamic = "force-dynamic";

const BATCH = 2000;

/**
 * Exports the workspace's clicks for a period as CSV.
 *
 * Deliberately left out:
 * - ipHash. It is not the IP, but it identifies the same visitor across rows —
 *   a pseudonymous fingerprint. It does not leave the system.
 * - userAgent, which is close to an identifier on its own.
 * - bot traffic, so the file adds up to the numbers the screens show.
 *
 * City is a column only when the workspace stores city-level geo — which is what
 * the Settings screen says that toggle does.
 */
export async function GET(request: Request) {
  let workspaceId: string;
  try {
    ({ workspaceId } = await requireSession());
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new Response("Sign in to export analytics.", { status: 401 });
    }
    throw error;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const window = resolveWindow(parseWindowParams(params));

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { storeCityGeo: true },
  });
  const withCity = workspace?.storeCityGeo ?? false;

  const header = [
    "timestamp_utc",
    "link",
    "country",
    "region",
    ...(withCity ? ["city"] : []),
    "referrer",
    "device",
    "browser",
    "os",
    "via_qr",
  ];

  const where = {
    workspaceId,
    isBot: false,
    timestamp: { gte: window.from, lt: window.to },
  };

  const encoder = new TextEncoder();

  // Read in pages and write as we go: the default window alone is tens of
  // thousands of rows, and none of them need to sit in memory at once.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(csvRow(header)));

      let cursor: string | undefined;
      for (;;) {
        const rows = await db.linkClick.findMany({
          where,
          orderBy: [{ timestamp: "asc" }, { id: "asc" }],
          take: BATCH,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            timestamp: true,
            country: true,
            region: true,
            city: true,
            referrer: true,
            deviceType: true,
            browser: true,
            os: true,
            viaQr: true,
            link: { select: { slug: true, domain: { select: { host: true } } } },
          },
        });

        for (const row of rows) {
          controller.enqueue(
            encoder.encode(
              csvRow([
                row.timestamp.toISOString(),
                `${row.link.domain.host}/${row.link.slug}`,
                row.country,
                row.region,
                ...(withCity ? [row.city] : []),
                row.referrer,
                row.deviceType,
                row.browser,
                row.os,
                row.viaQr,
              ]),
            ),
          );
        }

        if (rows.length < BATCH) break;
        cursor = rows[rows.length - 1].id;
      }

      controller.close();
    },
  });

  const day = (d: Date) => d.toISOString().slice(0, 10);
  // `window.to` is exclusive — a custom Sep 1–5 ends at the start of Sep 6 — so
  // name the file after the last instant actually inside it.
  const lastDay = day(new Date(window.to.getTime() - 1));
  const filename = `klip-clicks-${day(window.from)}-to-${lastDay}.csv`;

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
