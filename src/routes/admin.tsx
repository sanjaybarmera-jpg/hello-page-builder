import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Ratan Jewellers" },
      { name: "description", content: "Manage inventory, metal rates and orders." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Ratan Jewellers" },
      { property: "og:description", content: "Manage inventory, metal rates and orders." },
    ],
  }),
  component: () => <AdminShell />,
});
