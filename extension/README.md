# WhatsPlan — Chrome Extension

A **zero-build Chrome extension** (Manifest V3). No npm/Vite — you load the
folder directly. The popup shows your **planner** (meetings, tasks,
announcements) pulled live from the WhatsPlan backend.

It defaults to the live deployment at **`https://whatsplan.social`**, so it works
the moment you load it. You can point it elsewhere in ⚙ settings.

```
 https://whatsplan.social  (VM, behind nginx + Let's Encrypt)
 ├─ /                → website  (whatsplan-web, SSR :8090)
 ├─ /api/*           → backend  (whatsplan-api  :4000)
 └─ /socket.io/*     → backend  (realtime)
                         ▲ fetch
 Chrome extension popup ─┘   (this folder — planner only)
```

## Load it

1. Open `chrome://extensions`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked** → select this **`extension`** folder
4. Click the WhatsPlan icon — the planner loads from `https://whatsplan.social`
   and refreshes every 5s. Task checkboxes write back to the backend.

To point at a different backend (e.g. a local dev server), open ⚙ and set the
**Backend URL** (and **Website URL** for the "Open full app" button).

## Getting data to show up

The planner is empty until WhatsApp is linked and AI reading is on:

1. Open `https://whatsplan.social` → **Connect** → scan the QR from
   **WhatsApp → Linked devices**.
2. Turn on **AI reading** for a chat (per-chat toggle; needs email verification).
   New messages in that chat get sorted into meetings / tasks / announcements,
   which then appear in the extension.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 config — popup + `storage`/`tabs` permissions |
| `popup.html` / `popup.css` | the planner UI |
| `popup.js` | polls `/api/session`, `/api/meetings`, `/api/tasks`, `/api/announcements`; settings stored in `chrome.storage` |
| `icons/` | 16/48/128 PNGs |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Red status dot | Backend unreachable — check `https://whatsplan.social/api/session` loads, or that your custom Backend URL is correct. |
| Green dot, empty lists | No items classified yet — link WhatsApp and enable AI reading on a chat. |
| Changed the backend and want to reset | ⚙ → retype the URL → Save (clears the stored override). |

## Hosting (reference)

The website + backend are deployed to the VM automatically on every push to
`main` via [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)
(`docker compose up -d --build`), and served over HTTPS by the host nginx with a
Let's Encrypt cert. See [docker-compose.yml](../docker-compose.yml).
