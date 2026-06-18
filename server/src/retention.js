import { config } from "./config.js";

const HOUR = 60 * 60 * 1000;

/**
 * Auto-purge raw chat messages once they're older than RETENTION_HOURS.
 * By that time the AI has already turned them into meetings/tasks/announcements
 * (which live in their own collections and are NOT touched here), so only the
 * raw message log is removed. Runs once on boot, then hourly.
 *
 * Note: Firestore security rules cannot do this — they only gate access, not
 * deletion. This server-side sweep is the reliable way, and it works the same
 * for the Firestore and local-file stores.
 */
export function startRetention(store, onPurge) {
  const hours = config.retentionHours;
  if (!hours || hours <= 0) {
    console.log("[retention] message auto-purge disabled (RETENTION_HOURS=0)");
    return () => {};
  }

  const sweep = async () => {
    try {
      const cutoff = Date.now() - hours * HOUR;
      const stale = await store.list("messages", { where: [["timestamp", "<", cutoff]] });
      let n = 0;
      for (const m of stale) {
        await store.delete("messages", m.id);
        n++;
      }
      if (n) {
        console.log(`[retention] purged ${n} chat message(s) older than ${hours}h`);
        onPurge?.(n);
      }
    } catch (e) {
      console.warn("[retention] sweep failed:", e.message);
    }
  };

  sweep();
  const iv = setInterval(sweep, HOUR);
  iv.unref?.();
  console.log(
    `[retention] raw chat messages auto-purge ${hours}h after arrival ` +
      `(hourly sweep; meetings/tasks/announcements are kept)`,
  );
  return () => clearInterval(iv);
}
