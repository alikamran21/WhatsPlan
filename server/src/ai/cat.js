import { config } from "../config.js";

/**
 * Pixel Cat chatbot brain. Uses Groq (same key as the classifier) to give the
 * on-screen cat real, conversational replies instead of canned lines. Returns
 * null when no Groq key is configured so the client falls back to its built-in
 * rule-based replies (still works fully offline).
 */
const SYSTEM = `You are Pixel Cat — a cute, kawaii green pixel-art cat with headphones who lives on the user's screen inside WhatsPlan, their friendly productivity companion.
- Reply in 1-3 short, warm, playful sentences. Sprinkle cat sounds (mrrow, purr, meow) and the 💚 emoji occasionally, not every line.
- Help with tasks, deadlines, focus and motivation, and answer general questions helpfully and accurately.
- If the user clearly wants to be reminded of something, append on its OWN final line exactly: SET_REMINDER:[what]|[when]
  where [when] is either a 24h time HH:MM, or a relative offset like +30m or +2h. Example: SET_REMINDER:[drink water]|[+30m]
  Only add that line when they actually want a reminder. Never mention the SET_REMINDER syntax to the user.
- Keep replies under 60 words. Plain text only — no markdown.`;

export async function catReply(messages) {
  if (!config.groq.enabled) return null; // no key → caller uses local rules
  const history = (Array.isArray(messages) ? messages : [])
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.text ?? m.content ?? "").slice(0, 1000),
    }))
    .filter((m) => m.content);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages: [{ role: "system", content: SYSTEM }, ...history],
      temperature: 0.7,
      max_tokens: 180,
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}
