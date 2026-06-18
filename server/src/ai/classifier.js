import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

export const CATEGORIES = ["meeting", "task", "announcement", "chatter"];

const PROMPT = `You are the WhatsPlan classifier. You read ONE WhatsApp group message and decide what it is.

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
- "task": something to be done, often assigned ("can you send the report", "@Ali fix the bug by Friday").
- "announcement": important info to broadcast/pin ("office closed Monday", "new release is live").
- "chatter": greetings, reactions, small talk, anything not actionable.
- If a meeting/task is vague (e.g. "let's meet tomorrow" with no time), set category accordingly but incomplete=true.
- Resolve relative dates ("tomorrow", "Friday") against the provided message timestamp.`;

let model = null;
if (config.gemini.enabled) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  model = genAI.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });
}

/** Classify a stored message record. Always resolves to a normalized object. */
export async function classifyMessage(msg) {
  if (model) {
    try {
      return await classifyWithGemini(msg);
    } catch (e) {
      console.warn("[ai] Gemini failed, using heuristic:", e.message);
    }
  }
  return heuristicClassify(msg);
}

async function classifyWithGemini(msg) {
  const when = new Date(msg.timestamp).toISOString();
  const prompt =
    `${PROMPT}\n\n` +
    `Message timestamp: ${when}\n` +
    `Sender: ${msg.fromName || "unknown"}\n` +
    `Group: ${msg.chatName || "unknown"}\n` +
    `Message:\n"""${msg.body}"""`;
  const res = await model.generateContent(prompt);
  const parsed = JSON.parse(res.response.text());
  return normalize(parsed);
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
const LINK_RE = /(https?:\/\/[^\s]*(zoom\.us|meet\.google|teams\.microsoft|whereby\.com|webex\.com)[^\s]*)/i;
const TIME_RE = /\b(\d{1,2}(:\d{2})?\s?(am|pm)|\d{1,2}:\d{2})\b/i;
const MEETING_WORDS = ["meet", "meeting", "call", "standup", "sync", "zoom", "huddle", "catch up", "schedule"];
const TASK_WORDS = ["please", "can you", "could you", "todo", "to-do", "task", "send", "finish", "complete", "submit", "fix", "review", "by tomorrow", "by friday", "deadline", "assign"];
const ANNOUNCE_WORDS = ["announce", "reminder", "fyi", "heads up", "note that", "important", "everyone", "closed", "holiday", "released", "launch", "update:"];
const HIGH_WORDS = ["urgent", "asap", "immediately", "critical", "now"];

function heuristicClassify(msg) {
  const body = msg.body || "";
  const t = body.toLowerCase();
  const link = (body.match(LINK_RE) || [])[0] || "";
  const hasTime = TIME_RE.test(body);
  const has = (words) => words.some((w) => t.includes(w));

  let category = "chatter";
  if (link || has(MEETING_WORDS)) category = "meeting";
  else if (has(TASK_WORDS)) category = "task";
  else if (has(ANNOUNCE_WORDS)) category = "announcement";

  const priority = has(HIGH_WORDS) ? "high" : "medium";
  const firstLine = body.split("\n")[0].slice(0, 80);

  if (category === "meeting") {
    return normalize({
      category,
      confidence: link ? 0.8 : 0.55,
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
      confidence: 0.55,
      title: firstLine,
      summary: firstLine,
      assignee,
      priority,
      incomplete: false,
    });
  }
  if (category === "announcement") {
    return normalize({ category, confidence: 0.55, summary: firstLine, priority });
  }
  return normalize({ category: "chatter", confidence: 0.6 });
}
