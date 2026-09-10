import type { DeviceType } from "@/generated/prisma/enums";

/**
 * User-agent buckets, exactly the ones spec §11 defines — nothing finer.
 *
 * Hand-rolled on purpose: ua-parser-js went AGPL-3.0 at v2, which is a poor fit
 * for a commercial product, and the buckets here are coarse enough that a full
 * parser would be answering a question nobody asked.
 *
 * Order matters throughout. Every Chrome UA also says "Safari", Edge says both,
 * and iPadOS reports itself as a Mac — so the specific test always runs first.
 */

export interface ParsedUserAgent {
  deviceType: DeviceType;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
}

function version(ua: string, pattern: RegExp): string | null {
  return ua.match(pattern)?.[1] ?? null;
}

export function parseOs(ua: string): string | null {
  if (!ua) return null;
  // Android must precede Linux: every Android UA also contains "Linux".
  if (/Android/i.test(ua)) return "Android";
  if (/(iPhone|iPad|iPod)/i.test(ua)) return "iOS";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Linux|X11/i.test(ua)) return "Linux";
  return "Other";
}

export function parseDevice(ua: string, os: string | null): DeviceType {
  if (!ua) return "UNKNOWN";

  if (/iPad/i.test(ua)) return "TABLET";
  // iPadOS 13+ masquerades as a Mac; the touch hint is what gives it away.
  if (os === "macOS" && /Mobile\/|Touch/i.test(ua)) return "TABLET";
  if (/Tablet|PlayBook|Silk/i.test(ua)) return "TABLET";
  // An Android without "Mobile" is a tablet, per Google's own guidance.
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "TABLET";

  if (/(iPhone|iPod|Mobile|Windows Phone|IEMobile|Opera Mini)/i.test(ua)) {
    return "MOBILE";
  }

  if (/(Windows NT|Macintosh|Mac OS X|CrOS|X11|Linux)/i.test(ua)) {
    return "DESKTOP";
  }

  return "UNKNOWN";
}

export function parseBrowser(ua: string): {
  browser: string | null;
  browserVersion: string | null;
} {
  if (!ua) return { browser: null, browserVersion: null };

  // In-app webviews first: they carry Chrome/Safari tokens too, and the design
  // shows "Instagram in-app" as its own row.
  if (/Instagram/i.test(ua)) {
    return { browser: "Instagram in-app", browserVersion: version(ua, /Instagram (\d+[\d.]*)/i) };
  }
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) {
    return { browser: "Facebook in-app", browserVersion: version(ua, /FBAV\/(\d+[\d.]*)/i) };
  }

  if (/Edg[A-Z]?\//i.test(ua)) {
    return { browser: "Edge", browserVersion: version(ua, /Edg[A-Z]?\/(\d+[\d.]*)/i) };
  }
  if (/OPR\/|Opera/i.test(ua)) {
    return { browser: "Opera", browserVersion: version(ua, /(?:OPR|Opera)[/ ](\d+[\d.]*)/i) };
  }
  if (/Firefox\/|FxiOS\//i.test(ua)) {
    return { browser: "Firefox", browserVersion: version(ua, /(?:Firefox|FxiOS)\/(\d+[\d.]*)/i) };
  }
  // Chrome before Safari: Chrome's UA claims to be Safari as well.
  if (/Chrome\/|CriOS\//i.test(ua)) {
    return { browser: "Chrome", browserVersion: version(ua, /(?:Chrome|CriOS)\/(\d+[\d.]*)/i) };
  }
  if (/Safari\//i.test(ua)) {
    return { browser: "Safari", browserVersion: version(ua, /Version\/(\d+[\d.]*)/i) };
  }

  return { browser: "Other", browserVersion: null };
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = (userAgent ?? "").trim();
  const os = parseOs(ua);
  const { browser, browserVersion } = parseBrowser(ua);

  return {
    deviceType: parseDevice(ua, os),
    browser,
    browserVersion,
    os,
  };
}
