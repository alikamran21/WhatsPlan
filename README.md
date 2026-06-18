<div align="center">

<img src="https://img.shields.io/badge/WhatsPlan-Companion-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsPlan" height="36"/>

# WhatsPlan

### Chat, plan, win the day.

**WhatsPlan** is a WhatsApp-flavored planning workspace — kanban boards, tables, roadmaps, calendars, checklists, and notes — built on top of an AI layer that reads your group chat and sorts the noise into meetings, tasks, and announcements automatically.

<br/>

[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TanStack](https://img.shields.io/badge/TanStack_Start-FF4154?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Claude AI](https://img.shields.io/badge/Claude_AI-D4A27A?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)

<br/>

</div>

---

## ⚡ The Problem

Group chats move fast.

> A Zoom link sent at **9:04am** is buried under forty messages by **9:20**.  
> A task assigned mid-joke gets forgotten.  
> Nobody re-scrolls 200 messages to find a holiday notice from three days ago.

**WhatsPlan listens, classifies, and surfaces** — so the group keeps talking the way it always has, while the important stuff stops getting lost.

```
💬 "standup on Zoom tmrw 9am — zoom.us/j/9284..."   →  📅 MEETING   · 9:00 AM · zoom link extracted
💬 "@sara can you finish API docs before EOD? 🙏"    →  ✅ TASK      · Assignee: Sara · Due: EOD
💬 "office closed Friday public holiday 🏖️"          →  📢 NOTICE   · Friday · all-team
💬 "lmaooo ok see you guys there"                    →  💬 chatter  · skipped
```

---

## ✅ What's Built

### 🎨 Eight Visual Themes

All anchored to WhatsApp's green palette — switchable anytime from Settings.

| Theme | Vibe |
|---|---|
| **Classic** | WhatsApp green, familiar and clean |
| **Dark** | Deep navy, easy on the eyes |
| **Neo-Brutalist** | High contrast, thick borders, hard shadows |
| **Skeuomorphic** | Textured surfaces, depth, tactile feel |
| **Claymorphism** | Soft, rounded, playful 3D |
| **Glassmorphism** | Frosted-glass surfaces, blur, transparency |
| **Neon** | Dark background, electric green accents |
| **Paper & Ink** | Off-white, serif-inspired, minimal |

---

### 🗂️ Six Board Types

| Board | Best for |
|---|---|
| 📋 **Kanban** | Sprint tasks, drag-drop workflow |
| 📊 **Table** | Data-dense views, sortable records |
| 🗺️ **Roadmap** | Timeline milestones, project arcs |
| 📅 **Calendar** | Date-anchored meetings and deadlines |
| ✅ **Checklist** | Action lists with streaks and completion |
| 📝 **Notes** | Free-form capture, announcements |

---

### 🤖 AI Message Classification

Paste in chat text → a **Supabase Edge Function** sends it to Claude → every line comes back classified:

```json
[
  {
    "line": "standup on Zoom tmrw 9am — zoom.us/j/9284",
    "type": "meeting",
    "time": "09:00",
    "link": "zoom.us/j/9284",
    "confidence": 0.97
  },
  {
    "line": "@sara can you finish API docs before EOD?",
    "type": "task",
    "assignee": "Sara",
    "due": "EOD",
    "confidence": 0.94
  }
]
```

---

### 🎮 Gamification Layer

Streaks, badges, and completion tracking keep the team engaged past day one.

- 🔥 Daily streaks — keep the board alive
- 🏅 Badges — Sprint Master, Zero Inbox, and more
- 📊 Progress bars — per-board completion tracking

---

### 💾 Local Persistence

Boards, theme choice, and progress all survive a browser refresh via `localStorage` — no account required to get value immediately.

---

## ⚠️ Known Limitations

> We'd rather tell you upfront than have you discover these mid-demo. Calling these out is a more credible position in front of judges than overclaiming.

| Limitation | Status | Next step |
|---|---|---|
| 📡 **No live WhatsApp connection** | The Chats/Calls tabs are UI placeholders | Wire up Baileys / whatsapp-web.js |
| 👥 **No shared multi-user sync** | Data lives in one browser's localStorage | Move to real Supabase shared boards |
| 🔐 **No real authentication** | Login is a UI flow only | Add a backend identity provider |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TanStack Start, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **AI Classification** | Anthropic API (Claude), structured JSON output |
| **Backend / Edge** | Supabase Edge Functions |
| **Data** | Supabase (via Lovable Cloud) |
| **Hosting** | Lovable |

---

## 🚀 Getting Started

### Option A — Docker *(recommended, fastest path to "just see it")*

```bash
git clone <this-repo-url>
cd whatsplan
docker compose up --build
```

Then open **http://localhost:8080**.

---

### Option B — Local Node *(requires Node 20+)*

```bash
npm install
npm run dev
```

Dev server runs on **port 8080**.

---

### Environment Variables

```bash
cp .env.example .env
```

Fill in the values described in `.env.example`.

> **Important:** The `ANTHROPIC_API_KEY` powers the message classifier and must only ever be set as a **server-side secret** — via Lovable Cloud → Secrets, or your own backend env. Never commit it or place it in frontend code.

---

## 📁 Project Structure

```
whatsplan/
├── src/
│   ├── components/
│   │   ├── WhatsPlanApp.tsx      ← whole app shell (themes, boards, gamification, settings)
│   │   └── ui/                   ← shadcn/ui component kit
│   └── ...
├── supabase/
│   └── functions/                ← Edge Functions, including the AI classifier
├── docs/
│   └── WhatsPlan-PRD.md          ← full product requirements doc
├── .env.example
└── docker-compose.yml
```

---

## 🗺️ Roadmap

**1. Real WhatsApp listener**  
Wire up Baileys / whatsapp-web.js to feed the classifier live, replacing paste-and-classify.

**2. Shared boards across group members**  
Move off localStorage-only persistence so the whole group sees the same board in real time.

**3. Calendar export + reminders**  
Google Calendar sync and `.ics` export so extracted meetings land where people already look.

**4. Accessibility pass**  
Contrast audit across all 8 themes, density toggle for data-heavy boards, full keyboard nav.

> See [`docs/WhatsPlan-PRD.md`](docs/WhatsPlan-PRD.md) for the full reasoning behind these priorities.

---

<div align="center">

**WhatsPlan** · MIT License · Built with ☕ and Claude

*The group chat stays. The chaos doesn't.*

</div>
