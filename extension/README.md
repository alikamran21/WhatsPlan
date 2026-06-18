# WhatsPlan — Private Chat Reader (Chrome extension)

A Chrome extension that flags **important messages** in WhatsApp Web chats you
**explicitly enable** — with maximum privacy:

- 🔒 **On-device detection** — message text never leaves your browser.
- 🙈 **Reads only the chat you open**, and only if you've turned it ON.
- ✅ **Per-chat verification** — enabling a chat requires an email OTP.
- 🗑️ **No message storage** — detected items live in volatile session memory
  (RAM only, wiped on browser close). The only thing saved to disk is your
  login (email + token) and the list of enabled chat **names**.
- 👁️ **Read-only** — it cannot send messages.

## Architecture

```
extension/            ← loaded into Chrome (this folder)
  manifest.json
  content.js          reads the OPEN chat's messages from the WhatsApp Web DOM
  detector.js         on-device importance rules (no network)
  background.js       holds detected items in RAM-only session storage
  popup.*             the UI (login, per-chat toggle, important list)

otp-service/          ← tiny local server, ONLY emails + checks codes
```

## Run it

**1. Start the OTP service** (handles the email verification codes):
```bash
cd otp-service
npm install
cp .env.example .env     # optional — leave as-is for dev (codes print to console)
npm run dev              # runs on http://localhost:5001
```
In dev mode the code is printed to the console **and** shown in the popup, so
you can test without configuring email. To send real emails, fill in the
`SMTP_*` values in `.env`.

**2. Load the extension** in Chrome:
1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** → select this `extension/` folder
4. Open **https://web.whatsapp.com** and log in as usual

**3. Use it:**
1. Click the WhatsPlan toolbar icon → **Sign in** with your email (one-time;
   the code prints in the OTP service console / shows in the popup in dev).
2. Open a chat in WhatsApp Web.
3. In the popup, click **Enable reading (verify)** → enter the emailed code.
4. That chat is now read **on-device**; important messages appear in the popup
   and update live. It stays ON until you **Turn off reading**.

## Privacy summary

| Data | Where it lives | Persisted? |
| --- | --- | --- |
| WhatsApp message text | read in-page, scanned in RAM | **never stored** |
| Detected important items | `chrome.storage.session` | RAM only, gone on browser close |
| Your email + login token | `chrome.storage.local` | yes (so you don't re-login) |
| Enabled chat names | `chrome.storage.local` | yes |
| Pending OTP codes / tokens | otp-service memory | RAM only |

## Caveats

- **WhatsApp Web DOM is unofficial** and changes; if reading stops working
  after a WhatsApp update, the selectors in `content.js` need adjusting.
- Reads only the **currently open** chat (by design — most private).
- This is a personal, read-only tool. It does not send messages.
