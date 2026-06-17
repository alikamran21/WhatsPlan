# WhatsPlan

Chat, plan, win the day. WhatsPlan is a WhatsApp-flavored planning workspace — kanban boards, tables, roadmaps, calendars, checklists, and notes — built on top of an AI layer that reads your group chat and sorts the noise into meetings, tasks, and announcements automatically.

## The problem

Group chats move fast. A Zoom link sent at 9:04am is buried under forty messages by 9:20. A task assigned mid-joke gets forgotten. Nobody re-scrolls 200 messages to find a holiday notice from three days ago. WhatsPlan listens, classifies, and surfaces — so the group keeps talking the way it always has, while the important stuff stops getting lost.



## What's built

- **Eight visual themes**, all anchored to WhatsApp's green palette: Classic, Dark, Neo-Brutalist, Skeuomorphic, Claymorphism, Glassmorphism, Neon, and Paper & Ink — switchable anytime from Settings.
- **Six board types** for organizing extracted (or manually added) items: Kanban, Table, Roadmap, Calendar, Checklist, and Notes.
- **A lightweight gamification layer** — streaks, badges, and completion tracking — to encourage people to actually keep using the dashboard.
- **Local persistence** — boards, theme choice, and progress survive a refresh (browser-local for now; see Known Limitations).
- **AI message classification** via the Anthropic API — paste in chat text, and a Supabase Edge Function classifies each line into meeting / task / announcement / chatter with extracted fields (time, link, assignee, confidence).

## What's not built yet (be honest with judges about this)

- No live WhatsApp connection — there's no real Listener (whatsapp-web.js/Baileys) wired up. The "Chats"/"Calls" tabs are placeholders for that future integration.
- No shared/multi-user sync — board data lives in the browser's local storage, so it's single-device for now, not yet shared across a real group.
- No real authentication — login is a UI flow without a backend identity provider behind it.

Calling these out here, rather than hoping nobody notices, is deliberate — it's a more credible position in front of judges than overclaiming.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TanStack Start + Vite, Tailwind, shadcn/ui, Framer Motion |
| AI classification | Anthropic API (Claude), structured JSON output, via a Supabase Edge Function |
| Backend / data | Supabase (via Lovable Cloud) |
| Hosting | Lovable |

## Getting started

### Option A — Docker (recommended, fastest path to "just see it")

```bash
git clone <this-repo-url>
cd whatsplan
docker compose up --build
```

Then open `http://localhost:8080`.

### Option B — Local Node

```bash
npm install
npm run dev
```

Requires Node 20+. The dev server runs on port 8080.

### Environment variables

Copy `.env.example` to `.env` and fill in the values described there. The Anthropic API key powers the message classifier and should only ever be set as a server-side secret (Lovable Cloud → Secrets, or your own backend's env), never committed or placed in frontend code.

## Project structure

```
src/components/WhatsPlanApp.tsx   — the whole app shell (themes, boards, gamification, settings)
src/components/ui/                — shadcn/ui component kit
supabase/functions/               — Edge Functions, including the AI classifier
docs/WhatsPlan-PRD.md             — full product requirements doc
```

## Roadmap

1. Real WhatsApp listener (Baileys/whatsapp-web.js) feeding the classifier live.
2. Shared boards across group members (move off local-storage-only persistence).
3. Calendar export (Google/.ics) and reminder notifications.
4. Accessibility pass (contrast audit, density toggle for data-heavy boards).

See `docs/WhatsPlan-PRD.md` for the full reasoning behind these priorities.


