/**
 * Geolocation comes from the CDN in front of the app — spec §26 puts Cloudflare
 * there. No local database to version and update; the trade is that there is no
 * geo at all in development, where the headers are absent.
 */

export interface Geo {
  country: string | null;
  region: string | null;
  city: string | null;
}

function header(headers: Headers, ...names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    // Cloudflare sends "XX" for addresses it cannot place.
    if (value && value !== "XX") return value;
  }
  return null;
}

export function readGeo(headers: Headers): Geo {
  return {
    country: header(headers, "cf-ipcountry", "x-vercel-ip-country"),
    region: header(headers, "cf-region-code", "cf-region", "x-vercel-ip-country-region"),
    city: decodeCity(header(headers, "cf-ipcity", "x-vercel-ip-city")),
  };
}

/** Vercel percent-encodes city names; Cloudflare does not. */
function decodeCity(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The visitor's address, from whichever proxy header is present. Only ever used
 * to derive a salted hash — the raw value is never stored (spec §10).
 */
export function readIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxies.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("cf-connecting-ip") ?? headers.get("x-real-ip") ?? null;
}

/** `DNT: 1` means the visitor asked not to be tracked. */
export function hasDoNotTrack(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}
