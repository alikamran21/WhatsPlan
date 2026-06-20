import { WhatsAppService } from "./whatsapp/client.js";

/**
 * Multi-tenant session manager.
 *
 * Each browser sends a stable random session id (X-WP-Session header / socket
 * auth). Every session id gets:
 *   - its OWN WhatsApp client (whatsapp-web.js LocalAuth keyed by the id, so a
 *     separate phone link + separate headless browser), and
 *   - its OWN data namespace inside the shared store ("<sid>::<collection>").
 *
 * So a different browser/PC = a different session = a different WhatsApp, fully
 * isolated. The session id is an unguessable bearer token kept in the browser's
 * localStorage (soft isolation — not hardened account auth, but private per
 * browser, which is what "my WhatsApp is only mine" needs here).
 *
 * WhatsApp clients are created lazily — making a session is cheap (just an
 * EventEmitter); the headless browser only launches on POST /session/start.
 * Idle sessions (no connected socket for 30 min) are evicted to free RAM; the
 * phone link stays on disk so reconnecting doesn't require a re-scan.
 */

const FORWARD = ["status", "qr", "message", "item", "purged"];
const VALID = /^[A-Za-z0-9_-]{12,128}$/;
const IDLE_MS = 30 * 60 * 1000;

export function createSessionManager(store, io) {
  const sessions = new Map(); // sid -> { sid, wa, store, lastSeen }

  // a view of the shared store with every collection namespaced to this session
  const scoped = (sid) => {
    const ns = (col) => `${sid}::${col}`;
    return {
      get: (col, id) => store.get(ns(col), id),
      upsert: (col, id, doc) => store.upsert(ns(col), id, doc),
      delete: (col, id) => store.delete(ns(col), id),
      list: (col, opts) => store.list(ns(col), opts),
    };
  };

  function get(sid) {
    if (!VALID.test(sid || "")) return null;
    let s = sessions.get(sid);
    if (!s) {
      const sStore = scoped(sid);
      const wa = new WhatsAppService(sStore, sid);
      // route this session's realtime events only to its own browser(s)
      for (const ev of FORWARD) wa.on(ev, (payload) => io.to(sid).emit(ev, payload));
      s = { sid, wa, store: sStore, lastSeen: Date.now() };
      sessions.set(sid, s);
      console.log(`[sessions] + ${sid.slice(0, 8)}… (active: ${sessions.size})`);
    }
    s.lastSeen = Date.now();
    return s;
  }

  // evict sessions whose browser has been gone a while → free the headless browser
  const iv = setInterval(() => {
    const now = Date.now();
    for (const [sid, s] of sessions) {
      const room = io.sockets.adapter.rooms.get(sid);
      if (room && room.size > 0) { s.lastSeen = now; continue; }
      if (now - s.lastSeen > IDLE_MS) {
        console.log(`[sessions] - ${sid.slice(0, 8)}… (idle)`);
        try { s.wa.shutdown?.(); } catch {}
        sessions.delete(sid);
      }
    }
  }, 5 * 60 * 1000);
  iv.unref?.();

  return { get, sessions };
}
