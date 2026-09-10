import type { Utm } from "./types";

/** Minimal class joiner. Components take explicit variant props rather than
 *  relying on class-order overrides, so no tailwind-merge is needed. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const DEFAULT_DOMAIN = "klip.to";

/** Slug paths Klip keeps for itself (handoff: create-link validation table). */
/**
 * Paths Klip keeps for itself.
 *
 * This must mirror the real top-level routes: the resolver is a catch-all at
 * `/[slug]`, and a static route always wins over it. A link whose slug collides
 * with a page would be created happily and then be permanently unreachable.
 */
export const RESERVED_SLUGS = [
  "api",
  "admin",
  "dashboard",
  "settings",
  "login",
  "register",
  "onboarding",
  "reset-password",
  "verify-email",
  // Reserved ahead of the marketing pages in spec §32.
  "about",
  "blog",
  "features",
  "pricing",
];

// Handoff rule: ^https?://[^\s.]+\.[^\s]{2,} — case-insensitive so a pasted
// "HTTPS://…" is accepted. The trailing anchor rejects embedded whitespace.
const DESTINATION_RE = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;
const SLUG_RE = /^[a-z0-9-]+$/;

/** Slug inputs normalize as you type: lowercased, whitespace to hyphens. */
export function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function validateDestination(value: string): string | null {
  if (!value.trim()) return null;
  if (!DESTINATION_RE.test(value.trim())) {
    return "Enter a full URL including https://";
  }
  return null;
}

/**
 * Format and reserved-word rules only — pure, so it runs on both sides.
 * Whether a slug is already taken is a database question; see
 * `checkSlugAvailability` in src/links/actions.ts.
 */
export function validateSlug(value: string): string | null {
  const slug = value.trim();
  if (!slug) return null;
  if (RESERVED_SLUGS.includes(slug)) return "That path is reserved by Klip.";
  if (!SLUG_RE.test(slug)) {
    return "Use lowercase letters, numbers and hyphens only.";
  }
  // normalizeSlug turns whitespace into hyphens, so "   " arrives here as "-".
  // A path of pure hyphens is not a link anyone meant to make.
  if (!/[a-z0-9]/.test(slug)) {
    return "Use at least one letter or number.";
  }
  return null;
}

/** Appends the non-empty UTM params to the destination, for the live preview. */
export function buildFinalUrl(destination: string, utm: Utm): string {
  const params = new URLSearchParams();
  const map: Array<[keyof Utm, string]> = [
    ["source", "utm_source"],
    ["medium", "utm_medium"],
    ["campaign", "utm_campaign"],
    ["term", "utm_term"],
    ["content", "utm_content"],
  ];
  for (const [key, param] of map) {
    const value = utm[key]?.trim();
    if (value) params.set(param, value);
  }
  const query = params.toString();
  if (!query) return destination;
  return destination + (destination.includes("?") ? "&" : "?") + query;
}

export function randomSlug(): string {
  const words = ["launch", "drop", "promo", "bio", "sale", "beta", "invite"];
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}-${Math.random().toString(36).slice(2, 6)}`;
}
