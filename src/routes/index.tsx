import { createFileRoute } from "@tanstack/react-router";
import WhatsPlanApp from "../components/WhatsPlanApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsPlan Business" },
      { name: "description", content: "WhatsPlan Business — chat, calls, kanban, and productivity in one place." },
      { property: "og:title", content: "WhatsPlan Business" },
      { property: "og:description", content: "WhatsPlan Business — chat, calls, kanban, and productivity in one place." },
    ],
  }),
  component: Index,
});

function Index() {
  return <WhatsPlanApp />;
}
