import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config.js";
import { createStore } from "./store/index.js";
import { WhatsAppService } from "./whatsapp/client.js";
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
const wa = new WhatsAppService(store);

app.get("/health", (req, res) => res.json({ ok: true, ...wa.getState() }));
registerRoutes(app, store, wa);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.corsOrigin } });

io.on("connection", (socket) => {
  // Send current state to a freshly-connected client.
  socket.emit("session", wa.getState());
});

// Forward WhatsApp service events to all connected clients.
for (const event of ["status", "qr", "message", "item"]) {
  wa.on(event, (payload) => io.emit(event, payload));
}

// Auto-delete raw chat messages after RETENTION_HOURS (default 24h).
startRetention(store, (count) => io.emit("purged", { count }));

server.listen(config.port, () => {
  console.log(`\nWhatsPlan backend → http://localhost:${config.port}`);
  console.log(`  Classifier: ${config.groq.enabled ? `Groq (${config.groq.model})` : "heuristic (no GROQ_API_KEY)"}`);
  console.log(`  Email:      ${config.email.enabled ? "Brevo" : "console / devEcho (no BREVO_API_KEY)"}`);
  console.log(`  Storage:    local file (data/store.json)`);
  console.log(`  Watching:   ${config.watchChats.length ? config.watchChats.join(", ") : (config.watchDms ? "all chats (groups + DMs)" : "all groups")}`);
  console.log(`\nPOST /api/session/start to link a device, then scan the QR.\n`);
});
