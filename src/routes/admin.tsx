import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — NAKKASHI" },
      { name: "description", content: "Manage inventory, metal rates and orders." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — NAKKASHI" },
      { property: "og:description", content: "Manage inventory, metal rates and orders." },
    ],
  }),
  component: () => <Outlet />,
});
