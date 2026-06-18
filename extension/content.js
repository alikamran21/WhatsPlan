/* ======================================================================
 * content.js — runs INSIDE web.whatsapp.com.
 * Reads ONLY the currently-open chat, and ONLY if you've enabled it.
 * Detection is on-device (detector.js). Detected items are relayed to the
 * background worker which holds them in volatile session memory — never on
 * disk, never in a database.
 * ==================================================================== */
(function () {
  let watchedChat = null;
  let observer = null;
  let debounceTimer = null;

  function getOpenChatName() {
    const main = document.querySelector("#main");
    if (!main) return null;
    const titleEl =
      main.querySelector("header span[title]") ||
      main.querySelector('header [role="button"] span[dir="auto"]');
    return (titleEl?.getAttribute("title") || titleEl?.textContent || "").trim() || null;
  }

  function readMessages() {
    const out = [];
    const bubbles = document.querySelectorAll("#main div.message-in, #main div.message-out");
    bubbles.forEach((b) => {
      const fromMe = b.classList.contains("message-out");
      const copy = b.querySelector(".copyable-text");
      const pre = copy?.getAttribute("data-pre-plain-text") || "";
      // pre looks like: "[11:48 PM, 6/18/2026] Ali Kamran: "
      const m = pre.match(/^\[(.*?)\]\s*([^:]*):/);
      const time = (m?.[1] || "").trim();
      const sender = (m?.[2] || (fromMe ? "You" : "")).trim();
      const textEl = b.querySelector("span.selectable-text");
      const body = (textEl?.innerText || "").trim();
      if (body) out.push({ time, sender, body, fromMe });
    });
    return out;
  }

  function scanAndReport() {
    if (!watchedChat) return;
    const chat = getOpenChatName();
    if (chat !== watchedChat) return; // user switched away
    const items = [];
    for (const m of readMessages()) {
      const d = self.WhatsPlanDetect(m.body);
      if (d.important) items.push({ ...m, ...d });
    }
    chrome.runtime.sendMessage({ type: "important", chat, items });
  }

  function startWatching(chat) {
    watchedChat = chat;
    scanAndReport();
    const main = document.querySelector("#main");
    if (main && !observer) {
      observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scanAndReport, 800);
      });
      observer.observe(main, { childList: true, subtree: true });
    }
  }

  function stopWatching() {
    watchedChat = null;
    if (observer) { observer.disconnect(); observer = null; }
  }

  async function getEnabled() {
    const { enabledChats = [] } = await chrome.storage.local.get("enabledChats");
    return enabledChats;
  }

  // Keep watch state in sync with the open chat + the enabled list.
  async function syncWatchState() {
    const chat = getOpenChatName();
    const enabled = await getEnabled();
    if (chat && enabled.includes(chat)) {
      if (watchedChat !== chat) startWatching(chat);
    } else if (watchedChat) {
      stopWatching();
    }
  }

  setInterval(syncWatchState, 1500);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabledChats) syncWatchState();
  });

  // Popup queries
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "getOpenChat") { reply({ chat: getOpenChatName() }); return true; }
    if (msg?.type === "scanNow") { scanAndReport(); reply({ ok: true }); return true; }
    return false;
  });
})();
