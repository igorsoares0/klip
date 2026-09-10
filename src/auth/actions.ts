"use server";

import { db } from "@/lib/db";
import { fail, ok, text, type ActionResult } from "@/shared/action";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/emails/send";
import { hashPassword, validatePassword, verifyPassword } from "./password";
import { consumeToken, issueToken } from "./tokens";
import { ensureWorkspaceFor } from "./workspace";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function register(
  form: FormData,
): Promise<ActionResult<{ email: string }>> {
  const name = text(form, "name");
  const email = normalizeEmail(text(form, "email"));
  const password = String(form.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.", "form");

  const passwordError = validatePassword(password);
  if (passwordError) return fail(passwordError, "form");

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return fail("An account with that email already exists.", "form");
  }

  const passwordHash = await hashPassword(password);

  // Spec §6: User -> Workspace -> WorkspaceMember, atomically. A user without a
  // workspace would have nowhere to put anything.
  const user = await db.user.create({
    data: { email, name: name || null, passwordHash },
    select: { id: true, email: true },
  });
  await ensureWorkspaceFor(user.id, user.email);

  const { token } = await issueToken(user.id, "VERIFY_EMAIL");
  // A failed send must not undo the account — the user can ask again.
  await sendVerificationEmail({ to: user.email, userId: user.id, token });

  return ok({ email: user.email });
}

export async function verifyEmail(token: string): Promise<ActionResult<void>> {
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  if (!userId) return fail("That link is invalid or has expired.", "form");

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return ok(undefined);
}

export async function requestPasswordReset(
  form: FormData,
): Promise<ActionResult<void>> {
  const email = normalizeEmail(text(form, "email"));
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.", "form");

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  // Deliberately identical response whether or not the account exists, and
  // whether or not it has a password — otherwise this form answers "does this
  // person have an account here?" for anyone who asks.
  if (user?.passwordHash) {
    const { id, token } = await issueToken(user.id, "PASSWORD_RESET");
    await sendPasswordResetEmail({ to: user.email, tokenId: id, token });
  }

  return ok(undefined);
}

export async function resetPassword(
  form: FormData,
): Promise<ActionResult<void>> {
  const token = text(form, "token");
  const password = String(form.get("password") ?? "");

  const passwordError = validatePassword(password);
  if (passwordError) return fail(passwordError, "form");

  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) return fail("That link is invalid or has expired.", "form");

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      // Reaching the reset link proves control of the mailbox.
      emailVerified: new Date(),
    },
  });

  return ok(undefined);
}

/** Used by the "resend" affordance after signing up. */
export async function resendVerification(
  email: string,
): Promise<ActionResult<void>> {
  const user = await db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, emailVerified: true },
  });

  if (user && !user.emailVerified) {
    const { token } = await issueToken(user.id, "VERIFY_EMAIL");
    await sendVerificationEmail({ to: user.email, userId: user.id, token });
  }

  return ok(undefined);
}

/** Exported for the tests; the sign-in path itself goes through Auth.js. */
export async function checkCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return false;
  return verifyPassword(password, user.passwordHash);
}
