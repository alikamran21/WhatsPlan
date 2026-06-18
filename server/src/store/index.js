import { config } from "../config.js";
import { MemoryStore } from "./memory.js";

/**
 * Picks Firestore when credentials are configured, otherwise falls back to the
 * local file store so the server always boots — even before Firebase is set up.
 */
export async function createStore() {
  if (config.firebaseEnabled) {
    try {
      const { FirestoreStore } = await import("./firestore.js");
      const store = new FirestoreStore(config);
      console.log("[store] Firestore connected");
      return store;
    } catch (e) {
      console.warn("[store] Firestore init failed, using local file store:", e.message);
    }
  }
  console.log("[store] Using local file store (data/store.json)");
  return new MemoryStore();
}
