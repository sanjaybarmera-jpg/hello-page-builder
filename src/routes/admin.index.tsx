import { createFileRoute } from "@tanstack/react-router";
import { useMetalRates, useProducts } from "@/hooks/useJewelleryData";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const products = useProducts();
  const rates = useMetalRates();

  const cards = [
    { label: "Products", value: products.data?.length ?? 0 },
    { label: "Metal rates tracked", value: rates.data?.length ?? 0 },
    { label: "Orders", value: 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of your store.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
