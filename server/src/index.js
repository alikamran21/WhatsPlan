import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config.js";
import { createStore } from "./store/index.js";
import { createSessionManager } from "./sessions.js";
import { registerRoutes } from "./routes.js";
import { startRetention } from "./retention.js";

// whatsapp-web.js drives a headless browser; transient puppeteer errors
// (e.g. "execution context destroyed" during a WhatsApp Web reload) must NOT
// crash the whole backend. Log and keep running.
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e?.message || e));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e?.message || e));

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const store = await createStore();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.corsOrigin } });

// Multi-tenant: each browser's session id → its own WhatsApp client + data.
const sessions = createSessionManager(store, io);

app.get("/health", (req, res) => res.json({ ok: true, sessions: sessions.sessions.size }));
registerRoutes(app, sessions);

io.on("connection", (socket) => {
  const sid = socket.handshake.auth?.sid || socket.handshake.query?.sid;
  const s = sessions.get(sid);
  if (!s) {
    // unknown/invalid session id — tell the client it's disconnected, don't leak anything
    socket.emit("session", { status: "disconnected", qr: null, me: null, meName: null, readOnly: config.readOnly });
    return;
  }
  socket.join(sid);                 // events for this session reach only its browser(s)
  socket.emit("session", s.wa.getState());
});

// Auto-delete raw chat messages after RETENTION_HOURS — sweeps every session.
startRetention(store, () => {});

server.listen(config.port, () => {
  console.log(`\nWhatsPlan backend → http://localhost:${config.port}  (multi-tenant: one WhatsApp per browser session)`);
  console.log(`  Classifier: ${config.groq.enabled ? `Groq (${config.groq.model})` : "heuristic (no GROQ_API_KEY)"}`);
  console.log(`  Email:      ${config.email.enabled ? "Brevo" : "console / devEcho (no BREVO_API_KEY)"}`);
  console.log(`  Storage:    local file (data/store.json), namespaced per session`);
  console.log(`\nEach browser links its own device via POST /api/session/start (sends X-WP-Session).\n`);
});
