import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "..", "data", "store.json");

const EMPTY = {
  chats: {},
  messages: {},
  meetings: {},
  tasks: {},
  announcements: {},
  boards: {},
  state: {},
  users: {}, // per-user profile: email + verification flag (keyed by WhatsApp id)
  verify: {}, // pending OTP codes (never exposed via API)
};

/**
 * Local file-backed store. Zero dependencies, zero setup — every write is
 * persisted to data/store.json. Mirrors the FirestoreStore API so the two are
 * interchangeable.
 */
export class MemoryStore {
  constructor() {
    this.data = structuredClone(EMPTY);
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.data = { ...structuredClone(EMPTY), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
      }
    } catch (e) {
      console.warn("[store] could not load data/store.json:", e.message);
    }
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.warn("[store] could not save data/store.json:", e.message);
    }
  }

  async upsert(col, id, doc) {
    this.data[col] = this.data[col] || {};
    this.data[col][id] = { ...(this.data[col][id] || {}), ...doc, id };
    this._save();
    return this.data[col][id];
  }

  async get(col, id) {
    return this.data[col]?.[id] || null;
  }

  async delete(col, id) {
    if (this.data[col]?.[id]) {
      delete this.data[col][id];
      this._save();
    }
  }

  /** Names of every collection currently in the store (incl. per-session ones). */
  listCollections() {
    return Object.keys(this.data);
  }

  async list(col, { where = [], orderBy, dir = "desc", limit } = {}) {
    let rows = Object.values(this.data[col] || {});
    for (const [field, op, val] of where) {
      rows = rows.filter((r) => {
        const v = r[field];
        if (op === "==") return v === val;
        if (op === "!=") return v !== val;
        if (op === ">") return v > val;
        if (op === "<") return v < val;
        return true;
      });
    }
    if (orderBy) {
      rows.sort((a, b) => {
        const av = a[orderBy];
        const bv = b[orderBy];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (dir === "desc" ? -1 : 1);
      });
    }
    if (limit) rows = rows.slice(0, limit);
    return rows;
  }
}
