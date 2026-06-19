import dotenv from "dotenv";

dotenv.config();

const corsRaw = (process.env.CORS_ORIGIN || "").trim();

export const config = {
  port: Number(process.env.PORT || 4000),

  // `true` reflects the request origin (dev-friendly). In production set
  // CORS_ORIGIN to your real frontend URL(s).
  corsOrigin: corsRaw
    ? corsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : true,

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    // gemini-1.5-flash is being retired and 404s on newer keys. 2.0-flash is
    // GA, fast, and on the free tier. Override with GEMINI_MODEL if you like
    // (e.g. gemini-2.5-flash).
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    enabled: !!process.env.GEMINI_API_KEY,
  },

  firebaseEnabled: !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_PROJECT_ID
  ),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",

  watchChats: (process.env.WATCH_CHATS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Watch 1-on-1 (direct) chats too, not just groups. Default on. When
  // WATCH_CHATS is set, that list takes precedence and matches both kinds.
  watchDms: String(process.env.WATCH_DMS ?? "true").toLowerCase() !== "false",

  classifyOwn: String(process.env.CLASSIFY_OWN || "").toLowerCase() === "true",

  // Ban-safety: when true the backend will NEVER send a WhatsApp message
  // (the API refuses), making the link purely read-only. Strongly recommended.
  readOnly: String(process.env.READ_ONLY || "").toLowerCase() === "true",

  // Raw chat messages are deleted this many hours after they arrive (the AI
  // has already extracted meetings/tasks/announcements by then, and those are
  // kept). Set to 0 to disable auto-purge. Default: 24.
  retentionHours:
    process.env.RETENTION_HOURS === undefined || process.env.RETENTION_HOURS === ""
      ? 24
      : Number(process.env.RETENTION_HOURS),

  // Email delivery for the OTP. Third-party HTTP APIs — no SMTP, no Google.
  // Pick a provider with EMAIL_PROVIDER; the matching key must be set.
  //   resend   → simplest, but onboarding@resend.dev only delivers to YOUR
  //              Resend account email. To send to ANY address, verify a domain.
  //   brevo    → sends to ANY recipient with just a verified sender email
  //              (no domain needed) — use this to email arbitrary addresses.
  //   sendgrid → sends to any recipient; needs single-sender verification.
  // Leave the chosen provider's key blank and the code is logged + echoed back
  // (devEcho) so the flow is fully testable with zero setup.
  email: (() => {
    const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
    const keyByProvider = {
      resend: process.env.RESEND_API_KEY || "",
      brevo: process.env.BREVO_API_KEY || "",
      sendgrid: process.env.SENDGRID_API_KEY || "",
    };
    return {
      provider,
      apiKey: keyByProvider[provider] || "",
      from: process.env.EMAIL_FROM || "WhatsPlan <onboarding@resend.dev>",
      enabled: !!keyByProvider[provider],
    };
  })(),

  // OTP that gates turning on AI reading for a chat.
  otp: {
    ttlMs: Number(process.env.OTP_TTL_MINUTES || 10) * 60 * 1000,
    // How long a successful verification stays valid. After this, turning AI
    // reading ON requires a fresh OTP again. Default 30 seconds.
    windowMs: Number(process.env.VERIFY_WINDOW_SECONDS || 30) * 1000,
    // Echo the code in the response + console when set, or whenever the chosen
    // provider has no key (so local dev works without an account). OFF in prod.
    devEcho:
      process.env.OTP_DEV_ECHO !== undefined
        ? String(process.env.OTP_DEV_ECHO).toLowerCase() === "true"
        : !(
            (process.env.EMAIL_PROVIDER || "resend").toLowerCase() === "brevo"
              ? process.env.BREVO_API_KEY
              : (process.env.EMAIL_PROVIDER || "resend").toLowerCase() === "sendgrid"
                ? process.env.SENDGRID_API_KEY
                : process.env.RESEND_API_KEY
          ),
  },
};
