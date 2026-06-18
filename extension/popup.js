/* ======================================================================
 * popup.js — the extension UI.
 * Stores ONLY login info (email + token) and the list of enabled chat names
 * in chrome.storage.local. Never stores message content.
 * ==================================================================== */
const OTP_BASE = "http://localhost:5001";
const app = document.getElementById("app");

const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
const get = (keys) => chrome.storage.local.get(keys);
const set = (obj) => chrome.storage.local.set(obj);

async function post(path, body) {
  const r = await fetch(OTP_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `${r.status}`);
  return data;
}

async function whatsappTab() {
  const tabs = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
  return tabs[0] || null;
}
async function openChat() {
  const tab = await whatsappTab();
  if (!tab) return { error: "Open WhatsApp Web in a tab first." };
  try {
    const r = await chrome.tabs.sendMessage(tab.id, { type: "getOpenChat" });
    return { chat: r?.chat || null };
  } catch {
    return { error: "Reload your WhatsApp Web tab, then reopen this." };
  }
}

/* ---------------- screens ---------------- */

async function render() {
  const { email, token } = await get(["email", "token"]);
  if (!token) return renderLogin(email);
  return renderMain();
}

/* Login = first-time email verification (stored so you don't repeat it). */
function renderLogin(prefill) {
  app.innerHTML = "";
  app.appendChild(el(`
    <div>
      <h3>Sign in</h3>
      <div class="muted">Verify your email once. We store only this login — never your messages.</div>
      <label>Email</label>
      <input id="email" type="email" placeholder="you@example.com" value="${prefill || ""}" />
      <button id="send">Send code</button>
      <div id="msg"></div>
    </div>
  `));
  document.getElementById("send").onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const msg = document.getElementById("msg");
    msg.innerHTML = "";
    if (!email.includes("@")) { msg.innerHTML = `<div class="err">Enter a valid email.</div>`; return; }
    try {
      const r = await post("/request-otp", { email });
      await set({ email });
      renderCode(email, "login", r.devCode);
    } catch (e) {
      msg.innerHTML = `<div class="err">${e.message}. Is the OTP service running on :5001?</div>`;
    }
  };
}

/* Shared code-entry screen. purpose = "login" | chat name */
function renderCode(email, purpose, devCode) {
  app.innerHTML = "";
  const isLogin = purpose === "login";
  app.appendChild(el(`
    <div>
      <h3>${isLogin ? "Enter code" : "Verify to enable"}</h3>
      <div class="muted">Code sent to <b>${email}</b>${isLogin ? "" : ` to enable <b>${purpose}</b>`}.</div>
      ${devCode ? `<div class="dev">Dev mode code: <b>${devCode}</b> (configure SMTP for real email)</div>` : ""}
      <label>6-digit code</label>
      <input id="code" inputmode="numeric" maxlength="6" placeholder="••••••" />
      <button id="verify">Verify</button>
      <button id="back" class="ghost">Back</button>
      <div id="msg"></div>
    </div>
  `));
  document.getElementById("back").onclick = render;
  document.getElementById("verify").onclick = async () => {
    const code = document.getElementById("code").value.trim();
    const msg = document.getElementById("msg");
    msg.innerHTML = "";
    try {
      const r = await post("/verify-otp", { email, code });
      if (isLogin) {
        await set({ token: r.token });
        renderMain();
      } else {
        const { enabledChats = [] } = await get("enabledChats");
        if (!enabledChats.includes(purpose)) await set({ enabledChats: [...enabledChats, purpose] });
        renderMain("scan");
      }
    } catch (e) {
      msg.innerHTML = `<div class="err">${e.message}</div>`;
    }
  };
}

async function renderMain(flash) {
  app.innerHTML = `<div class="muted center">Checking WhatsApp Web…</div>`;
  const { enabledChats = [], email } = await get(["enabledChats", "email"]);
  const oc = await openChat();

  app.innerHTML = "";
  // current open chat + toggle
  if (oc.error) {
    app.appendChild(el(`<div class="chat-card"><div class="muted">${oc.error}</div></div>`));
  } else if (!oc.chat) {
    app.appendChild(el(`<div class="chat-card"><div class="muted">No chat open. Open a chat in WhatsApp Web.</div></div>`));
  } else {
    const on = enabledChats.includes(oc.chat);
    const card = el(`
      <div class="chat-card">
        <div class="row">
          <div class="chat-name">${oc.chat}</div>
          <span class="pill ${on ? "on" : "off"}">${on ? "READING" : "OFF"}</span>
        </div>
        ${on
          ? `<button id="toggle" class="danger">Turn off reading</button>`
          : `<button id="toggle">Enable reading (verify)</button>`}
        ${flash === "scan" && on ? `<div class="scan">Scanning this chat… new messages flag automatically.</div>` : ""}
      </div>
    `);
    app.appendChild(card);
    document.getElementById("toggle").onclick = async () => {
      if (on) {
        await set({ enabledChats: enabledChats.filter((c) => c !== oc.chat) });
        await chrome.storage.session.remove("imp::" + oc.chat);
        renderMain();
      } else {
        // every enable requires a fresh OTP
        try {
          const r = await post("/request-otp", { email });
          renderCode(email, oc.chat, r.devCode);
        } catch (e) {
          app.appendChild(el(`<div class="err">${e.message}. OTP service running on :5001?</div>`));
        }
      }
    };
  }

  // detected important messages for the open chat
  if (oc.chat && enabledChats.includes(oc.chat)) {
    const sess = await chrome.storage.session.get("imp::" + oc.chat);
    const items = sess["imp::" + oc.chat] || [];
    app.appendChild(el(`<h3>Important${items.length ? ` (${items.length})` : ""}</h3>`));
    if (!items.length) {
      app.appendChild(el(`<div class="muted">Nothing flagged yet. Detected items appear here as messages come in.</div>`));
    } else {
      items.slice().reverse().forEach((m) => {
        app.appendChild(el(`
          <div class="item">
            <div class="top">
              <span><span class="cat ${m.category || "important"}">${m.category || "important"}</span> ${m.sender || ""}</span>
              <span>${m.time || ""}</span>
            </div>
            <div class="body">${escapeHtml(m.body)}</div>
            ${m.link ? `<a class="link" href="${m.link}" target="_blank">Open link</a>` : ""}
          </div>
        `));
      });
    }
  }

  // enabled list + account
  app.appendChild(el(`<hr/>`));
  app.appendChild(el(`<div class="muted">Enabled chats: ${enabledChats.length ? enabledChats.map(escapeHtml).join(", ") : "none"}</div>`));
  const out = el(`<button class="ghost" id="signout">Sign out</button>`);
  app.appendChild(out);
  out.onclick = async () => { await chrome.storage.local.remove("token"); render(); };
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// live-refresh the important list while the popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session") {
    get(["token"]).then(({ token }) => { if (token) renderMain(); });
  }
});

render();
