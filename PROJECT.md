# WhatsPlan — Project Status & Handbook

> Single source of truth for what WhatsPlan is, what's built, how to run it,
> and what's left. Last updated: 2026-06-19.

WhatsPlan turns fast-moving WhatsApp group chats into organized, actionable
plans: it reads selected chats, an AI classifies messages into **meetings /
tasks / announcements**, and you organize them on **boards** (Kanban,
Calendar, etc.) — with a gamified **pet companion** to keep you motivated.

---

## 1. Product direction (important)

We explored **two** product shapes during development:

| Direction | Status | Why |
| --- | --- | --- |
| **A. Web app** (React + backend, stores data, connects WhatsApp via QR) | ✅ **THIS IS THE PRODUCT** | Chosen by the user. Full boards/pet/premium/DB features. |
| B. Privacy Chrome extension (on-device, no storage, read-only) | 🧊 Shelved | Built as `extension/` + `otp-service/`, then set aside because it conflicts with the web app's "store data / move chats to boards" model. |

**The web app wins.** The extension code remains in the repo for reference but
is not the active product. The "100% privacy / no storage / read-only" rules
from the extension idea **do not apply** to the web app.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND  (TanStack Start + React 19 + Tailwind v4)         │
│  src/components/WhatsPlanApp.tsx  ← the entire single-file UI │
│  src/lib/api.ts                  ← REST + Socket.IO client   │
│        │  http / websocket                                   │
│        ▼                                                      │
│  BACKEND  (Node + Express + Socket.IO)   → server/           │
│   • whatsapp-web.js  (headless Chromium, QR login)           │
│   • Gemini classifier (+ keyword fallback)                   │
│   • Store: Firestore  OR  local file (data/store.json)       │
│   • 24h retention sweep (auto-deletes raw messages)          │
└─────────────────────────────────────────────────────────────┘
   Docker Compose runs both:  web :8080   api :4000
```

**Stack**
- Frontend: React 19, TailwindCSS v4, Framer Motion, TanStack Start, qrcode.react, lucide-react
- Backend: Node ≥18 (ESM), Express, Socket.IO, whatsapp-web.js, @google/generative-ai, firebase-admin
- Infra: Docker + docker-compose, Firebase Firestore (project `whatsplan-db`)

---

## 3. Repository map

```
WhatsPlan/
├─ PROJECT.md                  ← this file
├─ DOCKER.md                   ← docker run guide + API key/DB/WhatsApp explainer
├─ docker-compose.yml          ← web + api services
├─ firebase.json, firestore.rules
├─ docs/PET_WITH_CODEX.md      ← how to make a pet sprite with Codex
│
├─ src/                        ← FRONTEND (web app — the product)
│  ├─ components/WhatsPlanApp.tsx   ← ~3000-line single-file app (everything UI)
│  ├─ lib/api.ts                    ← backend client + React hooks (useSession, useChats,
│  │                                  useMessages, usePlanner, useBoards, useSyncedDoc)
│  └─ routes/, router.tsx, ...
│
├─ public/pets/
│  ├─ fox.png                  ← the active pet image (your fox)
│  └─ hatchling/atlas.json     ← sprite-atlas layout (optional animated pet)
│
├─ server/                     ← BACKEND
│  ├─ src/index.js             ← Express + Socket.IO bootstrap + crash guards
│  ├─ src/config.js            ← env loading
│  ├─ src/routes.js            ← all /api routes
│  ├─ src/retention.js         ← 24h message auto-purge
│  ├─ src/whatsapp/client.js   ← whatsapp-web.js lifecycle, QR, scan, classify
│  ├─ src/ai/classifier.js     ← Gemini + heuristic fallback
│  ├─ src/store/{index,firestore,memory}.js  ← swappable storage
│  ├─ .env  /  .env.example
│  ├─ serviceAccount.json      ← Firebase admin key (GITIGNORED — see security)
│  └─ Dockerfile
│
├─ hatch-pet/scripts/          ← Python pipeline to generate a pet sprite atlas
│
├─ extension/                  ← 🧊 SHELVED privacy Chrome extension (not the product)
└─ otp-service/                ← 🧊 SHELVED email-OTP service for the extension
```

---

## 4. What's BUILT (done ✅)

### Backend (`server/`)
- WhatsApp connection via `whatsapp-web.js` — QR login, auto-reconnect, session persisted in a Docker volume.
- Message pipeline: incoming message → store → AI classify → emit live to frontend.
- Gemini classifier with a keyword fallback (works with no API key).
- Storage: Firestore **or** local file store (auto-selects; falls back gracefully).
- REST API: `/session`, `/chats`, `/chats/:id/messages`, `/groups`, `/meetings`, `/tasks`, `/announcements`, `/boards`, `/state/:key`.
- Socket.IO live events: `status`, `qr`, `message`, `item`, `purged`.
- Resilience: global crash guards, stale Chromium-lock auto-clear, retrying chat sync, read-only mode (`READ_ONLY`), watched-groups filter (`WATCH_CHATS`), 24h retention sweep.

### Frontend (`src/`)
- **Auth = your real WhatsApp** — scan the QR to enter; your number is your identity (no email/password). Sign out unlinks.
- **Chats** — real chat list (119 groups synced in testing), live message history on open, send box (disabled in read-only).
- **Planner** — Meetings / Tasks / Announcements, live-updating from the classifier; edit/complete/pin/delete.
- **Boards** — Kanban/Table/Roadmap/Calendar/Checklist/Notes; persist to backend (offline-safe).
- **Gamification** — badges/streak/XP, persisted to backend.
- **Pet companion** — see §6.

### Teammate's 9-section UI pass (all ✅)
1. **Pixel-art logo** (`crispEdges`, flat fills, rect checkmarks).
2. **Boards quick-create** row (double-click a style to start).
3. **Board type switcher** — ↺ on cards + "Style" button in header (preserves tasks).
4. **Jira card modal** — status, due date+time, deadline pill, assignee quick-picks, @mentions, comments thread, tags.
5. **Calendar fixes** — z-50, spring, Cancel, disabled-Save, endDate/assignee/priority, color-picker fix.
6. **Share modal** — 3 tabs (🔗 Link / 💬 WhatsApp / QR).
7. **Settings account** — Connect-WhatsApp QR panel + Frontend→Backend connection map.
8. **Premium pet system** — 8 pets (fox default), XP/levels/treats, moods, companion panel, messages, right-click menu.
9. **AppShell** — passes `streak`/`tasksToday` to pet; `useGamification` returns `completedToday`.

### Infra
- Docker Compose (web + api), Firestore rules (deny-all; admin bypasses), `docs/PET_WITH_CODEX.md`.

---

## 5. How to RUN

```bash
# 1. Backend + frontend together (recommended)
docker compose up --build
#    → frontend  http://localhost:8080
#    → backend   http://localhost:4000
#    Open the app, scan the WhatsApp QR, you're in.

# --- OR run pieces manually ---
# Backend
cd server && npm install && cp .env.example .env && npm run dev
# Frontend
bun install && bun dev
```

**Config lives in `server/.env`:**
- `GEMINI_API_KEY` — smarter classification (blank = keyword fallback).
- `FIREBASE_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` — Firestore (blank = local file store).
- `WATCH_CHATS` — comma-separated group names to watch (blank = all groups). Discover names via `GET /api/groups`.
- `READ_ONLY=true` — never send (ban-safety; recommended).
- `RETENTION_HOURS=24` — raw messages auto-deleted after N hours.

**Frontend → backend URL:** `VITE_API_URL` (defaults to `http://localhost:4000`).

---

## 6. The pet companion

- Component: `WebPet` in `WhatsPlanApp.tsx`. Floating, draggable, snaps to a side.
- 8 pets: **fox (default)**, cat, dog, bunny, bear, frog, capybara, ghost. Fox renders `public/pets/fox.png`; others use emoji.
- XP / levels / treats (localStorage keys `wp_pet_xp`, `wp_pet_level`, `wp_pet_treats`). Level up at `level × 100` XP → earns a treat.
- Interactions: click = idle message + wiggle, double-click = companion panel, right-click = menu (feed/pet/panel/snooze/hide).
- Moods from activity; celebration messages tiered by streak (3/7/14/30).
- For an **animated sprite** pet instead of a still image, see `docs/PET_WITH_CODEX.md` + `hatch-pet/scripts/`.

---

## 7. Known issues / caveats

- **Not yet run end-to-end after the latest UI pass.** All recent changes are syntax/parse-verified and bracket-balanced, but there's no `bun`/build in the authoring environment. Verify visually on `bun dev` / `docker compose up`.
- **whatsapp-web.js is unofficial** — it can break when WhatsApp updates its web client, and automation risks number flags/bans. Keep `READ_ONLY=true`; never auto-send/bulk-send. Consider a secondary number for testing.
- **Firestore currently DISABLED in `server/.env`** (commented out) because the Firestore database hadn't been created in the console — the app uses the local file store. To re-enable: create the DB (Firebase Console → Build → Firestore Database → Create database), uncomment the two `FIREBASE_*` lines, then `docker compose up -d --force-recreate api`.
- **Calls tab is empty by design** — whatsapp-web.js doesn't expose call history.
- **Assignee/@mention are free-text / quick-picks** — real WhatsApp contact resolution needs backend wiring.
- A few **unused pet helpers** remain (`FoxPlaceholder`, `petMotion`, `HATCH_MANIFEST`) — harmless, can be deleted.

---

## 8. 🔴 SECURITY — action required

- The Firebase **service-account private key** (`server/serviceAccount.json`) was pasted into chat during setup, so it must be treated as **compromised**. **Rotate it:** Firebase Console → Project settings → Service accounts → delete the old key → generate a new one → replace the file (same path). It is gitignored, so it won't be committed.
- The Firebase **web** `apiKey` is public by design (not a secret) — fine to expose.
- Keep `serviceAccount.json`, `server/.env`, and any tokens out of git (already gitignored).

---

## 9. What's LEFT / next steps

**Backend wiring (frontend is ready for it):**
- Re-enable + verify Firestore (create the DB, flip env).
- Real contact resolution for assignee/@mentions (WhatsApp contacts → board).
- Board sharing endpoints: `POST /api/boards/:id/publish`, `POST /api/whatsapp/send`.
- Dispatch `webpet:celebrate` on real task completion so the pet earns XP from actual work (currently XP mainly via feeding).

**Product polish:**
- Calendar: drag events, week view.
- Board: drag-and-drop cards between columns.
- Pet: environments/outfits/accessories (the broader Finch-style system, only partially built).
- Multi-user / real accounts (currently single-user = one linked WhatsApp).

**Cleanup:**
- Remove unused pet helpers.
- Decide whether to delete or keep the shelved `extension/` + `otp-service/`.

---

## 10. Backend connection map (for whoever wires it)

| Feature | Endpoint | Where |
| --- | --- | --- |
| Chats | `GET /api/chats`, `/chats/:id/messages` | `src/lib/api.ts` ↔ `server/src/routes.js` |
| Planner | `GET /api/meetings\|tasks\|announcements` | `src/lib/api.ts` ↔ `server/src/routes.js` |
| Boards | `GET/PUT /api/boards` | `src/lib/api.ts` ↔ `server/src/routes.js` |
| Gamification/state | `GET/PUT /api/state/:key` | `src/lib/api.ts` ↔ `server/src/routes.js` |
| WhatsApp session/QR | `POST /api/session/start`, `GET /api/session`, socket `qr` | `server/src/whatsapp/client.js` |
| Groups (for WATCH_CHATS) | `GET /api/groups` | `server/src/whatsapp/client.js` |

See also the live "Frontend → Backend connection map" panel in **Settings → Account**.
