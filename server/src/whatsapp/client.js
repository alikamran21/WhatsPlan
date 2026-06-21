import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import qrcode from "qrcode";
import wweb from "whatsapp-web.js";
import { config } from "../config.js";
import { classifyMessage } from "../ai/classifier.js";

const { Client, LocalAuth } = wweb;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_PATH = path.join(__dirname, "..", "..", "data", "wwebjs_auth");

/**
 * Wraps whatsapp-web.js. Owns the connection lifecycle (QR → ready), persists
 * incoming messages, runs them through the classifier, and emits events for the
 * realtime layer:
 *   "status" (state), "qr" (dataUrl), "message" (record), "item" ({type,item})
 */
export class WhatsAppService extends EventEmitter {
  constructor(store, clientId = "default") {
    super();
    this.store = store;
    this.clientId = clientId; // one WhatsApp link per app session → isolated auth
    this.client = null;
    this.status = "disconnected"; // disconnected | initializing | qr | authenticated | ready
    this.qrDataUrl = null;
    this.me = null;
    this.meName = null;
    this._syncing = false; // chat-sync overlap guard
    this._lastSyncOk = 0;  // ms timestamp of the last successful chat sync
    this._syncLoop = null; // interval handle for the post-ready hydrate loop
  }

  getState() {
    return {
      status: this.status,
      qr: this.qrDataUrl,
      me: this.me,
      meName: this.meName,
      readOnly: config.readOnly,
    };
  }

  /** All WhatsApp groups (unfiltered) so you can pick which to watch. */
  async listGroups() {
    if (this.status !== "ready") return [];
    const chats = await this.client.getChats();
    return chats
      .filter((c) => c.isGroup)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || c.id.user,
        participants: c.participants?.length || 0,
        watched: this._watching(c),
      }));
  }

  _setStatus(status) {
    this.status = status;
    this.emit("status", this.getState());
  }

  // Remove stale Chromium profile locks left behind when a previous container
  // was killed ungracefully — otherwise the browser refuses to launch.
  _clearStaleLocks() {
    const walk = (dir) => {
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (/^Singleton(Lock|Cookie|Socket)$/.test(e.name)) {
          try { fs.rmSync(p, { force: true }); console.log(`[wa] cleared stale lock ${e.name}`); } catch {}
        } else if (e.isDirectory()) {
          walk(p);
        }
      }
    };
    // only this session's auth folder (LocalAuth stores it at session-<clientId>)
    walk(path.join(AUTH_PATH, `session-${this.clientId}`));
  }

  async start() {
    if (this.client) return this.getState();
    this._setStatus("initializing");
    this._clearStaleLocks();

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: this.clientId, dataPath: AUTH_PATH }),
      puppeteer: {
        headless: true,
        // In Docker we use the system Chromium installed in the image.
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        // Longer timeout: getChats on a busy account can be slow headless.
        protocolTimeout: 120000,
        // NOTE: we do NOT pass --disable-dev-shm-usage. That flag forces
        // Chromium to use /tmp (disk) for shared memory, which is slow and was
        // contributing to "Target closed" crashes. Instead docker-compose gives
        // the container a roomy /dev/shm (shm_size: 1gb).
        args: [
          "--no-sandbox", "--disable-setuid-sandbox",
          "--disable-gpu", "--disable-extensions", "--no-first-run",
          "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        ],
      },
    });

    this.client.on("qr", async (qr) => {
      this.qrDataUrl = await qrcode.toDataURL(qr);
      this._setStatus("qr");
      this.emit("qr", this.qrDataUrl);
    });

    this.client.on("authenticated", () => this._setStatus("authenticated"));

    this.client.on("loading_screen", (percent, message) =>
      console.log(`[wa] loading ${percent}% ${message || ""}`),
    );

    this.client.on("ready", async () => {
      this.qrDataUrl = null;
      this.me = this.client.info?.wid?._serialized || null;
      this.meName = this.client.info?.pushname || null;
      this._syncing = false; // clear any stale guard from a previous connection
      this._lastSyncOk = 0;
      this._setStatus("ready");
      // WhatsApp Web hydrates its chat list gradually after a (re)connect, so a
      // single early getChats returns nothing or only a few chats. Keep polling
      // until the list is populated and stable, pushing live updates as it grows.
      this._startChatSyncLoop();
    });

    this.client.on("disconnected", (reason) => {
      console.warn("[wa] disconnected:", reason);
      this.qrDataUrl = null;
      this._stopChatSyncLoop();
      this._setStatus("disconnected");
      this.client = null;
    });

    // "message_create" (not "message") so we also see the user's OWN outgoing
    // messages — "message" is incoming-only. handleMessage gates whether to
    // classify own messages via config.classifyOwn.
    this.client.on("message_create", (m) =>
      this.handleMessage(m).catch((e) => console.error("[wa] message error:", e.message)),
    );

    await this.client.initialize();
    return this.getState();
  }

  async logout() {
    try {
      if (this.client) {
        await this.client.logout();
        await this.client.destroy();
      }
    } catch (e) {
      console.warn("[wa] logout error:", e.message);
    }
    this._stopChatSyncLoop();
    this.client = null;
    this.me = null;
    this.meName = null;
    this.qrDataUrl = null;
    this._setStatus("disconnected");
    return this.getState();
  }

  /**
   * Free the headless browser WITHOUT unlinking (keeps LocalAuth on disk so the
   * next start() re-authenticates silently). Used to evict idle sessions.
   */
  async shutdown() {
    this._stopChatSyncLoop();
    try { if (this.client) await this.client.destroy(); }
    catch (e) { console.warn("[wa] shutdown error:", e.message); }
    this.client = null;
    this.qrDataUrl = null;
    this._setStatus("disconnected");
  }

  _watching(chat) {
    if (config.watchChats.length) {
      return config.watchChats.some(
        (w) => chat.id?._serialized === w || (chat.name || "").toLowerCase().includes(w.toLowerCase()),
      );
    }
    // No explicit list: always watch groups, and 1-on-1 chats unless disabled.
    return chat.isGroup || config.watchDms;
  }

  /**
   * One chat-sync pass: fetch the list from WhatsApp and upsert every watched
   * chat. Returns the number saved; throws if getChats fails/times out. Only
   * ever adds/updates (never deletes), so partial passes accumulate safely.
   */
  async _syncOnce(timeoutMs = 30000) {
    const chats = await Promise.race([
      this.client.getChats(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("getChats timed out (still syncing?)")), timeoutMs)),
    ]);
    let saved = 0;
    for (const c of chats) {
      if (!this._watching(c)) continue;
      await this.store.upsert("chats", c.id._serialized, {
        id: c.id._serialized,
        name: c.name || c.id.user,
        isGroup: !!c.isGroup,
        lastMessage: c.lastMessage?.body || "",
        timestamp: (c.timestamp || 0) * 1000,
        unread: c.unreadCount || 0,
      });
      saved++;
    }
    this._lastSyncOk = Date.now();
    console.log(`[wa] synced ${saved} watched chat(s) of ${chats.length} total`);
    this.emit("status", this.getState()); // nudges the browser to reload /api/chats
    return saved;
  }

  /**
   * Keep syncing until the chat list is actually populated. WhatsApp Web hydrates
   * its chats gradually after (re)connecting, so the first getChats returns
   * nothing or only a few — the old one-shot sweep is exactly why the UI showed
   * an empty / single-chat list. Poll every 8s (pushing live updates) and stop
   * once the count is non-zero AND stopped growing, or after a few minutes.
   */
  _startChatSyncLoop() {
    this._stopChatSyncLoop();
    const startedAt = Date.now();
    const MAX_MS = 5 * 60 * 1000;
    let prev = -1;
    const tick = async () => {
      if (this.status !== "ready" || !this.client) return this._stopChatSyncLoop();
      if (this._syncing) return;
      this._syncing = true;
      let saved = -1;
      try { saved = await this._syncOnce(30000); }
      catch (e) { console.warn(`[wa] chat sync tick failed: ${e.message}`); }
      finally { this._syncing = false; }
      const stable = saved > 0 && saved === prev; // populated and no longer growing
      prev = saved;
      if (stable || Date.now() - startedAt > MAX_MS) this._stopChatSyncLoop();
    };
    this._syncLoop = setInterval(tick, 8000);
    tick(); // first attempt right away
  }

  _stopChatSyncLoop() {
    if (this._syncLoop) { clearInterval(this._syncLoop); this._syncLoop = null; }
  }

  /**
   * Resync on demand — called when the UI opens GET /api/chats, so a fresh login
   * /boot refreshes the list even after the post-ready loop has stopped. Cheap &
   * safe: no-ops when not ready, already syncing, or synced within the last 10s.
   * Fire-and-forget; on success _syncOnce emits "status" so the browser reloads.
   */
  ensureChatsSynced() {
    if (this.status !== "ready" || !this.client) return;
    if (this._syncing) return;
    if (Date.now() - this._lastSyncOk < 10000) return;
    this._syncing = true;
    this._syncOnce(20000)
      .catch((e) => console.warn(`[wa] on-demand chat sync failed: ${e.message}`))
      .finally(() => { this._syncing = false; });
  }

  async handleMessage(m) {
    const chat = await m.getChat();
    if (!this._watching(chat)) return;

    let fromName = "";
    try {
      const contact = await m.getContact();
      fromName = contact.pushname || contact.name || contact.number || "";
    } catch {
      /* contact lookup can fail for some message types */
    }

    const record = {
      id: m.id._serialized,
      chatId: chat.id._serialized,
      chatName: chat.name || chat.id.user,
      isGroup: !!chat.isGroup,
      from: m.author || m.from,
      fromName,
      body: m.body || "",
      timestamp: (m.timestamp || 0) * 1000,
      fromMe: !!m.fromMe,
    };

    await this.store.upsert("messages", record.id, record);
    await this.store.upsert("chats", record.chatId, {
      id: record.chatId,
      name: record.chatName,
      isGroup: record.isGroup,
      lastMessage: record.body,
      timestamp: record.timestamp,
    });
    this.emit("message", record);
    console.log(`[wa] message in "${record.chatName}" from ${record.fromName || record.from}: ${(record.body || "").slice(0, 50)}`);

    if (!record.body) return;
    if (record.fromMe && !config.classifyOwn) return;

    // AI reading is per-chat opt-in (toggled from the UI, gated behind email
    // verification). The merged chat doc carries the flag set via PATCH /chats.
    const chatDoc = await this.store.get("chats", record.chatId);
    if (!chatDoc?.aiEnabled) return;

    const cls = await classifyMessage(record);
    await this.applyClassification(record, cls);
    // Mark as AI-read so the retention sweep knows it's been processed.
    await this.store.upsert("messages", record.id, {
      classified: true,
      classifiedAt: Date.now(),
      category: cls.category,
    });
  }

  /**
   * Classify recently-stored, not-yet-read messages for a chat. Runs when AI
   * reading is first switched on so the planner backfills from history instead
   * of only catching messages that arrive afterwards. Items stream out via the
   * "item" event as they're found. Fire-and-forget — never throws to the caller.
   */
  async classifyChatBacklog(chatId, limit = 20) {
    const all = await this.store.list("messages", { orderBy: "timestamp", dir: "desc" });
    const pending = all
      .filter(
        (m) =>
          m.chatId === chatId &&
          m.body &&
          !m.classified &&
          (!m.fromMe || config.classifyOwn),
      )
      .slice(0, limit)
      .reverse(); // oldest first, so the planner reads chronologically
    for (const record of pending) {
      await new Promise((r) => setImmediate(r)); // yield so chat/message reqs stay responsive
      try {
        const cls = await classifyMessage(record);
        await this.applyClassification(record, cls);
        await this.store.upsert("messages", record.id, {
          classified: true,
          classifiedAt: Date.now(),
          category: cls.category,
        });
      } catch (e) {
        console.warn("[wa] backlog classify failed:", e.message);
      }
    }
  }

  async applyClassification(msg, cls) {
    if (cls.category !== "chatter") {
      console.log(`[ai] ${cls.category.toUpperCase()} ← "${(msg.body || "").slice(0, 45)}" (${Math.round((cls.confidence || 0) * 100)}%)`);
    }
    const base = {
      chatId: msg.chatId,
      chatName: msg.chatName,
      messageId: msg.id,
      author: msg.fromName,
      sourceText: msg.body,
      confidence: cls.confidence,
      createdAt: msg.timestamp,
    };

    if (cls.category === "meeting") {
      const item = {
        id: `mtg_${msg.id}`,
        ...base,
        title: cls.title || "Untitled meeting",
        datetime: cls.datetime || "",
        link: cls.link || "",
        location: cls.location || "",
        incomplete: cls.incomplete || !cls.datetime,
      };
      await this.store.upsert("meetings", item.id, item);
      this.emit("item", { type: "meeting", item });
    } else if (cls.category === "task") {
      const item = {
        id: `task_${msg.id}`,
        ...base,
        description: cls.summary || cls.title || msg.body,
        assignee: cls.assignee || "",
        due: cls.due || "",
        priority: cls.priority,
        done: false,
        incomplete: cls.incomplete,
      };
      await this.store.upsert("tasks", item.id, item);
      this.emit("item", { type: "task", item });
    } else if (cls.category === "announcement") {
      const item = {
        id: `ann_${msg.id}`,
        ...base,
        text: cls.summary || msg.body,
        pinned: false,
      };
      await this.store.upsert("announcements", item.id, item);
      this.emit("item", { type: "announcement", item });
    }
    // "chatter" → intentionally dropped
  }

  /**
   * Recent message history for one chat, fetched live from WhatsApp. Raced
   * against an 8s timeout: the headless browser can stall while busy (e.g.
   * classifying a flood of incoming messages), and we never want the chat
   * thread to hang on it — on timeout we return [] and the route falls back to
   * the locally stored messages.
   */
  async fetchMessages(chatId, limit = 40) {
    if (this.status !== "ready") return [];
    const work = (async () => {
      const chat = await this.client.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit });
      return msgs.map((m) => ({
        id: m.id._serialized,
        chatId,
        chatName: chat.name || chat.id.user,
        isGroup: !!chat.isGroup,
        from: m.author || m.from,
        fromName: m._data?.notifyName || "",
        body: m.body || "",
        timestamp: (m.timestamp || 0) * 1000,
        fromMe: !!m.fromMe,
      }));
    })().catch((e) => {
      console.warn("[wa] fetchMessages failed:", e.message);
      return [];
    });
    return Promise.race([
      work,
      new Promise((resolve) => setTimeout(() => resolve([]), 8000)),
    ]);
  }

  async sendMessage(chatId, text) {
    if (config.readOnly) throw new Error("Read-only mode is on (READ_ONLY=true) — sending is disabled");
    if (this.status !== "ready") throw new Error("WhatsApp is not connected");
    if (!text || !text.trim()) throw new Error("Message text is required");
    const sent = await this.client.sendMessage(chatId, text);
    return sent.id._serialized;
  }
}
