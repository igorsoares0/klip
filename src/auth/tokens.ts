import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { EmailTokenType } from "@/generated/prisma/enums";

/**
 * Email tokens are high-entropy random strings. Only their SHA-256 hash is
 * stored: a password-reset token sitting in the clear in the database is
 * password-equivalent.
 */

const TTL_MINUTES: Record<EmailTokenType, number> = {
  VERIFY_EMAIL: 60 * 24, // a day — people open signup mail late
  PASSWORD_RESET: 60, // an hour — a live path to changing a password
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface IssuedToken {
  id: string;
  /** The value that goes in the emailed link. Never stored. */
  token: string;
}

export async function issueToken(
  userId: string,
  type: EmailTokenType,
): Promise<IssuedToken> {
  // Any outstanding token of the same kind is spent — asking again invalidates
  // the previous link rather than leaving several live at once.
  await db.emailToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  const row = await db.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL_MINUTES[type] * 60_000),
    },
    select: { id: true },
  });

  return { id: row.id, token };
}

/**
 * Consumes a token: valid exactly once, and only before it expires. Returns the
 * userId it belonged to, or null.
 */
export async function consumeToken(
  token: string,
  type: EmailTokenType,
): Promise<string | null> {
  if (!token) return null;

  const row = await db.emailToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });

  if (!row) return null;
  if (row.type !== type) return null;
  if (row.usedAt) return null;
  if (row.expiresAt < new Date()) return null;

  // Marking used is conditional on it still being unused, so two simultaneous
  // clicks cannot both succeed.
  const claimed = await db.emailToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  return row.userId;
}
