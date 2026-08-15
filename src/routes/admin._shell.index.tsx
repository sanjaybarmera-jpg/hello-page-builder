import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, ExternalLink, IndianRupee, Receipt, ScrollText, Weight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { inr } from "@/lib/jewellery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_shell/")({
  component: () => (
    <OwnerOnly>
      <AdminDashboard />
    </OwnerOnly>
  ),
});

type DashOrder = {
  id: string | number;
  order_number?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  status?: string | null;
  order_status?: string | null;
  metal_amount?: number | null;
  making_amount?: number | null;
  gst_amount?: number | null;
  total_amount?: number | null;
};

type DashItem = {
  id: string | number;
  order_id: string | number;
  net_weight?: number | null;
  making_charge?: number | null;
  quantity?: number | null;
};

type Period = "all" | "month" | "week";

const PERIODS: { value: Period; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" },
];

const num = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : Number(v) || 0);

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "week") {
    const d = new Date(now);
    const day = (d.getDay() + 6) % 7; // Monday start
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function useOrders() {
  return useQuery({
    queryKey: ["admin", "dashboard", "orders"],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<DashOrder[]> => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as DashOrder[];
    },
  });
}

function useOrderItems() {
  return useQuery({
    queryKey: ["admin", "dashboard", "order_items"],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<DashItem[]> => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase.from("order_items").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as DashItem[];
    },
  });
}

function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const ordersQuery = useOrders();
  const itemsQuery = useOrderItems();

  const orders = useMemo(() => {
    const start = periodStart(period);
    return (ordersQuery.data ?? []).filter((o) => {
      if (!start) return true;
      if (!o.created_at) return false;
      return new Date(o.created_at).getTime() >= start.getTime();
    });
  }, [ordersQuery.data, period]);

  const orderIds = useMemo(() => new Set(orders.map((o) => String(o.id))), [orders]);

  const items = useMemo(
    () => (itemsQuery.data ?? []).filter((i) => orderIds.has(String(i.order_id))),
    [itemsQuery.data, orderIds],
  );

  const metrics = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + num(o.total_amount), 0);
    const gst = orders.reduce((s, o) => s + num(o.gst_amount), 0);
    const grams = items.reduce((s, i) => s + num(i.net_weight) * (num(i.quantity) || 1), 0);
    const making = items.length
      ? items.reduce((s, i) => s + num(i.making_charge) * (num(i.quantity) || 1), 0)
      : orders.reduce((s, o) => s + num(o.making_amount), 0);
    const activeOrders = orders.filter(
      (o) => String(o.order_status ?? "").toUpperCase() !== "CANCELLED",
    ).length;
    return { revenue, gst, grams, making, activeOrders };
  }, [orders, items]);

  const trend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const o of orders) {
      if (!o.created_at) continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + num(o.total_amount));
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date: date.slice(5), revenue }));
  }, [orders]);

  const paymentSplit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      const key = String(o.status ?? "pending").toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [orders]);

  const statusSplit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      const key = String(o.order_status ?? "PROCESSING").toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [orders]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) =>
          String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
        )
        .slice(0, 5),
    [orders],
  );

  const cards = [
    { label: "Gross revenue", value: inr(metrics.revenue), icon: IndianRupee },
    { label: "Orders", value: String(metrics.activeOrders), icon: ScrollText },
    { label: "Net metal sold", value: `${metrics.grams.toFixed(2)} g`, icon: Weight },
    { label: "Making charges", value: inr(metrics.making), icon: Coins },
    { label: "GST collected", value: inr(metrics.gst), icon: Receipt },
  ];

  const donutColors = [
    "var(--color-primary)",
    "var(--color-accent-foreground)",
    "var(--color-muted-foreground)",
    "var(--color-secondary-foreground)",
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales performance and tax summary.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {ordersQuery.isError && (
        <p className="mt-6 text-sm text-destructive">Could not load orders.</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {c.label}
              </p>
              <c.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 font-serif text-2xl text-foreground">
              {ordersQuery.isLoading ? "…" : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-foreground">Revenue trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" width={60} />
                <Tooltip formatter={(v: number | string) => inr(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">Payment status</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {paymentSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Order status distribution</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusSplit}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis allowDecimals={false} fontSize={11} stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium text-foreground">Recent orders</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Order #</th>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Phone</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={String(o.id)} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{o.order_number ?? o.id}</td>
                <td className="px-5 py-3">{o.customer_name ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{o.customer_phone ?? "—"}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {inr(num(o.total_amount))}
                </td>
                <td className="px-5 py-3">
                  <Badge variant="secondary">
                    {String(o.order_status ?? "PROCESSING").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      to="/order-confirmation/$orderId"
                      params={{ orderId: String(o.id) }}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!ordersQuery.isLoading && recent.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  No orders in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
