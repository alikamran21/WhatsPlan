# Running WhatsPlan with Docker

One command brings up the whole stack:

- **web** — the React/TanStack frontend → http://localhost:8080
- **api** — the backend (WhatsApp listener + Gemini classifier + REST/Socket.IO) → http://localhost:4000

```bash
docker compose up --build
```

That's it. Open http://localhost:8080. The first build takes a few minutes
(it installs Chromium into the api image for WhatsApp).

> Works out of the box with **no API key and no database setup** — it falls
> back to a built-in keyword classifier and a local file store. Add the
> Gemini key / Firebase later to upgrade (see below); your data persists.

To stop: `Ctrl+C`, or `docker compose down` (add `-v` to also wipe the
WhatsApp login + stored data).

---

## 1. Where the API key goes (Gemini)

The classifier uses Google Gemini. The key lives in **`server/.env`** — it is
*never* baked into the image; compose injects it at runtime.

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:

```ini
GEMINI_API_KEY=AIza...your-key...
GEMINI_MODEL=gemini-1.5-flash
```

Get a free key at <https://aistudio.google.com/app/apikey>. Restart the api
container to pick it up:

```bash
docker compose up -d --build api
```

**No key?** Leave it blank — the server logs `Classifier: heuristic fallback`
and still sorts messages using keyword rules. You can add the key anytime.

---

## 2. The database connection

There are two modes; the server picks automatically based on `server/.env`.

### Default — local file store (zero setup)
With no Firebase config, everything is written to `/app/data/store.json`
inside the api container. That folder is a **named Docker volume**
(`wa-data`), so your meetings/tasks/boards/etc. **survive restarts**. Nothing
to configure — good for testing.

### Firebase Firestore (optional, free tier)
1. Create a Firebase project + Firestore database.
2. Project settings → **Service accounts → Generate new private key** → save
   the JSON as `server/serviceAccount.json`.
3. In `server/.env`:
   ```ini
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccount.json
   ```
4. Mount the key into the container — add this under the `api` service in
   `docker-compose.yml`:
   ```yaml
       volumes:
         - wa-data:/app/data
         - ./server/serviceAccount.json:/app/serviceAccount.json:ro
   ```
5. `docker compose up -d --build api`. The log should say
   `Storage: Firestore`.

Where the data goes: collections `chats`, `messages`, `meetings`, `tasks`,
`announcements`, `boards`, `state` — same shapes in both modes, so switching
is seamless.

---

## 3. How WhatsApp connecting works

WhatsApp has no open API for personal accounts, so the backend runs
`whatsapp-web.js`: a **headless Chromium inside the api container** that logs
in exactly like WhatsApp Web — you link it once by scanning a QR with your
phone.

The flow:

1. **Open the app** (http://localhost:8080). On the login screen's QR panel —
   or the **Chats** tab's "Connect" banner — the frontend asks the backend to
   start a session.
2. **Backend boots Chromium** and emits a **QR code**, which streams to the
   browser live over Socket.IO. Status goes `initializing → qr`.
3. **Scan it** from your phone: WhatsApp → **Settings → Linked devices →
   Link a device** → point at the QR on screen.
4. Status moves `qr → authenticated → ready`. You're linked.
5. From now on, **every message in your watched group chats** flows into the
   backend, gets classified (meeting / task / announcement / chatter), and
   shows up live in **Chats** and the **Planner** tab.

The login is saved in the `wa-data` volume (`/app/data/wwebjs_auth`), so after
the first scan you **stay linked across restarts** — no re-scanning unless you
log out or run `docker compose down -v`.

**Choosing which groups to watch** — by default it watches *all* group chats.
To narrow it, set in `server/.env` (partial name match, comma-separated):
```ini
WATCH_CHATS=Project Alpha, Family
```

**Safety note:** this drives a *personal* WhatsApp account. The agent only
*reads* and classifies — it never auto-replies or sends bulk messages, which
is what gets numbers flagged. Sending only happens when *you* type in a chat.

---

## Handy commands

| Command | What it does |
| ------- | ------------ |
| `docker compose up --build` | Build + run everything (foreground, see logs) |
| `docker compose up -d --build` | Same, detached (background) |
| `docker compose logs -f api` | Watch backend logs (QR status, classifications) |
| `docker compose restart api` | Restart just the backend |
| `docker compose down` | Stop containers (keeps your WhatsApp login + data) |
| `docker compose down -v` | Stop **and** wipe the `wa-data` volume (fresh start) |

## Troubleshooting

- **`env file ... not found`** — your Docker Compose is older than v2.24.
  Just create the file: `cp server/.env.example server/.env`.
- **QR never appears / Chromium errors** — check `docker compose logs -f api`.
  Give Docker a bit more memory (Chromium is heavy); the image already passes
  `--no-sandbox --disable-dev-shm-usage`.
- **Frontend can't reach the API** — make sure port `4000` is published and
  nothing else is using it. The browser talks to `http://localhost:4000`
  (not the `api` service name — it runs on your host, not in Docker).
