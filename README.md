<div align="center">

<img src="https://img.shields.io/badge/WhatsPlan-Companion-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsPlan" height="36"/>

# WhatsPlan

### Chat, plan, win the day.

**WhatsPlan** listens to your WhatsApp group chats and quietly sorts the noise into **meetings, tasks, and announcements** — so the group keeps talking the way it always has, while the important stuff stops getting lost.

<br/>

[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com/start)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)

</div>

---

## ⚡ The problem

Group chats move fast.

> A Zoom link sent at **9:04am** is buried under forty messages by **9:20**.
> A task assigned mid-joke gets forgotten.
> Nobody re-scrolls 200 messages to find a holiday notice from three days ago.

WhatsPlan **reads, classifies, and surfaces** — turning a live chat into an organized planner.

```
💬 "standup on Zoom tmrw 9am — zoom.us/j/9284..."   →  📅 MEETING   · 9:00 AM · link extracted
💬 "@sara can you finish API docs before EOD? 🙏"    →  ✅ TASK      · Assignee: Sara · Due: EOD
💬 "office closed Friday public holiday 🏖️"          →  📢 NOTICE    · Friday · all-team
💬 "lmaooo ok see you guys there"                    →  💬 chatter   · skipped
```

---

## 🔄 How it works

```
1. Link WhatsApp        → scan a QR (whatsapp-web.js), no password
2. Flip a chat's AI on  → a per-chat toggle, gated by email OTP verification
3. Messages flow in     → each is classified (Gemini, with a keyword fallback)
4. The Planner fills up  → meetings / tasks / announcements, in real time
```

A chat is only read **after you opt it in** with the toggle — and turning that on requires a one-time **email verification code** (sent via Brevo). The verification stays valid for a short, configurable window, then re-prompts.

---

## ✅ Features

| | |
|---|---|
| 🤖 **AI message sorting** | Every message → meeting / task / announcement / chatter, with time, link, assignee & due-date extraction. Gemini-powered, with a built-in heuristic fallback so it works with no key. |
| 🔌 **Live WhatsApp** | Real device link via `whatsapp-web.js`. Read-only by default for account safety. Watches groups **and** 1-on-1 chats. |
| 🔐 **Per-chat opt-in + email OTP** | Toggle AI reading per chat; enabling requires an emailed 6-digit code. User identity = your WhatsApp account; email lives on a DB-backed profile. |
| 🗂️ **Planner** | Meetings, tasks, and announcements pulled from chats — editable, completable, pinnable. Plus a built-in **"Test the AI sorter"** box (paste text, watch it file). |
| 📋 **Boards** | Kanban, Table, Roadmap, Calendar, Checklist, and Notes board types with drag-and-drop. |
| 🎨 **8 themes** | All on WhatsApp's green palette — Classic, Dark, Neo-Brutalist, Claymorphism, Glassmorphism, Neon, Skeuomorphic, Paper & Ink. |
| 🎮 **Gamification** | Streaks, badges, completion tracking, and a floating pet companion that levels up. |
| ⚡ **Realtime** | Socket.IO pushes new messages and sorted items to the UI instantly. |

---

## 🏗️ Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────────────────┐
│  Frontend  (web · :8080)    │         │  Backend  (api · :4000)               │
│  React 19 · TanStack Start  │  REST   │  Express · Socket.IO                  │
│  Tailwind · Framer Motion   │ ◄─────► │                                       │
│                             │  WS     │  whatsapp-web.js  ─┐ (headless Chrome) │
└─────────────────────────────┘         │  Gemini / heuristic ├─► classifier    │
                                        │  Brevo  ───────────┘ (email OTP)       │
                                        │  Store: local JSON file or Firestore   │
                                        └────────────────────────────────────────┘
```

| Layer | Tech |
|---|---|
| **Frontend** | React 19, TanStack Start (SSR), Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js (ESM), Express, Socket.IO |
| **WhatsApp** | `whatsapp-web.js` (headless Chromium) |
| **AI** | Google Gemini (`gemini-2.0-flash`), with a keyword/regex fallback |
| **Email OTP** | Brevo (also supports Resend / SendGrid) over HTTP — no SMTP |
| **Storage** | Local JSON file (default) or Firebase Firestore |

---

## 🚀 Getting started

### Option A — Docker *(recommended)*

```bash
git clone <this-repo-url> && cd WhatsPlan
cp server/.env.example server/.env      # optional: add API keys (works without them)
docker compose up --build
```

- App → **http://localhost:8080**
- API → **http://localhost:4000**

To link WhatsApp: open the app, scan the QR shown on the login screen (WhatsApp → **Settings → Linked devices → Link a device**).

### Option B — Local (Node 20+)

```bash
# backend
cd server && npm install && npm run dev     # → :4000  (downloads Chromium once)

# frontend (new terminal, repo root)
npm install && npm run dev                  # → :8080
```

> **Everything runs with zero API keys.** Without a Gemini key it uses the heuristic classifier; without an email provider the OTP is printed to the server console. Add keys when you want the real thing.

---

## ⚙️ Configuration

All backend config lives in **`server/.env`** (git-ignored — safe for keys). Copy `server/.env.example` and fill in what you need:

| Key | Purpose | Required? |
|---|---|---|
| `GEMINI_API_KEY` | AI classifier ([AI Studio](https://aistudio.google.com/app/apikey)) | Optional — falls back to heuristic |
| `EMAIL_PROVIDER` | `brevo` \| `resend` \| `sendgrid` | Optional |
| `BREVO_API_KEY` | Email OTP delivery | Optional — falls back to console code |
| `EMAIL_FROM` | A **verified** sender for your provider | With email |
| `WATCH_CHATS` / `WATCH_DMS` | Which chats to watch | Optional |
| `READ_ONLY` | Never send WhatsApp messages (ban-safety) | Default `true` |

The frontend only needs **`VITE_API_URL`** (in a root `.env.local`), which defaults to `http://localhost:4000`. **Never put secrets in frontend env** — anything `VITE_*` ships to the browser.

See [`server/README.md`](server/README.md) for the full API and backend details.

---

## 🧪 Testing the AI sorter

You don't need a live chat to see it work:

- **In-app** → open the **Planner** tab → *"Test the AI sorter"* box → paste a message → it's classified and filed below.
- **curl**:
  ```bash
  curl -X POST http://localhost:4000/api/classify \
    -H "content-type: application/json" \
    -d '{"text":"standup tomorrow 9am zoom.us/j/123"}'
  ```

---

## 📁 Project structure

```
WhatsPlan/
├── src/                         # Frontend (TanStack Start)
│   ├── components/WhatsPlanApp.tsx   ← the whole app shell
│   ├── lib/api.ts                    ← backend client + React hooks
│   └── routes/                       ← SSR routes
├── server/                      # Backend
│   └── src/
│       ├── whatsapp/client.js        ← device link + message pipeline
│       ├── ai/classifier.js          ← Gemini + heuristic
│       ├── verify.js · users.js      ← email OTP + user profiles
│       ├── email.js                  ← Brevo / Resend / SendGrid
│       ├── store/                    ← local-file or Firestore
│       └── routes.js                 ← REST API
└── docker-compose.yml
```

---

## ⚠️ Known limitations

| Limitation | Notes |
|---|---|
| **AI accuracy without Gemini** | The heuristic fallback is keyword-based and will miss edge cases. A Gemini key (with quota) unlocks context-aware sorting. |
| **Email senders** | Free email providers require a **verified sender**; a no-name address needs a verified neutral inbox or your own domain. |
| **Call history** | The Calls tab is a placeholder — WhatsApp Web doesn't expose call logs. |
| **Account safety** | This automates a personal WhatsApp account. `READ_ONLY=true` (default) keeps the link read-only. |

---

<div align="center">

**WhatsPlan** · MIT License · *The group chat stays. The chaos doesn't.*

</div>
