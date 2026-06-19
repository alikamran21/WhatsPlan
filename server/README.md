# WhatsPlan — Backend

The "Listener + Classifier + API" service behind the WhatsPlan frontend.

```
WhatsApp group  ──▶  whatsapp-web.js (listener)
                          │  every message
                          ▼
                     Groq classifier  ──▶ meeting | task | announcement | chatter
                          │
                          ▼
                   Store (local JSON file)
                          │
              REST + Socket.IO  ──▶  React frontend
```

## Stack

| Component   | Tech                                    |
| ----------- | --------------------------------------- |
| Listener    | `whatsapp-web.js` (headless Chromium)   |
| Classifier  | Groq (`llama-3.3-70b-versatile`), heuristic fallback |
| Storage     | Local JSON file (`data/store.json`)     |
| Email OTP   | Brevo (HTTP API)                        |
| API         | Express (REST) + Socket.IO (realtime)   |
| Runtime     | Node.js ≥ 18 (ESM)                      |

The Groq key is **optional** — without it the server runs a built-in heuristic
classifier, so you can develop end-to-end before signing up for anything.

## Setup

```bash
cd server
npm install            # downloads Chromium for whatsapp-web.js (~one-time)
cp .env.example .env   # then edit as needed (all keys optional)
npm run dev            # or: npm start
```

Then link a device:

1. `POST http://localhost:4000/api/session/start`
2. Open the QR: `GET http://localhost:4000/api/session/qr` (returns a data-URL
   image) — or just listen for the `qr` Socket.IO event.
3. WhatsApp → **Settings → Linked devices → Link a device** → scan it.
4. Status moves `qr → authenticated → ready`. Messages in watched groups now flow in.

### Enabling Groq (smarter sorting)

Get a free key at <https://console.groq.com> → API Keys, then set `GROQ_API_KEY`
in `.env` and restart. Until then the heuristic (keyword) classifier runs.

## API

### Session
| Method | Path                    | Purpose                              |
| ------ | ----------------------- | ------------------------------------ |
| GET    | `/api/session`          | `{ status, qr, me }`                 |
| GET    | `/api/session/qr`       | `{ qr, status }` (qr = data-URL png) |
| POST   | `/api/session/start`    | Boot the WhatsApp client             |
| POST   | `/api/session/logout`   | Unlink the device                    |

`status` ∈ `disconnected | initializing | qr | authenticated | ready`.

### Chats & messages
| Method | Path                          | Purpose                       |
| ------ | ----------------------------- | ----------------------------- |
| GET    | `/api/chats`                  | Watched chats, newest first (each carries `aiEnabled`) |
| PATCH  | `/api/chats/:id`              | `{ aiEnabled }` — toggle AI reading for one chat. Turning it **on** needs a verified email (403 `VERIFY_REQUIRED` otherwise) and backfills the planner from recent history. |
| GET    | `/api/chats/:id/messages`     | Messages for a chat           |
| POST   | `/api/chats/:id/messages`     | Send `{ text }` to a chat     |

**AI reading is per-chat opt-in.** A message is only classified into a
meeting/task/announcement when its chat has `aiEnabled: true`. Flip it from the
toggle on each chat row in the UI.

**Test the sorter** — `POST /api/classify { text }` runs any text through the
classifier and files the result, so you can try the AI without WhatsApp.

### User profile
The user is the linked WhatsApp account. Their email lives in the `users`
collection so the OTP knows where to send the code — no need to retype it.

| Method | Path          | Purpose                                            |
| ------ | ------------- | -------------------------------------------------- |
| GET    | `/api/user`   | `{ id, wid, name, email, verified, verifiedAt }`   |
| PUT    | `/api/user`   | `{ email }` → set/replace the user's email (changing it clears prior verification) |

### Email verification (gates AI reading)
| Method | Path                    | Purpose                                          |
| ------ | ----------------------- | ------------------------------------------------ |
| GET    | `/api/verify`           | `{ verified, email, verifiedAt }` for the current user |
| POST   | `/api/verify/request`   | sends a 6-digit code to the user's stored email. Optional `{ email }` sets it first. Returns `{ ok, sent, email, devCode? }` (`devCode` only when `BREVO_API_KEY` is unset). |
| POST   | `/api/verify/confirm`   | `{ code }` → verifies the user and unlocks AI reading |

Email is delivered via **[Brevo](https://www.brevo.com)** (HTTP API, no SMTP).
Set `BREVO_API_KEY` and a verified `EMAIL_FROM` sender in `.env`. Brevo's free
tier delivers to any recipient with just a verified sender (no domain). Leave
`BREVO_API_KEY` blank and the code is logged to the console and echoed in the
response so you can test with zero setup.

### Derived items
`:col` ∈ `meetings | tasks | announcements`

| Method | Path               | Purpose                |
| ------ | ------------------ | ---------------------- |
| GET    | `/api/:col`        | List items, newest first |
| PATCH  | `/api/:col/:id`    | Update (e.g. mark task done, pin announcement, fill in a meeting time) |
| DELETE | `/api/:col/:id`    | Remove                 |

### Boards (optional cloud sync)
`GET /api/boards`, `PUT /api/boards/:id`, `DELETE /api/boards/:id`.

## Realtime (Socket.IO)

Connect to the same origin. Events the server emits:

| Event     | Payload                          |
| --------- | -------------------------------- |
| `session` | `{ status, qr, me }` (on connect)|
| `status`  | `{ status, qr, me }`             |
| `qr`      | data-URL png string              |
| `message` | new message record               |
| `item`    | `{ type, item }` — a new meeting/task/announcement |

## Data shapes

```jsonc
// message
{ "id", "chatId", "chatName", "isGroup", "from", "fromName", "body", "timestamp", "fromMe" }

// meeting
{ "id", "chatId", "chatName", "messageId", "author", "title", "datetime",
  "link", "location", "incomplete", "sourceText", "confidence", "createdAt" }

// task
{ "id", "chatId", "chatName", "messageId", "author", "description", "assignee",
  "due", "priority", "done", "incomplete", "sourceText", "confidence", "createdAt" }

// announcement
{ "id", "chatId", "chatName", "messageId", "author", "text", "pinned",
  "sourceText", "confidence", "createdAt" }
```

## Notes & roadblocks

- **Account safety** — this automates a *personal* WhatsApp account. Don't send
  bulk/auto-replies; WhatsApp may flag the number. The classifier only *reads*.
- **Vague messages** — meetings/tasks missing a time are stored with
  `incomplete: true` so the frontend can surface them as "drafts" to complete.
- `WATCH_CHATS` (in `.env`) limits which chats are processed (groups **and**
  1-on-1). Blank = all. `WATCH_DMS=false` restricts the default to groups only.
- `data/` holds the WhatsApp auth session + the local store — it's git-ignored.
