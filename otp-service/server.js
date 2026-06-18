/* ======================================================================
 * WhatsPlan OTP service.
 * Its ONLY job: email a verification code and check it. It never sees or
 * stores WhatsApp messages. It keeps only: pending codes (5-min TTL) and
 * issued tokens — both in memory.
 * In DEV mode (default) the code is printed to the console AND returned in
 * the response, so you can test without configuring email.
 * ==================================================================== */
import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const PORT = Number(process.env.PORT || 5001);
const DEV = String(process.env.DEV ?? "true").toLowerCase() === "true";

const codes = new Map(); // email -> { code, expires }
const tokens = new Map(); // token -> email

let transport = null;
if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/request-otp", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(email, { code, expires: Date.now() + 5 * 60 * 1000 });

  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || "WhatsPlan <no-reply@whatsplan.local>",
        to: email,
        subject: "Your WhatsPlan verification code",
        text: `Your WhatsPlan code is ${code}. It expires in 5 minutes.`,
      });
    } catch (e) {
      console.warn("[otp] email send failed:", e.message);
    }
  }
  console.log(`[otp] code for ${email}: ${code}`);
  res.json({ ok: true, ...(DEV ? { devCode: code } : {}) });
});

app.post("/verify-otp", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  const rec = codes.get(email);
  if (!rec || rec.expires < Date.now()) return res.status(400).json({ error: "Code expired — request a new one" });
  if (rec.code !== code) return res.status(400).json({ error: "Incorrect code" });
  codes.delete(email);
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, email);
  res.json({ ok: true, token });
});

app.get("/health", (_req, res) => res.json({ ok: true, dev: DEV, email: !!transport }));

app.listen(PORT, () => {
  console.log(`WhatsPlan OTP service → http://localhost:${PORT}`);
  console.log(`  Mode:  ${DEV ? "DEV (codes printed + returned in response)" : "production"}`);
  console.log(`  Email: ${transport ? "SMTP configured" : "not configured (dev codes only)"}`);
});
