"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/shared/action";
import { getCurrentWorkspaceId } from "@/workspaces/current";

const PREFIX = "klip_live";

/**
 * API keys are high-entropy random strings, so a fast cryptographic hash is the
 * right primitive — bcrypt/Argon2id exist to slow down guessing of *weak*
 * secrets, which is why spec §3 requires them for passwords and not here.
 */
function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export interface RevealedKey {
  id: string;
  name: string;
  /** Returned exactly once, at creation. Only the hash is stored. */
  plaintext: string;
}

export async function createApiKey(): Promise<ActionResult<RevealedKey>> {
  const workspaceId = await getCurrentWorkspaceId();

  // The design's "Create API key" button has no name field, but the list shows
  // names — number them so they stay distinguishable.
  const count = await db.apiKey.count({ where: { workspaceId } });
  const name = count === 0 ? "New key" : `New key ${count + 1}`;

  const secret = randomBytes(24).toString("base64url");
  const plaintext = `${PREFIX}_${secret}`;

  const key = await db.apiKey.create({
    data: {
      workspaceId,
      name,
      hashedKey: hashKey(plaintext),
      keyPrefix: PREFIX,
      last4: plaintext.slice(-4),
      scope: "READ",
    },
    select: { id: true, name: true },
  });

  revalidatePath("/dashboard/api");
  return ok({ id: key.id, name: key.name, plaintext });
}

export async function revokeApiKey(id: string): Promise<ActionResult<void>> {
  const workspaceId = await getCurrentWorkspaceId();

  // Scoped by workspace: a key id from another tenant must simply not match.
  const result = await db.apiKey.updateMany({
    where: { id, workspaceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (result.count === 0) return fail("That key no longer exists.", "form");

  revalidatePath("/dashboard/api");
  return ok(undefined);
}
