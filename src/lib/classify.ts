// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side function that classifies chat messages using Anthropic Claude.
 * Reads ANTHROPIC_API_KEY from environment variables.
 *
 * Returns { error: string|null, items: ClassifiedItem[] }
 */
export const classifyMessages = createServerFn({ method: "POST" })
  .validator((data) => {
    if (!data || typeof data.text !== "string") throw new Error("text is required");
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        error:
          "ANTHROPIC_API_KEY is not configured. Add it to your environment variables (Lovable Secrets → ANTHROPIC_API_KEY) to enable AI classification.",
        items: [],
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `You are a chat message classifier for a project management app called WhatsPlan.
Analyze each chat message below and classify it.

For EACH message, return an object with:
- "type": one of "task" (actionable work item), "event" (meeting, call, scheduled thing), or "info" (general chat, announcement, joke — no action needed)
- "title": a short, clean summary (not the raw message — extract the actionable part)
- "dueDate": if a date/day is mentioned or implied, return it as "YYYY-MM-DD". Use today's date (${today}) as reference for relative dates like "tomorrow", "next Monday", etc. If no date, return null.
- "priority": "high", "medium", or "low" based on urgency cues

Return ONLY a valid JSON array. No markdown fences, no explanation. Example:
[{"type":"task","title":"Update dashboard mockups","dueDate":"2026-06-20","priority":"high"}]

Chat messages:
${data.text}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("Anthropic API error:", response.status, errBody);
        return {
          error: `Anthropic API returned ${response.status}. Check your API key and credits.`,
          items: [],
        };
      }

      const result = await response.json();
      const content = result.content?.[0]?.text || "";

      // Parse the JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return { error: "AI response did not contain a valid JSON array.", items: [] };
      }

      const items = JSON.parse(jsonMatch[0]);

      // Validate shape
      const validated = items
        .filter((it) => it && typeof it.type === "string" && typeof it.title === "string")
        .map((it) => ({
          type: ["task", "event", "info"].includes(it.type) ? it.type : "info",
          title: String(it.title).slice(0, 200),
          dueDate: typeof it.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(it.dueDate) ? it.dueDate : null,
          priority: ["high", "medium", "low"].includes(it.priority) ? it.priority : "medium",
        }));

      return { error: null, items: validated };
    } catch (err) {
      console.error("Classification error:", err);
      return {
        error: `Classification failed: ${err instanceof Error ? err.message : String(err)}`,
        items: [],
      };
    }
  });
