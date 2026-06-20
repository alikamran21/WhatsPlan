# WhatsPlan — Chrome Extension + VM Hosting Guide

This folder is a **zero-build Chrome extension** (Manifest V3). No npm, no Vite —
you load the files directly. The popup shows your **planner** (meetings, tasks,
announcements) pulled live from the WhatsPlan backend running on your VM.

```
 VM (public IP)                                   Your Chrome (anywhere)
 ┌───────────────────────────┐                   ┌──────────────────────┐
 │ server/  → backend :4000  │── cloudflared ──► │ extension popup       │
 │ website  → SSR app :3000  │     tunnels       │  (planner, this dir)  │
 └───────────────────────────┘   (HTTPS URLs)    └──────────────────────┘
```

The extension talks to the backend's **HTTPS tunnel URL**, which you paste into
its settings. The "Open full app" button opens the website's tunnel URL.

---

## Part A — Run everything on the VM (via MobaXterm)

> Order matters: you need the backend's tunnel URL *before* you build the website,
> because the website's browser code calls the backend directly.

### 1. Backend (port 4000)

```bash
cd ~/WhatsPlan/server
npm install
npm start            # → "WhatsPlan backend → http://localhost:4000"
```

Headless-Linux note: `whatsapp-web.js` drives a real Chromium. If it crashes on
boot, install the libs it needs:
`sudo apt-get install -y chromium-browser libnss3 libatk-bridge2.0-0 libgbm1 libasound2`.
Then link your phone via the QR (see [../server/README.md](../server/README.md)).

### 2. Install cloudflared (one time)

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/
```

### 3. Tunnel the backend → get your API URL

In its own terminal (or `tmux`/`screen` so it survives disconnect):

```bash
cloudflared tunnel --url http://localhost:4000
```

It prints a line like:

```
https://blue-cat-1234.trycloudflare.com   ←  THIS is your BACKEND URL
```

Copy it. Leave this running.

### 4. Build + run the website (port 3000)

The frontend is **TanStack Start (SSR)**, so build it as a Node server and bake
in the backend URL from step 3:

```bash
cd ~/WhatsPlan
npm install
VITE_API_URL=https://blue-cat-1234.trycloudflare.com NITRO_PRESET=node-server npm run build
PORT=3000 node .output/server/index.mjs
```

### 5. Tunnel the website → get your Website URL

Another terminal:

```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the printed `https://...trycloudflare.com` — that's your **Website URL**.

You now have two HTTPS URLs:
- **Backend URL** (step 3) → goes in the extension settings
- **Website URL** (step 5) → the "Open full app" button + share this as "the site"

---

## Part B — Load the extension in Chrome

1. Open `chrome://extensions`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select this **`extension`** folder
5. Click the WhatsPlan icon → ⚙ **settings** → paste:
   - **Backend URL** = the step-3 URL
   - **Website URL** = the step-5 URL
6. **Save**. The planner loads and refreshes every 5s.

---

## About the name "whatsplan"

Free Cloudflare *quick tunnels* (`trycloudflare.com`) hand you a **random**
subdomain you can't choose — so you can't get a literal `whatsplan` URL this way.
To brand the URL you need a domain pointed at Cloudflare:

- Register any cheap domain, add it to a free Cloudflare account, then use a
  **named tunnel** with a custom hostname like `app.whatsplan.<yourdomain>`.
  Named tunnels also give you a **stable** URL that doesn't change on restart
  (quick-tunnel URLs change every time you restart cloudflared — you'll have to
  re-paste them into the extension when that happens).

Until then, the random tunnel URLs work fine for you and anyone you share them with.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Red dot, "Can't reach the backend" | Backend or its tunnel isn't running, or the URL in settings is stale (quick-tunnel URLs change on restart). |
| Planner empty but dot is green | No meetings/tasks/announcements classified yet, or AI reading isn't enabled on any chat (full app → toggle per chat). |
| CORS error in the popup console | The backend reflects any origin by default. Only breaks if you set `CORS_ORIGIN` — then add your extension's `chrome-extension://<id>` origin to it, or leave it unset. |
| Website 500s | Make sure you built with `NITRO_PRESET=node-server`; the default build target is Cloudflare Workers, which won't run under `node`. |
