import express from "express";
import { requestOtp, confirmOtp, getVerification, isVerified } from "./verify.js";
import { getUser, setUserEmail } from "./users.js";
import { classifyMessage } from "./ai/classifier.js";

/** Registers all /api routes. */
export function registerRoutes(app, store, wa) {
  const api = express.Router();

  const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      // Only 5xx are unexpected — 4xx are normal validation/auth responses.
      if (status >= 500) console.error(`[api] ${req.method} ${req.originalUrl}:`, e.message);
      res.status(status).json({ error: e.message, code: e.code });
    });

  /* ── WhatsApp session ────────────────────────────────────────────── */
  api.get("/session", (req, res) => res.json(wa.getState()));
  api.get("/session/qr", (req, res) => {
    const { qr, status } = wa.getState();
    res.json({ qr, status });
  });
  api.post("/session/start", wrap(async (req, res) => res.json(await wa.start())));
  api.post("/session/logout", wrap(async (req, res) => res.json(await wa.logout())));

  /* ── Chats & messages ────────────────────────────────────────────── */
  // All WhatsApp groups (unfiltered) — use this to discover names/ids to put
  // in WATCH_CHATS. Requires the session to be linked (status: ready).
  api.get("/groups", wrap(async (req, res) => res.json(await wa.listGroups())));

  api.get("/chats", wrap(async (req, res) =>
    res.json(await store.list("chats", { orderBy: "timestamp", dir: "desc" })),
  ));

  // Per-chat settings — currently just the AI-reading toggle. Turning it ON
  // requires a verified email (see /verify below); turning it OFF is always
  // allowed. Enabling also kicks off a backlog pass so the planner fills in
  // immediately from messages already on file.
  api.patch("/chats/:id", wrap(async (req, res) => {
    const id = req.params.id;
    const enable = (req.body || {}).aiEnabled === true;
    if (enable && !(await isVerified(store, wa))) {
      throw Object.assign(new Error("Verify your email to turn on AI reading"), {
        status: 403,
        code: "VERIFY_REQUIRED",
      });
    }
    const existing = await store.get("chats", id);
    if (!existing) throw Object.assign(new Error("Chat not found"), { status: 404 });
    const updated = await store.upsert("chats", id, { aiEnabled: enable });
    if (enable) void wa.classifyChatBacklog?.(id).catch(() => {});
    res.json(updated);
  }));

  api.get("/chats/:id/messages", wrap(async (req, res) => {
    const chatId = req.params.id;
    // Live history from WhatsApp (shows existing conversation), fall back to
    // the locally stored/classified messages if the live fetch is unavailable.
    let msgs = await wa.fetchMessages(chatId, 40).catch(() => []);
    if (!msgs.length) {
      const all = await store.list("messages", { orderBy: "timestamp", dir: "asc" });
      msgs = all.filter((m) => m.chatId === chatId);
    }
    res.json(msgs);
  }));

  api.post("/chats/:id/messages", wrap(async (req, res) => {
    const id = await wa.sendMessage(req.params.id, req.body?.text);
    res.json({ id });
  }));

  /* ── AI sorter tester ────────────────────────────────────────────── */
  // Run any text through the real classifier + organizer so you can test the
  // AI sorter without WhatsApp. It files the result into meetings/tasks/
  // announcements (so it shows in the Planner) and returns the classification.
  api.post("/classify", wrap(async (req, res) => {
    const text = String(req.body?.text || "").trim();
    if (!text) throw Object.assign(new Error("text is required"), { status: 400 });
    const record = {
      id: `test_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      chatId: "test",
      chatName: req.body?.chatName || "AI Sorter Test",
      isGroup: true,
      from: "tester",
      fromName: req.body?.author || "Tester",
      body: text,
      timestamp: Date.now(),
      fromMe: false,
    };
    const cls = await classifyMessage(record);
    await wa.applyClassification(record, cls); // files it + emits "item" to the Planner
    res.json({ classification: cls, stored: cls.category !== "chatter" });
  }));

  /* ── Derived items: meetings / tasks / announcements ─────────────── */
  for (const col of ["meetings", "tasks", "announcements"]) {
    api.get(`/${col}`, wrap(async (req, res) =>
      res.json(await store.list(col, { orderBy: "createdAt", dir: "desc" })),
    ));
    api.patch(`/${col}/:id`, wrap(async (req, res) =>
      res.json(await store.upsert(col, req.params.id, req.body || {})),
    ));
    api.delete(`/${col}/:id`, wrap(async (req, res) => {
      await store.delete(col, req.params.id);
      res.json({ ok: true });
    }));
  }

  /* ── User profile (email lives here so OTP knows who to send to) ──── */
  api.get("/user", wrap(async (req, res) => res.json(await getUser(store, wa))));
  api.put("/user", wrap(async (req, res) => res.json(await setUserEmail(store, wa, req.body?.email))));

  /* ── Email OTP verification (gates AI reading) ───────────────────── */
  api.get("/verify", wrap(async (req, res) => res.json(await getVerification(store, wa))));
  // body.email is optional — supplying it sets/updates the user's email first.
  api.post("/verify/request", wrap(async (req, res) =>
    res.json(await requestOtp(store, wa, req.body?.email)),
  ));
  api.post("/verify/confirm", wrap(async (req, res) =>
    res.json(await confirmOtp(store, wa, req.body?.code)),
  ));

  /* ── Generic single-doc app state (e.g. gamification) ────────────── */
  api.get("/state/:key", wrap(async (req, res) =>
    res.json(await store.get("state", req.params.key)),
  ));
  api.put("/state/:key", wrap(async (req, res) =>
    res.json(await store.upsert("state", req.params.key, { ...(req.body || {}), id: req.params.key })),
  ));

  /* ── Boards (optional cloud sync for the frontend) ───────────────── */
  api.get("/boards", wrap(async (req, res) =>
    res.json(await store.list("boards", { orderBy: "createdAt", dir: "desc" })),
  ));
  api.put("/boards/:id", wrap(async (req, res) =>
    res.json(await store.upsert("boards", req.params.id, { ...(req.body || {}), id: req.params.id })),
  ));
  api.delete("/boards/:id", wrap(async (req, res) => {
    await store.delete("boards", req.params.id);
    res.json({ ok: true });
  }));

  app.use("/api", api);
}
