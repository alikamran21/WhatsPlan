/**
 * User profile, stored in the "users" collection. Identity = the linked
 * WhatsApp account (that's the app's login — see WhatsPlanApp). The profile is
 * where we keep the email so the OTP knows *which user* to send the code to,
 * plus the verification flag that gates AI reading.
 *
 *   users/<wid> = { id, wid, name, email, verifiedAt }
 */

import { config } from "./config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (e) => String(e || "").trim().toLowerCase();

/** Verification is only valid for config.otp.windowMs after it was granted. */
const isFresh = (verifiedAt) => !!verifiedAt && Date.now() - verifiedAt < config.otp.windowMs;

const httpError = (message, status, code) => {
  const e = new Error(message);
  e.status = status;
  if (code) e.code = code;
  return e;
};

/** The id of whoever is currently linked. Falls back to a singleton id when
 *  WhatsApp isn't linked yet (the in-app flow only runs after linking). */
export function currentUserId(wa) {
  const st = wa?.getState?.() || {};
  return st.me || "local";
}

/**
 * The current user's profile. Name is kept fresh from the live WhatsApp
 * session; email + verification come from the stored record. Never null.
 */
export async function getUser(store, wa) {
  const id = currentUserId(wa);
  const st = wa?.getState?.() || {};
  const stored = (await store.get("users", id)) || {};
  return {
    id,
    wid: st.me || stored.wid || null,
    name: st.meName || stored.name || null,
    email: stored.email || null,
    verified: isFresh(stored.verifiedAt), // expires after the verification window
    verifiedAt: stored.verifiedAt || null,
  };
}

/** Set/replace the current user's email. Changing it clears prior verification. */
export async function setUserEmail(store, wa, emailRaw) {
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email)) throw httpError("A valid email address is required", 400);

  const id = currentUserId(wa);
  const st = wa?.getState?.() || {};
  const stored = (await store.get("users", id)) || {};
  const emailChanged = stored.email && stored.email !== email;

  await store.upsert("users", id, {
    id,
    wid: st.me || stored.wid || null,
    name: st.meName || stored.name || null,
    email,
    ...(emailChanged ? { verifiedAt: null } : {}),
  });

  return getUser(store, wa);
}

/** Mark the current user's email as verified. */
export async function markVerified(store, wa) {
  const id = currentUserId(wa);
  await store.upsert("users", id, { verifiedAt: Date.now() });
  return getUser(store, wa);
}
