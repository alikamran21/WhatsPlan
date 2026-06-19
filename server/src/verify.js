import { config } from "./config.js";
import { sendOtpEmail } from "./email.js";
import { getUser, setUserEmail, markVerified, currentUserId } from "./users.js";

/**
 * Email-OTP verification — the gate that must be passed before AI reading can
 * be switched on for a chat.
 *
 * The code is tied to the *user* (their WhatsApp account → users collection),
 * so the backend always knows which email to send to without trusting the
 * client. Pending codes live in the "verify" collection (NOT "state", which is
 * publicly readable via GET /api/state/:key):
 *   "verify"/"otp:<userId>" → { userId, email, code, expires, attempts }
 *
 * Email goes out via Resend (see email.js). With no provider configured the
 * code is logged + echoed back (devEcho) so the flow works with zero setup.
 */

const MAX_ATTEMPTS = 5;

const otpKey = (userId) => `otp:${userId}`;
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

const httpError = (message, status, code) => {
  const e = new Error(message);
  e.status = status;
  if (code) e.code = code;
  return e;
};

/**
 * Generate + send a code to the current user's email. If `emailRaw` is given it
 * is saved to the profile first (set-on-first-use / change email). Returns
 * { ok, sent, email, devCode? }.
 */
export async function requestOtp(store, wa, emailRaw) {
  if (emailRaw) await setUserEmail(store, wa, emailRaw);

  const user = await getUser(store, wa);
  if (!user.email) throw httpError("Add your email before requesting a code", 400, "EMAIL_REQUIRED");

  const code = genCode();
  await store.upsert("verify", otpKey(user.id), {
    id: otpKey(user.id),
    userId: user.id,
    email: user.email,
    code,
    expires: Date.now() + config.otp.ttlMs,
    attempts: 0,
  });

  let sent = false;
  try {
    sent = await sendOtpEmail(user.email, code);
  } catch (e) {
    console.warn("[otp] email send failed:", e.message);
  }

  const res = { ok: true, sent, email: user.email };
  if (config.otp.devEcho) {
    res.devCode = code;
    console.log(`[otp] code for ${user.email}: ${code}  (devEcho on — not delivered securely)`);
  } else if (sent) {
    console.log(`[otp] code emailed to ${user.email}`);
  } else {
    console.warn(`[otp] no email provider configured and devEcho off — code for ${user.email} was NOT delivered`);
  }
  return res;
}

/** Verify the current user's pending code. On success marks them verified. */
export async function confirmOtp(store, wa, codeRaw) {
  const code = String(codeRaw || "").trim();
  if (!code) throw httpError("A code is required", 400);

  const userId = currentUserId(wa);
  const rec = await store.get("verify", otpKey(userId));
  if (!rec) throw httpError("No code was requested — send one first", 400);
  if (Date.now() > rec.expires) {
    await store.delete("verify", otpKey(userId));
    throw httpError("Code expired — request a new one", 400);
  }
  if ((rec.attempts || 0) >= MAX_ATTEMPTS) {
    await store.delete("verify", otpKey(userId));
    throw httpError("Too many attempts — request a new code", 429);
  }
  if (rec.code !== code) {
    await store.upsert("verify", otpKey(userId), { attempts: (rec.attempts || 0) + 1 });
    throw httpError("Incorrect code", 400);
  }

  await store.delete("verify", otpKey(userId));
  const user = await markVerified(store, wa);
  console.log(`[otp] ${user.email} verified — AI reading unlocked`);
  return { verified: true, email: user.email, verifiedAt: user.verifiedAt };
}

/** Verification state for the frontend (verified flag + which email + window). */
export async function getVerification(store, wa) {
  const user = await getUser(store, wa);
  return {
    verified: user.verified,
    email: user.email,
    verifiedAt: user.verifiedAt,
    windowMs: config.otp.windowMs,
  };
}

export async function isVerified(store, wa) {
  const user = await getUser(store, wa);
  return user.verified;
}
