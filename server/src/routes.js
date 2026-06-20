import express from "express";
import { requestOtp, confirmOtp, getVerification, isVerified } from "./verify.js";
import { getUser, setUserEmail } from "./users.js";
import { classifyMessage } from "./ai/classifier.js";

/**
 * Registers all /api routes.
 *
 * Multi-tenant: every request must carry an `X-WP-Session` header identifying
 * the browser's session. A middleware resolves it to that session's own
 * WhatsApp client (`req.wa`) and isolated data store (`req.store`). Handlers
 * use those — never a shared/global instance — so one user's WhatsApp and data
 * are never visible to another.
 */
export function registerRoutes(app, sessions) {
  const api = express.Router();

  const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      if (status >= 500) console.error(`[api] ${req.method} ${req.originalUrl}:`, e.message);
      res.status(status).json({ error: e.message, code: e.code });
    });

  // ── session resolution (required on every /api call) ───────────────────
  api.use((req, res, next) => {
    const sid = req.get("X-WP-Session");
    const s = sessions.get(sid);
    if (!s) {
      return res.status(401).json({ error: "Missing or invalid session", code: "NO_SESSION" });
    }
    req.wa = s.wa;
    req.store = s.store;
    next();
  });

  /* ── WhatsApp session ────────────────────────────────────────────── */
  api.get("/session", (req, res) => res.json(req.wa.getState()));
  api.get("/session/qr", (req, res) => {
    const { qr, status } = req.wa.getState();
    res.json({ qr, status });
  });
  api.post("/session/start", wrap(async (req, res) => res.json(await req.wa.start())));
  api.post("/session/logout", wrap(async (req, res) => res.json(await req.wa.logout())));

  /* ── Chats & messages ────────────────────────────────────────────── */
  api.get("/groups", wrap(async (req, res) => res.json(await req.wa.listGroups())));

  api.get("/chats", wrap(async (req, res) =>
    res.json(await req.store.list("chats", { orderBy: "timestamp", dir: "desc" })),
  ));

  api.patch("/chats/:id", wrap(async (req, res) => {
    const id = req.params.id;
    const enable = (req.body || {}).aiEnabled === true;
    if (enable && !(await isVerified(req.store, req.wa))) {
      throw Object.assign(new Error("Verify your email to turn on AI reading"), {
        status: 403,
        code: "VERIFY_REQUIRED",
      });
    }
    const existing = await req.store.get("chats", id);
    if (!existing) throw Object.assign(new Error("Chat not found"), { status: 404 });
    const updated = await req.store.upsert("chats", id, { aiEnabled: enable });
    if (enable) void req.wa.classifyChatBacklog?.(id).catch(() => {});
    res.json(updated);
  }));

  api.get("/chats/:id/messages", wrap(async (req, res) => {
    const chatId = req.params.id;
    let msgs = await req.wa.fetchMessages(chatId, 40).catch(() => []);
    if (!msgs.length) {
      const all = await req.store.list("messages", { orderBy: "timestamp", dir: "asc" });
      msgs = all.filter((m) => m.chatId === chatId);
    }
    res.json(msgs);
  }));

  api.post("/chats/:id/messages", wrap(async (req, res) => {
    const id = await req.wa.sendMessage(req.params.id, req.body?.text);
    res.json({ id });
  }));

  /* ── AI sorter tester ────────────────────────────────────────────── */
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
    await req.wa.applyClassification(record, cls);
    res.json({ classification: cls, stored: cls.category !== "chatter" });
  }));

  /* ── Derived items: meetings / tasks / announcements ─────────────── */
  for (const col of ["meetings", "tasks", "announcements"]) {
    api.get(`/${col}`, wrap(async (req, res) =>
      res.json(await req.store.list(col, { orderBy: "createdAt", dir: "desc" })),
    ));
    api.patch(`/${col}/:id`, wrap(async (req, res) =>
      res.json(await req.store.upsert(col, req.params.id, req.body || {})),
    ));
    api.delete(`/${col}/:id`, wrap(async (req, res) => {
      await req.store.delete(col, req.params.id);
      res.json({ ok: true });
    }));
  }

  /* ── User profile ─────────────────────────────────────────────────── */
  api.get("/user", wrap(async (req, res) => res.json(await getUser(req.store, req.wa))));
  api.put("/user", wrap(async (req, res) => res.json(await setUserEmail(req.store, req.wa, req.body?.email))));

  /* ── Email OTP verification ───────────────────────────────────────── */
  api.get("/verify", wrap(async (req, res) => res.json(await getVerification(req.store, req.wa))));
  api.post("/verify/request", wrap(async (req, res) =>
    res.json(await requestOtp(req.store, req.wa, req.body?.email)),
  ));
  api.post("/verify/confirm", wrap(async (req, res) =>
    res.json(await confirmOtp(req.store, req.wa, req.body?.code)),
  ));

  /* ── Generic single-doc app state ─────────────────────────────────── */
  api.get("/state/:key", wrap(async (req, res) =>
    res.json(await req.store.get("state", req.params.key)),
  ));
  api.put("/state/:key", wrap(async (req, res) =>
    res.json(await req.store.upsert("state", req.params.key, { ...(req.body || {}), id: req.params.key })),
  ));

  /* ── Boards ───────────────────────────────────────────────────────── */
  api.get("/boards", wrap(async (req, res) =>
    res.json(await req.store.list("boards", { orderBy: "createdAt", dir: "desc" })),
  ));
  api.put("/boards/:id", wrap(async (req, res) =>
    res.json(await req.store.upsert("boards", req.params.id, { ...(req.body || {}), id: req.params.id })),
  ));
  api.delete("/boards/:id", wrap(async (req, res) => {
    await req.store.delete("boards", req.params.id);
    res.json({ ok: true });
  }));

  app.use("/api", api);
}
