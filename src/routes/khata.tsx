import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { inr } from "@/lib/jewellery";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/khata")({
  head: () => ({
    meta: [
      { title: "Track Order & Download Bill | Ratan Jewellers" },
      {
        name: "description",
        content:
          "Enter your phone number to view your Ratan Jewellers purchase history and download printable GST invoices.",
      },
      { property: "og:title", content: "Track Order & Download Bill — Ratan Jewellers" },
      {
        property: "og:description",
        content: "Look up your orders by phone number and print your GST invoice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KhataPage,
});

type OrderRow = {
  id: string | number;
  order_number?: string;
  created_at?: string;
  total_amount?: number;
  payment_status?: string;
  order_status?: string;
  item_count?: number;
};

function KhataPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(id)")
      .eq("customer_phone", phone.trim())
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setOrders(null);
    } else {
      setOrders(
        (data ?? []).map((o: Record<string, unknown>) => ({
          ...(o as OrderRow),
          item_count: Array.isArray(o["order_items"]) ? o["order_items"].length : 0,
        })),
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-serif text-4xl text-primary">Your Khata</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the phone number used at checkout to view purchases and print GST invoices.
        </p>

        <form onSubmit={lookup} className="mt-6 flex flex-wrap gap-3">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            inputMode="tel"
            className="max-w-xs"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Looking up…" : "Find my orders"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {orders && orders.length === 0 && (
          <p className="mt-10 text-sm text-muted-foreground">
            No orders found for this phone number.
          </p>
        )}

        <div className="mt-8 space-y-4">
          {(orders ?? []).map((o) => (
            <div
              key={String(o.id)}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div>
                <p className="font-serif text-xl text-primary">
                  {o.order_number ?? `Order #${o.id}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "—"} ·{" "}
                  {o.item_count} item{o.item_count === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                    {o.payment_status ?? "PENDING"}
                  </span>
                  {o.order_status && (
                    <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                      {o.order_status}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-semibold">{inr(Number(o.total_amount ?? 0))}</p>
                <Link
                  to="/order-confirmation/$orderId"
                  params={{ orderId: String(o.id) }}
                  className="mt-2 inline-block rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
                >
                  View / Print GST Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
