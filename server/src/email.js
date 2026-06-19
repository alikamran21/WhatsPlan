import { config } from "./config.js";

/**
 * Transactional email via Brevo's HTTP API (https://www.brevo.com). Uses the
 * global `fetch` built into Node 18+, so there's no SMTP and no extra dependency.
 * EMAIL_FROM must be a verified Brevo sender, otherwise Brevo drops the message.
 */

/** Parse `EMAIL_FROM` ("Name <email@x>" or "email@x") into { name, email }. */
function parseFrom(from) {
  const m = String(from || "").match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "WhatsPlan", email: m[2].trim() };
  return { name: "WhatsPlan", email: String(from || "").trim() };
}

/** Branded HTML for the OTP email. Inline styles only (email-client safe). */
function otpHtml(code, minutes) {
  const boxes = code
    .split("")
    .map(
      (d) =>
        `<td style="padding:0 5px"><div style="width:44px;height:56px;line-height:56px;background:#ffffff;border:1px solid #d7e7df;border-radius:10px;font-size:28px;font-weight:700;color:#0b3a32;text-align:center;font-family:'Courier New',monospace">${d}</div></td>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f0f2f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(11,58,50,.08)">
        <tr><td style="background:linear-gradient(135deg,#25d366,#008069);padding:22px 28px">
          <span style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:.3px">WhatsPlan</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <h1 style="margin:0 0 6px;font-size:19px;color:#111b21">Verify your email</h1>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#54656f">Enter this code in WhatsPlan to turn on AI reading for your chats.</p>
        </td></tr>
        <tr><td style="padding:18px 24px 6px" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${boxes}</tr></table>
        </td></tr>
        <tr><td style="padding:8px 28px 26px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <p style="margin:0;font-size:12.5px;line-height:1.5;color:#8696a0">This code expires in ${minutes} minutes. If you didn't request it, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f7f8fa;padding:14px 28px;border-top:1px solid #eceff1;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <span style="font-size:11px;color:#8696a0">WhatsPlan · Chat, plan, win the day.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Send the OTP to `to` via Brevo. Returns true if dispatched, false if no key is
 * configured (caller falls back to devEcho). Throws on a Brevo error.
 */
export async function sendOtpEmail(to, code) {
  if (!config.email.enabled) return false;

  const minutes = Math.round(config.otp.ttlMs / 60000);
  const html = otpHtml(code, minutes);
  const text = `Your WhatsPlan verification code is ${code}. It expires in ${minutes} minutes.`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.email.apiKey,
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: parseFrom(config.email.from),
      to: [{ email: to }],
      subject: "Your WhatsPlan verification code",
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 300)}`);
  }
  return true;
}
