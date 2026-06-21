/* ======================================================================
 * Runs on the WhatsPlan website and bridges its per-browser session id to
 * the extension. The site stores the id in localStorage as `wp_sid`; the
 * backend now REQUIRES it (X-WP-Session) on every /api call, so the popup
 * needs the same id to read the same planner data. Copy it into
 * chrome.storage so popup.js can pick it up — no manual steps for the user.
 * ==================================================================== */
(function syncSession() {
  try {
    const sid = localStorage.getItem("wp_sid");
    if (sid && sid.length >= 12) {
      chrome.storage.local.set({ wp_sid: sid });
    }
  } catch (e) {
    /* localStorage can be blocked; nothing to do */
  }
})();
