import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Orders</h1>
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No orders yet.
      </div>
    </div>
  );
}
