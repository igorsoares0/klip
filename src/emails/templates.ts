/**
 * Transactional templates, styled with the design tokens. Kept as plain strings
 * so there is no build step between here and the inbox — React Email is the
 * upgrade path if these grow.
 */

const INK = "#15151A";
const MUTED = "#75757F";
const ACCENT = "#3B2FE8";
const CANVAS = "#F5F4F1";

function layout(heading: string, body: string, cta: { label: string; url: string }): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:${CANVAS};font-family:'Instrument Sans',system-ui,sans-serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:14px;border:1px solid rgba(20,20,26,.08)" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px">
        <p style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-.02em">Klip</p>
        <h1 style="margin:0 0 10px;font-size:20px;font-weight:700;letter-spacing:-.025em">${heading}</h1>
        <p style="margin:0 0 22px;font-size:13.5px;line-height:1.6;color:${MUTED}">${body}</p>
        <a href="${cta.url}" style="display:inline-block;background:${INK};color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:11px 18px;border-radius:9px">${cta.label}</a>
        <p style="margin:22px 0 0;font-size:11.5px;line-height:1.6;color:#A3A3AC">
          If the button does not work, paste this into your browser:<br>
          <span style="color:${ACCENT};word-break:break-all">${cta.url}</span>
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function verificationEmail(url: string) {
  return {
    subject: "Confirm your email",
    html: layout(
      "Confirm your email",
      "Tap the button to finish setting up your Klip account. The link is good for 24 hours.",
      { label: "Confirm email", url },
    ),
    text: `Confirm your email to finish setting up your Klip account.\n\n${url}\n\nThe link is good for 24 hours.`,
  };
}

export function passwordResetEmail(url: string) {
  return {
    subject: "Reset your password",
    html: layout(
      "Reset your password",
      "Tap the button to choose a new password. The link is good for one hour and can only be used once. If you did not ask for this, you can ignore this email.",
      { label: "Choose a new password", url },
    ),
    text: `Choose a new password for your Klip account.\n\n${url}\n\nThe link is good for one hour and can only be used once. If you did not ask for this, ignore this email.`,
  };
}
