import { db } from "@/lib/db";
import { requireSession, UnauthenticatedError } from "@/auth/session";
import { renderQrPng, renderQrSvg } from "@/qr/render";
import { qrTargetUrl } from "@/qr/url";

export const dynamic = "force-dynamic";

/**
 * Downloads a QR code as PNG or SVG.
 *
 * The id comes straight from the URL, so anyone can put any id here. The lookup
 * is scoped to the caller's workspace — another tenant's code is a 404, never a
 * download.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let workspaceId: string;
  try {
    ({ workspaceId } = await requireSession());
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new Response("Sign in to download QR codes.", { status: 401 });
    }
    throw error;
  }

  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") === "svg" ? "svg" : "png";

  const qr = await db.qrCode.findFirst({
    where: { id, workspaceId, link: { deletedAt: null } },
    select: {
      fgColor: true,
      bgColor: true,
      link: { select: { slug: true, domain: { select: { host: true } } } },
    },
  });
  if (!qr) return new Response("Not found.", { status: 404 });

  const text = qrTargetUrl(qr.link.domain.host, qr.link.slug);
  const colors = { fg: qr.fgColor, bg: qr.bgColor };
  const filename = `${qr.link.slug}-qr.${format}`;

  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };

  if (format === "svg") {
    return new Response(await renderQrSvg(text, colors), {
      headers: { ...headers, "Content-Type": "image/svg+xml" },
    });
  }

  const png = await renderQrPng(text, colors);
  return new Response(new Uint8Array(png), {
    headers: { ...headers, "Content-Type": "image/png" },
  });
}
