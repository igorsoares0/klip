import { Resend } from "resend";

/**
 * Without a verified domain the sender is Resend's sandbox address, which only
 * delivers to the address on the Resend account itself. Set EMAIL_FROM to an
 * address on your own verified domain to reach anyone else.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Klip <onboarding@resend.dev>";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * The Resend SDK does not throw — it returns `{ data, error }`, and treating a
 * failed send as a success is the classic mistake. Every send funnels through
 * here so that check happens exactly once.
 */
export async function send(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** `<event>/<entity-id>`; stops a retry from mailing twice. */
  idempotencyKey: string;
}): Promise<SendResult> {
  if (!resend) {
    // No key configured: keep the flow working in development by printing the
    // message instead of failing the request that triggered it.
    console.info(
      `[email] would send "${options.subject}" to ${options.to}\n${options.text}`,
    );
    return { ok: true };
  }

  const { data, error } = await resend.emails.send(
    {
      from: EMAIL_FROM,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    },
    { idempotencyKey: options.idempotencyKey },
  );

  if (error) {
    console.error(`[email] ${options.subject} to ${options.to} failed:`, error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}
