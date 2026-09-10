import { after } from "next/server";
import { headers } from "next/headers";
import { recordClick } from "@/resolver/record";
import { resolveLink } from "@/resolver/resolve";

/**
 * The short-link resolver — the most performance-sensitive path in the product
 * (spec §9). It is a catch-all at the root, so any static route above it wins;
 * RESERVED_SLUGS in src/lib/utils.ts mirrors those routes so a link can never be
 * created into a shadowed path.
 */

export const dynamic = "force-dynamic";

/** Redirects are never cached: a cached hop skips us and the click is lost. */
const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

function gone(status: 404 | 410) {
  return new Response(null, { status, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const requestHeaders = await headers();

  const link = await resolveLink(requestHeaders.get("host"), slug);

  // A paused link is answered as missing rather than as "exists but off" —
  // there is no reason to confirm the slug to someone probing.
  if (!link || link.status === "PAUSED") return gone(404);
  if (link.status === "ARCHIVED") return gone(410);

  const viaQr = new URL(_request.url).searchParams.get("qr") === "1";

  // Runs after the response is flushed — and, per the Next docs, even though a
  // redirect was returned.
  after(async () => {
    try {
      await recordClick({ link, headers: requestHeaders, viaQr });
    } catch (error) {
      // A failed write must never surface to the visitor, who has already been
      // redirected by this point.
      console.error(`[resolver] failed to record click for ${link.id}:`, error);
    }
  });

  // 302, not 301: the destination is editable, and a permanently cached hop
  // would both ignore later edits and stop counting that visitor forever.
  return new Response(null, {
    status: 302,
    headers: { ...NO_STORE, Location: link.destination },
  });
}
