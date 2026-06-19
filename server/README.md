# WhatsPlan — Backend

The "Listener + Classifier + API" service behind the WhatsPlan frontend.

```
WhatsApp group  ──▶  whatsapp-web.js (listener)
                          │  every message
                          ▼
                     Gemini classifier ──▶ meeting | task | announcement | chatter
                          │
                          ▼
                   Store (Firestore or local file)
                          │
              REST + Socket.IO  ──▶  React frontend
```

## Stack

| Component   | Tech                                    |
| ----------- | --------------------------------------- |
| Listener    | `whatsapp-web.js` (headless Chromium)   |
| Classifier  | Google Gemini (`gemini-1.5-flash`)      |
| Storage     | Firebase Firestore **or** local JSON    |
| API         | Express (REST) + Socket.IO (realtime)   |
| Runtime     | Node.js ≥ 18 (ESM)                      |

Both the Gemini key and Firebase credentials are **optional** — without them the
server still runs using a built-in heuristic classifier and a local file store,
so you can develop end-to-end before signing up for anything.

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

### Enabling Gemini

Get a free key at <https://aistudio.google.com/app/apikey>, then set
`GEMINI_API_KEY` in `.env`. Restart. Until then the heuristic classifier runs.

### Enabling Firestore

1. Create a Firebase project, add a Firestore database.
2. Project settings → **Service accounts → Generate new private key** → save the JSON.
3. In `.env`: set `GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/key.json`
   and `FIREBASE_PROJECT_ID=your-project-id`. Restart.

Until configured, data is persisted to `data/store.json`.

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
| POST   | `/api/verify/request`   | sends a 6-digit code to the user's stored email. Optional `{ email }` sets it first. Returns `{ ok, sent, email, devCode? }` (`devCode` only when no email provider is configured). |
| POST   | `/api/verify/confirm`   | `{ code }` → verifies the user and unlocks AI reading |

Email is delivered via a third-party HTTP API (no SMTP). Choose one with
`EMAIL_PROVIDER` and set its key in `.env`:

| Provider | Key | Reaches any recipient? |
| --- | --- | --- |
| `resend` | `RESEND_API_KEY` | Only your Resend account email until you verify a domain |
| `brevo` | `BREVO_API_KEY` | **Yes** — just verify a sender email (no domain) |
| `sendgrid` | `SENDGRID_API_KEY` | Yes — after single-sender verification |

Leave the chosen provider's key blank and the code is logged to the console and
echoed in the response so you can test with zero setup. For `brevo`/`sendgrid`,
set `EMAIL_FROM` to your verified sender.

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
