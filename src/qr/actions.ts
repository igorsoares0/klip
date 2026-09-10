"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/shared/action";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { normalizeHex, validateQrColors } from "./colors";

/**
 * Creates the QR code for a link that does not have one yet.
 *
 * Until now the only way to get a QR was ticking the box at creation time —
 * forget it once and that link could never have one. Idempotent: an existing
 * code is returned as is.
 */
export async function ensureQrCode(linkId: string): Promise<ActionResult<{ id: string }>> {
  const workspaceId = await getCurrentWorkspaceId();

  const link = await db.link.findFirst({
    where: { id: linkId, workspaceId, deletedAt: null },
    select: { id: true, qrCode: { select: { id: true } } },
  });
  if (!link) return fail("That link no longer exists.", "form");
  if (link.qrCode) return ok({ id: link.qrCode.id });

  const qr = await db.qrCode.create({
    data: { workspaceId, linkId: link.id },
    select: { id: true },
  });

  revalidatePath("/dashboard/qr-codes");
  return ok({ id: qr.id });
}

export async function updateQrColors(
  qrId: string,
  fg: string,
  bg: string,
): Promise<ActionResult<{ fg: string; bg: string }>> {
  const workspaceId = await getCurrentWorkspaceId();

  // The popover validates as you pick, but a crafted POST skips the popover.
  const error = validateQrColors({ fg, bg });
  if (error) return fail(error, "form");

  const colors = { fg: normalizeHex(fg), bg: normalizeHex(bg) };

  const result = await db.qrCode.updateMany({
    where: { id: qrId, workspaceId },
    data: { fgColor: colors.fg, bgColor: colors.bg },
  });
  if (result.count === 0) return fail("That QR code no longer exists.", "form");

  revalidatePath("/dashboard/qr-codes");
  return ok(colors);
}
