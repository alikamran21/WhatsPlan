import { config } from "../config.js";

export const CATEGORIES = ["meeting", "task", "announcement", "chatter"];

const PROMPT = `You are the WhatsPlan classifier. You read ONE WhatsApp chat message (from a group or a 1-on-1 chat) and decide what it is.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "category": "meeting" | "task" | "announcement" | "chatter",
  "confidence": 0.0-1.0,
  "title": string,        // short title for a meeting/task, else ""
  "datetime": string,     // ISO 8601 if a specific date/time is present, else ""
  "link": string,         // meeting URL (zoom/meet/teams/etc) if present, else ""
  "location": string,     // physical place if present, else ""
  "assignee": string,     // person a task is assigned to, else ""
  "due": string,          // ISO 8601 task due date if present, else ""
  "priority": "low" | "medium" | "high",
  "summary": string,      // one-line summary of the task/announcement
  "incomplete": boolean   // true if it's a meeting/task missing key details (e.g. no time)
}

Rules:
- "meeting": invites/scheduling with a time or call link ("let's meet", "zoom at 5pm", "standup tomorrow").
- "task": ANY request, command, instruction or order to do/bring/get/buy/send/finish something — formal OR casual, work OR personal, even with typos/slang ("can you send the report", "@Ali fix the bug by Friday", "bring me food", "get coffee", "remember to buy milk", "I order u to do this"). If someone is told or asked to DO something, it's a task.
- "announcement": important info to broadcast/pin ("office closed Monday", "new release is live").
- "chatter": only greetings, reactions, jokes, and small talk with NO action and NO time/date. When unsure between task and chatter, prefer task.
- If a meeting/task is vague (e.g. "let's meet tomorrow" with no time), set category accordingly but incomplete=true.
- Resolve relative dates ("tomorrow", "Friday") against the provided message timestamp.`;

/** Classify a stored message record. Always resolves to a normalized object. */
export async function classifyMessage(msg) {
  if (config.groq.enabled) {
    try {
      return normalize(parseJsonLoose(await classifyWithGroq(msg)));
    } catch (e) {
      console.warn("[ai] Groq failed, using heuristic:", e.message);
    }
  }
  return heuristicClassify(msg);
}

/** Ask Groq (OpenAI-compatible) to classify and return its raw JSON text. */
async function classifyWithGroq(msg) {
  const when = new Date(msg.timestamp).toISOString();
  const prompt =
    `${PROMPT}\n\n` +
    `Message timestamp: ${when}\n` +
    `Sender: ${msg.fromName || "unknown"}\n` +
    `Chat: ${msg.chatName || "unknown"}\n` +
    `Message:\n"""${msg.body}"""`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Parse the model's JSON even if it wrapped it in markdown fences or added
 * stray text (we ask for JSON mode, but be defensive so a stray char never
 * drops a message to the heuristic).
 */
function parseJsonLoose(text) {
  const s = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("no JSON object in model response");
  }
}

function normalize(p = {}) {
  const category = CATEGORIES.includes(p.category) ? p.category : "chatter";
  const priority = ["low", "medium", "high"].includes(p.priority) ? p.priority : "medium";
  return {
    category,
    confidence: typeof p.confidence === "number" ? Math.max(0, Math.min(1, p.confidence)) : 0.5,
    title: str(p.title),
    datetime: str(p.datetime),
    link: str(p.link),
    location: str(p.location),
    assignee: str(p.assignee),
    due: str(p.due),
    priority,
    summary: str(p.summary),
    incomplete: !!p.incomplete,
  };
}

const str = (v) => (typeof v === "string" ? v.trim() : "");

/* ────────────────────────────────────────────────────────────────────────
   Heuristic fallback — runs with no API key. Keyword/regex based, good
   enough to demo the pipeline end-to-end before wiring up Gemini.
   ──────────────────────────────────────────────────────────────────────── */
const LINK_RE = /(https?:\/\/[^\s]*(zoom\.us|meet\.google|teams\.microsoft|whereby\.com|webex\.com|hangouts|calendly)[^\s]*)/i;
const TIME_RE = /\b(\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)|\d{1,2}:\d{2}|noon|midnight)\b/i;
const DATE_RE = /\b(today|tonight|tomorrow|tmrw|tmr|mon(day)?|tues?(day)?|wed(nesday)?|thur?s?(day)?|fri(day)?|sat(urday)?|sun(day)?|next\s+(week|month|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?)|this\s+(week|weekend)|eod|cob|end of day)\b/i;
const MEETING_WORDS = ["meeting", "let's meet", "lets meet", " meet ", "meet at", "meet up", "call", "standup", "stand-up", "sync", "zoom", "huddle", "catch up", "catch-up", "appointment", "session", "conference", "interview", "get together", "demo", "presentation"];
const TASK_WORDS = ["please", "pls", "can you", "could you", "would you", "todo", "to-do", "task", "send", "finish", "complete", "submit", "fix", "review", "deadline", "assign", "bring", "order", "prepare", "deliver", "share", "update", "remind", "upload", "pay", "book", "collect", "return", "arrange", "need you to", "required", "due ", "make sure"];
const ANNOUNCE_WORDS = ["announce", "announcement", "reminder", "fyi", "heads up", "heads-up", "note that", "please note", "important", "everyone", "all staff", "closed", "holiday", "released", "launch", "update:", "notice", "attention", "psa"];
const HIGH_WORDS = ["urgent", "asap", "immediately", "critical", "right now", "high priority", "emergency"];
// Imperative command at the start ("Bring the files", "Send me the report").
const IMPERATIVE_RE = /^(please\s+|kindly\s+|pls\s+)?(bring|send|get|make|prepare|finish|complete|submit|fix|review|do|call|email|share|upload|pay|book|order|arrange|remind|update|deliver|collect|return|attend|join|create|check|read|sign|approve|confirm|schedule)\b/i;
// Directive phrasing anywhere ("I order you to…", "you must…", "make sure to…").
const DIRECTIVE_RE = /\b(i order you|you (must|need to|have to|should|are required to)|make sure (to|you)|don'?t forget|be sure to|ensure (you|that)|needs? to be)\b/i;

function heuristicClassify(msg) {
  const body = (msg.body || "").trim();
  const t = body.toLowerCase();
  const link = (body.match(LINK_RE) || [])[0] || "";
  const hasTime = TIME_RE.test(body);
  const hasDate = DATE_RE.test(t);
  const has = (words) => words.some((w) => t.includes(w));
  const imperative = IMPERATIVE_RE.test(body) || DIRECTIVE_RE.test(t);

  let category = "chatter";
  if (link || has(MEETING_WORDS)) category = "meeting";
  else if (has(TASK_WORDS) || imperative) category = "task";
  else if (has(ANNOUNCE_WORDS)) category = "announcement";
  // A concrete time or date with no keyword is almost always an actionable plan
  // ("bring the files tomorrow 10am") — file it as a task rather than dropping it.
  else if (hasTime || hasDate) category = "task";

  const priority = has(HIGH_WORDS) ? "high" : "medium";
  const firstLine = body.split("\n")[0].slice(0, 80);

  if (category === "meeting") {
    return normalize({
      category,
      confidence: link ? 0.85 : 0.6,
      title: firstLine,
      link,
      datetime: "",
      incomplete: !hasTime && !link,
      summary: firstLine,
    });
  }
  if (category === "task") {
    const assignee = (body.match(/@(\w+)/) || [])[1] || "";
    return normalize({
      category,
      // lower confidence when it only matched on a bare time/date
      confidence: has(TASK_WORDS) || imperative ? 0.6 : 0.45,
      title: firstLine,
      summary: firstLine,
      assignee,
      priority,
      incomplete: false,
    });
  }
  if (category === "announcement") {
    return normalize({ category, confidence: 0.6, summary: firstLine, priority });
  }
  return normalize({ category: "chatter", confidence: 0.6 });
}
