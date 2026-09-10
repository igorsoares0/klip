import { send, type SendResult } from "./client";
import { passwordResetEmail, verificationEmail } from "./templates";

function appUrl(path: string): string {
  const base =
    process.env.AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export async function sendVerificationEmail(options: {
  to: string;
  userId: string;
  token: string;
}): Promise<SendResult> {
  const mail = verificationEmail(appUrl(`/verify-email/${options.token}`));
  return send({
    to: options.to,
    ...mail,
    // Re-issuing invalidates the old token, so key on the user: a retry of the
    // same request will not mail twice.
    idempotencyKey: `verify-email/${options.userId}`,
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  tokenId: string;
  token: string;
}): Promise<SendResult> {
  const mail = passwordResetEmail(appUrl(`/reset-password/${options.token}`));
  return send({
    to: options.to,
    ...mail,
    // Keyed on the token, not the user: asking again is a new request and must
    // deliver a new link.
    idempotencyKey: `password-reset/${options.tokenId}`,
  });
}
