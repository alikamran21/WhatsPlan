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
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
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

  classifyOwn: String(process.env.CLASSIFY_OWN || "").toLowerCase() === "true",
};
