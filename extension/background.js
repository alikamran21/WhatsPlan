/* ======================================================================
 * background.js — service worker.
 * Holds detected items in chrome.storage.session, which is RAM-only: it is
 * never written to disk and is wiped when the browser closes. No message
 * content ever touches persistent storage or any database.
 * ==================================================================== */

// Let the popup (trusted context) read session storage; content writes via us.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "important") {
    const key = "imp::" + (msg.chat || "");
    chrome.storage.session.set({ [key]: msg.items || [] });
  }
});

// Clear a chat's detected items when it's disabled / removed.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.enabledChats) return;
  const before = new Set(changes.enabledChats.oldValue || []);
  const after = new Set(changes.enabledChats.newValue || []);
  for (const chat of before) {
    if (!after.has(chat)) chrome.storage.session.remove("imp::" + chat);
  }
});
