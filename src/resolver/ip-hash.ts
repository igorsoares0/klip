import { createHash } from "node:crypto";

/**
 * IPv4 has only ~4 billion possible values, so a bare SHA-256 of an address is
 * reversible with a rainbow table in minutes. The salt is what makes the stored
 * hash actually opaque, which is the whole point of spec §10.
 */

const DEV_SALT = "klip-development-salt";

let warned = false;

/**
 * Returns the salted hash, or null when production has no salt configured.
 *
 * Failing closed rather than throwing is deliberate on both counts: throwing at
 * module scope breaks `next build`, and throwing at request time would take
 * down the redirect itself — the one thing that must not fail. Storing no hash
 * costs unique-visitor counting; storing a reversible one would be a privacy
 * violation, so the safe direction is clear.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;

  const salt = process.env.CLICK_IP_SALT;

  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      if (!warned) {
        warned = true;
        console.error(
          "[resolver] CLICK_IP_SALT is not set — visitor hashes are being skipped. " +
            "An unsalted IP hash is reversible, so none is stored.",
        );
      }
      return null;
    }
    return digest(DEV_SALT, ip);
  }

  return digest(salt, ip);
}

function digest(salt: string, ip: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
