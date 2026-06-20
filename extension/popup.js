/* ======================================================================
 * WhatsPlan Chrome extension — planner popup.
 * Zero-build vanilla JS. Polls the WhatsPlan backend's REST API and renders
 * meetings / tasks / announcements. The backend + website URLs are stored in
 * chrome.storage.local so you can point it at your VM's tunnel.
 * Mirrors the REST endpoints in src/lib/api.ts.
 * ==================================================================== */

const KEYS = { api: "wp_api_url", site: "wp_site_url" };
const POLL_MS = 5000;

let cfg = { api: "", site: "" };
let pollTimer = null;

/* ---- tiny DOM helpers ---- */
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* ---- config persistence ---- */
function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([KEYS.api, KEYS.site], (v) => {
      cfg.api = (v[KEYS.api] || "").replace(/\/+$/, "");
      cfg.site = (v[KEYS.site] || "").replace(/\/+$/, "");
      resolve(cfg);
    });
  });
}

function saveConfig(api, site) {
  cfg.api = api.replace(/\/+$/, "");
  cfg.site = site.replace(/\/+$/, "");
  return new Promise((resolve) =>
    chrome.storage.local.set({ [KEYS.api]: cfg.api, [KEYS.site]: cfg.site }, resolve)
  );
}

/* ---- REST ---- */
async function apiGet(path) {
  const res = await fetch(`${cfg.api}/api${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(`${cfg.api}/api${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/* ---- status dot ---- */
function setStatus(state) {
  const dot = $("status-dot");
  dot.classList.remove("online", "connecting", "offline");
  if (state === "ready") {
    dot.classList.add("online");
    dot.title = "Connected — WhatsApp ready";
  } else if (state === "qr" || state === "initializing" || state === "authenticated") {
    dot.classList.add("connecting");
    dot.title = "Backend up — WhatsApp " + state;
  } else {
    dot.classList.add("offline");
    dot.title = "Backend unreachable";
  }
}

/* ---- formatting ---- */
function fmtWhen(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s; // backend may store free-text times
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ---- renderers ---- */
function renderMeetings(items) {
  const ul = $("list-meetings");
  ul.innerHTML = "";
  $("count-meetings").textContent = items.length;
  if (!items.length) return ul.appendChild(el("li", "list-empty", "No meetings yet."));
  for (const m of items) {
    const li = el("li", "item");
    const body = el("div", "body");
    body.appendChild(el("div", "line1", m.title || "(untitled meeting)"));
    const line2 = el("div", "line2");
    if (m.datetime) line2.appendChild(el("span", "chip", fmtWhen(m.datetime)));
    if (m.location) line2.appendChild(el("span", "chip", m.location));
    if (m.chatName) line2.appendChild(el("span", null, m.chatName));
    if (m.incomplete) line2.appendChild(el("span", "incomplete", "needs a time"));
    body.appendChild(line2);
    li.appendChild(body);
    ul.appendChild(li);
  }
}

function renderTasks(items) {
  const ul = $("list-tasks");
  ul.innerHTML = "";
  $("count-tasks").textContent = items.filter((t) => !t.done).length;
  if (!items.length) return ul.appendChild(el("li", "list-empty", "No tasks yet."));
  for (const t of items) {
    const li = el("li", "item" + (t.done ? " done" : ""));
    const check = el("input", "task-check");
    check.type = "checkbox";
    check.checked = !!t.done;
    check.addEventListener("change", () => toggleTask(t.id, check.checked));
    li.appendChild(check);

    const body = el("div", "body");
    body.appendChild(el("div", "line1", t.description || "(task)"));
    const line2 = el("div", "line2");
    if (t.priority) line2.appendChild(el("span", "chip " + t.priority, t.priority));
    if (t.due) line2.appendChild(el("span", "chip", fmtWhen(t.due)));
    if (t.assignee) line2.appendChild(el("span", null, "@" + t.assignee));
    if (t.chatName) line2.appendChild(el("span", null, t.chatName));
    body.appendChild(line2);
    li.appendChild(body);
    ul.appendChild(li);
  }
}

function renderAnnouncements(items) {
  const ul = $("list-announcements");
  ul.innerHTML = "";
  $("count-announcements").textContent = items.length;
  if (!items.length) return ul.appendChild(el("li", "list-empty", "No announcements yet."));
  for (const a of items) {
    const li = el("li", "item");
    const body = el("div", "body");
    body.appendChild(el("div", "line1", (a.pinned ? "📌 " : "") + (a.text || "")));
    const line2 = el("div", "line2");
    if (a.chatName) line2.appendChild(el("span", null, a.chatName));
    if (a.author) line2.appendChild(el("span", null, a.author));
    body.appendChild(line2);
    li.appendChild(body);
    ul.appendChild(li);
  }
}

/* ---- task done toggle (optimistic) ---- */
async function toggleTask(id, done) {
  try {
    await apiPatch(`/tasks/${encodeURIComponent(id)}`, { done });
    fetchAll();
  } catch {
    fetchAll(); // revert to server truth
  }
}

/* ---- main data load ---- */
async function fetchAll() {
  if (!cfg.api) {
    showEmpty("Set your backend URL in settings to load your planner.");
    return;
  }
  const [session, meetings, tasks, announcements] = await Promise.allSettled([
    apiGet("/session"),
    apiGet("/meetings"),
    apiGet("/tasks"),
    apiGet("/announcements"),
  ]);

  if (session.status === "rejected" && meetings.status === "rejected") {
    setStatus("offline");
    showEmpty("Can't reach the backend at:\n" + cfg.api + "\nCheck the tunnel is running and the URL is correct.");
    return;
  }

  setStatus(session.status === "fulfilled" ? session.value?.status : "offline");
  hideEmpty();
  renderMeetings(meetings.status === "fulfilled" ? meetings.value || [] : []);
  renderTasks(tasks.status === "fulfilled" ? tasks.value || [] : []);
  renderAnnouncements(announcements.status === "fulfilled" ? announcements.value || [] : []);
}

/* ---- empty / planner toggling ---- */
function showEmpty(msg) {
  $("empty-msg").textContent = msg;
  $("empty").classList.remove("hidden");
  $("planner").classList.add("hidden");
}
function hideEmpty() {
  $("empty").classList.add("hidden");
  $("planner").classList.remove("hidden");
}

/* ---- settings panel ---- */
function openSettings(force) {
  $("api-url").value = cfg.api;
  $("site-url").value = cfg.site;
  $("settings").classList.toggle("hidden", !force && !$("settings").classList.contains("hidden"));
  if (force) $("settings").classList.remove("hidden");
}

/* ---- polling lifecycle ---- */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(fetchAll, POLL_MS);
}
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

/* ---- wire up ---- */
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();

  $("refresh-btn").addEventListener("click", fetchAll);
  $("settings-btn").addEventListener("click", () => {
    $("settings").classList.toggle("hidden");
    if (!$("settings").classList.contains("hidden")) {
      $("api-url").value = cfg.api;
      $("site-url").value = cfg.site;
    }
  });

  $("save-btn").addEventListener("click", async () => {
    await saveConfig($("api-url").value.trim(), $("site-url").value.trim());
    $("save-hint").textContent = "Saved ✓";
    setTimeout(() => ($("save-hint").textContent = ""), 1500);
    $("settings").classList.add("hidden");
    fetchAll();
  });

  $("open-app").addEventListener("click", () => {
    if (!cfg.site) {
      $("settings").classList.remove("hidden");
      $("save-hint").textContent = "Add a Website URL first";
      return;
    }
    chrome.tabs.create({ url: cfg.site });
  });

  if (!cfg.api) {
    $("settings").classList.remove("hidden");
    showEmpty("Welcome to WhatsPlan! Enter your backend URL above and hit Save.");
  } else {
    fetchAll();
  }
  startPolling();
});

window.addEventListener("unload", stopPolling);
