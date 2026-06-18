import { createFileRoute } from "@tanstack/react-router";
import WhatsPlanApp from "@/components/WhatsPlanApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsPlan — Chat, plan, win the day" },
      { name: "description", content: "WhatsApp-native planning workspace with kanban, tables, roadmaps, calendars, checklists and notes. Themed eight ways, always WhatsApp green." },
      { property: "og:title", content: "WhatsPlan — Chat, plan, win the day" },
      { property: "og:description", content: "Plan beside your conversations. Kanban, tables, roadmaps and more, themed in WhatsApp green." },
    ],
  }),
  component: WhatsPlanApp,
});
