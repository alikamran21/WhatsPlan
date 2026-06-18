import express from "express";

/** Registers all /api routes. */
export function registerRoutes(app, store, wa) {
  const api = express.Router();

  const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error(`[api] ${req.method} ${req.originalUrl}:`, e.message);
      res.status(500).json({ error: e.message });
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
  api.get("/chats", wrap(async (req, res) =>
    res.json(await store.list("chats", { orderBy: "timestamp", dir: "desc" })),
  ));

  api.get("/chats/:id/messages", wrap(async (req, res) => {
    const all = await store.list("messages", { orderBy: "timestamp", dir: "asc" });
    res.json(all.filter((m) => m.chatId === req.params.id));
  }));

  api.post("/chats/:id/messages", wrap(async (req, res) => {
    const id = await wa.sendMessage(req.params.id, req.body?.text);
    res.json({ id });
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
