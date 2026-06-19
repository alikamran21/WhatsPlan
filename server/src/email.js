import { config } from "./config.js";

/**
 * Transactional email via a third-party HTTP API. Uses the global `fetch`
 * built into Node 18+, so there's no SMTP and no extra dependency.
 *
 * Providers (set EMAIL_PROVIDER): resend | brevo | sendgrid.
 *   - resend:   onboarding@resend.dev only reaches your own account email;
 *               verify a domain to send anywhere.
 *   - brevo:    sends to ANY recipient with just a verified sender (no domain).
 *   - sendgrid: sends to any recipient; needs single-sender verification.
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
 * Send the OTP to `to`. Returns true if dispatched, false if no provider is
 * configured (caller falls back to devEcho). Throws on a provider error.
 */
export async function sendOtpEmail(to, code) {
  if (!config.email.enabled) return false;

  const minutes = Math.round(config.otp.ttlMs / 60000);
  const subject = "Your WhatsPlan verification code";
  const html = otpHtml(code, minutes);
  const text = `Your WhatsPlan verification code is ${code}. It expires in ${minutes} minutes.`;
  const from = parseFrom(config.email.from);
  const { provider, apiKey } = config.email;

  if (provider === "resend") {
    return post("https://api.resend.com/emails", {
      headers: { Authorization: `Bearer ${apiKey}` },
      body: { from: config.email.from, to, subject, html, text },
      label: "Resend",
    });
  }

  if (provider === "brevo") {
    return post("https://api.brevo.com/v3/smtp/email", {
      headers: { "api-key": apiKey, accept: "application/json" },
      body: { sender: from, to: [{ email: to }], subject, htmlContent: html, textContent: text },
      label: "Brevo",
    });
  }

  if (provider === "sendgrid") {
    return post("https://api.sendgrid.com/v3/mail/send", {
      headers: { Authorization: `Bearer ${apiKey}` },
      body: {
        personalizations: [{ to: [{ email: to }] }],
        from,
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      },
      label: "SendGrid",
      // SendGrid returns 202 with an empty body.
    });
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}" — use resend | brevo | sendgrid`);
}

async function post(url, { headers, body, label }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${label} ${res.status}: ${detail.slice(0, 300)}`);
  }
  return true;
}
