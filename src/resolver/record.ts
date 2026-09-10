import { isbot } from "isbot";
import { db } from "@/lib/db";
import { hasDoNotTrack, readGeo, readIp } from "./geo";
import { hashIp } from "./ip-hash";
import { parseUserAgent } from "./user-agent";
import type { ResolvedLink } from "./resolve";

/**
 * Writes the click. Called from `after()`, so it runs once the redirect has
 * already been sent — spec §40 principle 5: analytics must not block redirects.
 */
export async function recordClick(options: {
  link: ResolvedLink;
  headers: Headers;
  viaQr: boolean;
}): Promise<void> {
  const { link, headers, viaQr } = options;

  // The visitor asked not to be tracked and the workspace honours it: they are
  // still redirected, nothing is written.
  if (link.workspace.respectDoNotTrack && hasDoNotTrack(headers)) return;

  const userAgent = headers.get("user-agent");
  const bot = isbot(userAgent ?? undefined);
  const { deviceType, browser, browserVersion, os } = parseUserAgent(userAgent);
  const geo = readGeo(headers);

  // Raw IP is never stored — only a salted hash, and only when the workspace
  // wants visitor-level counting at all (spec §10).
  const ipHash = link.workspace.hashVisitorIps ? hashIp(readIp(headers)) : null;

  await db.$transaction(async (tx) => {
    await tx.linkClick.create({
      data: {
        linkId: link.id,
        workspaceId: link.workspaceId,
        ipHash,
        country: geo.country,
        region: geo.region,
        city: link.workspace.storeCityGeo ? geo.city : null,
        referrer: headers.get("referer"),
        deviceType,
        browser,
        browserVersion,
        os,
        userAgent,
        viaQr,
        isBot: bot,
      },
    });

    // Bot traffic is recorded but not counted: every aggregate in
    // src/analytics/queries.ts filters `isBot: false`, so a counter that
    // included bots would disagree with every chart on the site.
    if (!bot) {
      await tx.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      });

      if (viaQr) {
        await tx.qrCode.updateMany({
          where: { linkId: link.id },
          data: { scans: { increment: 1 } },
        });
      }
    }
  });
}
