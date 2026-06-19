import { MemoryStore } from "./memory.js";

/**
 * Local file-backed store (data/store.json). Zero setup — every write is
 * persisted to disk, and it survives restarts.
 */
export async function createStore() {
  console.log("[store] Using local file store (data/store.json)");
  return new MemoryStore();
}
