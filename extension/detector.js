/* ======================================================================
 * detector.js — 100% on-device importance detection.
 * Pure functions. No network, no storage, no message ever leaves here.
 * Shares scope with content.js (same content_scripts entry).
 * ==================================================================== */
(function () {
  const LINK_RE =
    /(https?:\/\/[^\s]*(zoom\.us|meet\.google|teams\.microsoft|whereby\.com|webex\.com|calendly\.com)[^\s]*)/i;
  const TIME_RE = /\b(\d{1,2}:\d{2}\s?(am|pm)?|\d{1,2}\s?(am|pm))\b/i;

  const RULES = [
    { cat: "meeting", kw: ["meeting", "meet at", "let's meet", "call at", "zoom", "google meet", "standup", "stand-up", "sync up", "huddle", "schedule a", "calendar", "appointment", "catch up at"] },
    { cat: "task", kw: ["please ", "can you", "could you", "kindly", "todo", "to-do", "to do:", "task:", "send me", "send the", "submit", "assign", "finish the", "complete the", "review the", "follow up", "action item"] },
    { cat: "deadline", kw: ["deadline", "due ", "by tomorrow", "by today", "by tonight", "by friday", "by monday", "by eod", "end of day", "asap", "cob", "before "] },
    { cat: "announcement", kw: ["announce", "announcement", "reminder", "fyi", "heads up", "heads-up", "please note", "note that", "important:", "attention", "everyone", "all members", "office closed", "holiday", "released", "now live", "launch"] },
  ];
  const HIGH = ["urgent", "asap", "immediately", "critical", "right now", "important", "emergency"];

  function detectImportance(text) {
    if (!text || typeof text !== "string") return { important: false };
    const t = text.toLowerCase();
    const link = (text.match(LINK_RE) || [])[0] || "";

    let category = null;
    const matched = [];
    for (const rule of RULES) {
      for (const kw of rule.kw) {
        if (t.includes(kw)) {
          if (!category) category = rule.cat;
          matched.push(kw.trim());
        }
      }
    }
    if (link && !category) category = "meeting";

    const high = HIGH.some((h) => t.includes(h));
    const important = !!category || !!link;

    return {
      important,
      category: category || (important ? "important" : null),
      priority: high ? "high" : "normal",
      link,
      hasTime: TIME_RE.test(text),
      matched: [...new Set(matched)].slice(0, 4),
    };
  }

  // expose to content.js (same isolated world)
  self.WhatsPlanDetect = detectImportance;
})();
