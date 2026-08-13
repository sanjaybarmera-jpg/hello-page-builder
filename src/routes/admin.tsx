import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Ratan Jewellers" },
      { name: "description", content: "Manage inventory, metal rates and orders." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Ratan Jewellers" },
      { property: "og:description", content: "Manage inventory, metal rates and orders." },
    ],
  }),
  component: () => <Outlet />,
});
