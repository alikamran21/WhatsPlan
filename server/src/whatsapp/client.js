import { EventEmitter } from "node:events";
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
    return { status: this.status, qr: this.qrDataUrl, me: this.me, meName: this.meName };
  }

  _setStatus(status) {
    this.status = status;
    this.emit("status", this.getState());
  }

  async start() {
    if (this.client) return this.getState();
    this._setStatus("initializing");

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
      puppeteer: {
        headless: true,
        // In Docker we use the system Chromium installed in the image.
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        // --disable-dev-shm-usage is important in containers (small /dev/shm).
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      },
    });

    this.client.on("qr", async (qr) => {
      this.qrDataUrl = await qrcode.toDataURL(qr);
      this._setStatus("qr");
      this.emit("qr", this.qrDataUrl);
    });

    this.client.on("authenticated", () => this._setStatus("authenticated"));

    this.client.on("ready", async () => {
      this.qrDataUrl = null;
      this.me = this.client.info?.wid?._serialized || null;
      this.meName = this.client.info?.pushname || null;
      this._setStatus("ready");
      try {
        await this.syncChats();
      } catch (e) {
        console.warn("[wa] chat sync failed:", e.message);
      }
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

  async syncChats() {
    const chats = await this.client.getChats();
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

  async sendMessage(chatId, text) {
    if (this.status !== "ready") throw new Error("WhatsApp is not connected");
    if (!text || !text.trim()) throw new Error("Message text is required");
    const sent = await this.client.sendMessage(chatId, text);
    return sent.id._serialized;
  }
}
