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
  constructor(store) {
    super();
    this.store = store;
    this.client = null;
    this.status = "disconnected"; // disconnected | initializing | qr | authenticated | ready
    this.qrDataUrl = null;
    this.me = null;
    this.meName = null;
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
    walk(AUTH_PATH);
  }

  async start() {
    if (this.client) return this.getState();
    this._setStatus("initializing");
    this._clearStaleLocks();

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
      puppeteer: {
        headless: true,
        // In Docker we use the system Chromium installed in the image.
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        // Longer timeout: getChats on a busy account can be slow headless.
        protocolTimeout: 120000,
        args: [
          "--no-sandbox", "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // important in containers (small /dev/shm)
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
      this._setStatus("ready");
      // Let WhatsApp Web finish settling before querying chats — calling
      // getChats too early triggers "execution context destroyed".
      setTimeout(() => this.syncChats().catch((e) => console.warn("[wa] chat sync failed:", e.message)), 6000);
    });

    this.client.on("disconnected", (reason) => {
      console.warn("[wa] disconnected:", reason);
      this.qrDataUrl = null;
      this._setStatus("disconnected");
      this.client = null;
    });

    this.client.on("message", (m) =>
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
    this.client = null;
    this.me = null;
    this.meName = null;
    this.qrDataUrl = null;
    this._setStatus("disconnected");
    return this.getState();
  }

  _watching(chat) {
    if (!config.watchChats.length) return chat.isGroup; // default: all groups
    return config.watchChats.some(
      (w) => chat.id?._serialized === w || (chat.name || "").toLowerCase().includes(w.toLowerCase()),
    );
  }

  async syncChats(attempt = 1) {
    const MAX = 12;
    try {
      // getChats hangs while WhatsApp Web is still syncing history after a
      // fresh link. Fail each attempt fast, then keep retrying for a few mins.
      const chats = await Promise.race([
        this.client.getChats(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("getChats timed out (still syncing?)")), 30000)),
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
      console.log(`[wa] synced ${saved} watched chat(s)`);
      this.emit("status", this.getState());
    } catch (e) {
      console.warn(`[wa] chat sync attempt ${attempt}/${MAX} failed: ${e.message}`);
      if (attempt < MAX) {
        await new Promise((r) => setTimeout(r, 20000));
        return this.syncChats(attempt + 1);
      }
      console.warn("[wa] chat sync gave up; chats will appear as new messages arrive");
    }
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

    const cls = await classifyMessage(record);
    await this.applyClassification(record, cls);
    // Mark as AI-read so the retention sweep knows it's been processed.
    await this.store.upsert("messages", record.id, {
      classified: true,
      classifiedAt: Date.now(),
      category: cls.category,
    });
  }

  async applyClassification(msg, cls) {
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

  /** Recent message history for one chat, fetched live from WhatsApp. */
  async fetchMessages(chatId, limit = 40) {
    if (this.status !== "ready") return [];
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
  }

  async sendMessage(chatId, text) {
    if (config.readOnly) throw new Error("Read-only mode is on (READ_ONLY=true) — sending is disabled");
    if (this.status !== "ready") throw new Error("WhatsApp is not connected");
    if (!text || !text.trim()) throw new Error("Message text is required");
    const sent = await this.client.sendMessage(chatId, text);
    return sent.id._serialized;
  }
}
