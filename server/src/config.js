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

  // AI classifier — Groq (free, fast, OpenAI-compatible HTTP API). The built-in
  // heuristic runs when GROQ_API_KEY is blank or Groq errors.
  // Key: https://console.groq.com
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    // 70b is much better at catching informal/typo'd tasks than 8b-instant.
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    enabled: !!process.env.GROQ_API_KEY,
  },

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

  // Email delivery for the OTP via Brevo (https://www.brevo.com) — HTTP API, no
  // SMTP. EMAIL_FROM must be a verified Brevo sender. Leave BREVO_API_KEY blank
  // and the code is logged + echoed back (devEcho) so it's testable with no setup.
  email: {
    apiKey: process.env.BREVO_API_KEY || "",
    from: process.env.EMAIL_FROM || "WhatsPlan <noreply@example.com>",
    enabled: !!process.env.BREVO_API_KEY,
  },

  // OTP that gates turning on AI reading for a chat.
  otp: {
    ttlMs: Number(process.env.OTP_TTL_MINUTES || 10) * 60 * 1000,
    // How long a successful verification stays valid. After this, turning AI
    // reading ON requires a fresh OTP again. Default 30 seconds.
    windowMs: Number(process.env.VERIFY_WINDOW_SECONDS || 30) * 1000,
    // Echo the code in the response + console when set, or whenever Brevo has no
    // key (so local dev works without an account). Turn OFF in production.
    devEcho:
      process.env.OTP_DEV_ECHO !== undefined
        ? String(process.env.OTP_DEV_ECHO).toLowerCase() === "true"
        : !process.env.BREVO_API_KEY,
  },
};
