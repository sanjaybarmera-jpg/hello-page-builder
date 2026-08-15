import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, Pencil, UserPlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/jewellery";
import { downloadCsv, toCsv } from "@/lib/csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/_shell/customers")({
  component: CustomersPage,
});

type CustomerRow = {
  id: string | number;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type OrderRow = {
  id: string | number;
  order_number: string;
  created_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  payment_mode?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  total_amount?: number | null;
};

type OrderItemRow = {
  order_id: string | number;
  net_weight?: number | null;
  quantity?: number | null;
};

type Aggregated = {
  key: string;
  customerId: string | number | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  orderCount: number;
  ltv: number;
  grams: number;
  lastOrder: string | null;
  orders: OrderRow[];
};

const normPhone = (value: string | null | undefined) =>
  (value ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

function useCustomerData() {
  const customers = useQuery({
    queryKey: ["admin_customers"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase.from("customers").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as CustomerRow[];
    },
  });

  const orders = useQuery({
    queryKey: ["admin_customer_orders"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const items = useQuery({
    queryKey: ["admin_customer_order_items"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, net_weight, quantity");
      if (error) return [];
      return (data ?? []) as unknown as OrderItemRow[];
    },
  });

  return { customers, orders, items };
}

function CustomersPage() {
  const queryClient = useQueryClient();
  const { customers, orders, items } = useCustomerData();
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<Aggregated | null>(null);
  const [editing, setEditing] = useState<Aggregated | null>(null);
  const [adding, setAdding] = useState(false);

  const gramsByOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items.data ?? []) {
      const key = String(it.order_id);
      const grams = Number(it.net_weight ?? 0) * Number(it.quantity ?? 1);
      map.set(key, (map.get(key) ?? 0) + (Number.isFinite(grams) ? grams : 0));
    }
    return map;
  }, [items.data]);

  const rows: Aggregated[] = useMemo(() => {
    const map = new Map<string, Aggregated>();

    const ensure = (key: string): Aggregated => {
      const existing = map.get(key);
      if (existing) return existing;
      const created: Aggregated = {
        key,
        customerId: null,
        name: "",
        phone: key,
        email: "",
        address: "",
        orderCount: 0,
        ltv: 0,
        grams: 0,
        lastOrder: null,
        orders: [],
      };
      map.set(key, created);
      return created;
    };

    for (const c of customers.data ?? []) {
      const key = normPhone(c.phone) || `id:${String(c.id)}`;
      const row = ensure(key);
      row.customerId = c.id;
      row.name = c.name ?? row.name;
      row.phone = c.phone ?? row.phone;
      row.email = c.email ?? "";
      row.address = c.address ?? "";
    }

    for (const o of orders.data ?? []) {
      const key = normPhone(o.customer_phone) || `order:${String(o.id)}`;
      const row = ensure(key);
      if (!row.name) row.name = o.customer_name ?? "Walk-in customer";
      if (!row.phone || row.phone === key) row.phone = o.customer_phone ?? row.phone;
      if (!row.email) row.email = o.customer_email ?? "";
      if (!row.address) row.address = o.shipping_address ?? "";
      const cancelled = (o.order_status ?? "").toUpperCase() === "CANCELLED";
      row.orders.push(o);
      row.orderCount += 1;
      if (!cancelled) {
        row.ltv += Number(o.total_amount ?? 0);
        row.grams += gramsByOrder.get(String(o.id)) ?? 0;
      }
      if (o.created_at && (!row.lastOrder || o.created_at > row.lastOrder)) {
        row.lastOrder = o.created_at;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.ltv - a.ltv);
  }, [customers.data, orders.data, gramsByOrder]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || normPhone(r.phone).includes(normPhone(q) || q),
    );
  }, [rows, search]);

  const saveCustomer = useMutation({
    mutationFn: async (payload: {
      id?: string | number | null;
      name: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!supabase) throw new Error("Supabase is not configured");
      if (payload.id) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: payload.name,
            phone: payload.phone,
            email: payload.email || null,
            address: payload.address || null,
          })
          .eq("id", payload.id);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase.from("customers").insert({
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
        address: payload.address || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Customer saved");
      setEditing(null);
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["admin_customers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save customer"),
  });

  const exportCsv = () => {
    const csv = toCsv([
      ["Customer_Name", "Phone", "Email", "Total_Spend", "Last_Order_Date"],
      ...filtered.map((r) => [
        r.name,
        r.phone,
        r.email,
        r.ltv.toFixed(2),
        r.lastOrder ? new Date(r.lastOrder).toLocaleDateString("en-IN") : "",
      ]),
    ]);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`ratan_jewellers_customers_${date}.csv`, csv);
    toast.success("Customers exported");
  };

  const loading = customers.isLoading || orders.isLoading;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Customers &amp; Khata</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} customer(s) · lifetime value and metal acquired.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export Customers
          </Button>
          <Button onClick={() => setAdding(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="mt-6 max-w-sm">
        <Input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {orders.error && (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {orders.error instanceof Error ? orders.error.message : "Could not load orders."}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Lifetime Value</th>
              <th className="px-4 py-3 text-right">Metal (g)</th>
              <th className="px-4 py-3">Last Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Loading customers…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.key} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium">{r.name || "Unnamed"}</span>
                  <span className="block text-xs text-muted-foreground">{r.phone || "—"}</span>
                </td>
                <td className="px-4 py-3 text-right">{r.orderCount}</td>
                <td className="px-4 py-3 text-right font-medium">{inr(r.ltv)}</td>
                <td className="px-4 py-3 text-right">{r.grams.toFixed(2)}g</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.lastOrder ? new Date(r.lastOrder).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProfile(r)}>
                      View Khata Profile
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Khata profile */}
      <Dialog open={Boolean(profile)} onOpenChange={(open) => !open && setProfile(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{profile?.name || "Customer"}</DialogTitle>
            <DialogDescription>Khata ledger &amp; purchase history</DialogDescription>
          </DialogHeader>
          {profile && (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Phone</p>
                  <p>{profile.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p>{profile.email || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Address</p>
                  <p>{profile.address || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Lifetime spend</p>
                  <p className="font-medium">{inr(profile.ltv)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total metal acquired</p>
                  <p className="font-medium">{profile.grams.toFixed(2)} g</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Order history ({profile.orders.length})</p>
                {profile.orders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
                )}
                {profile.orders.map((o) => (
                  <div
                    key={String(o.id)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString("en-IN")
                          : "—"}
                      </p>
                    </div>
                    <Badge variant={o.payment_mode === "online" ? "default" : "secondary"}>
                      {(o.payment_status ?? o.payment_mode ?? "PENDING").toString().toUpperCase()}
                    </Badge>
                    <p className="font-medium">{inr(Number(o.total_amount ?? 0))}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/order-confirmation/$orderId"
                        params={{ orderId: String(o.id) }}
                        target="_blank"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> View / Print GST Invoice
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit customer */}
      <CustomerFormDialog
        open={adding || Boolean(editing)}
        initial={editing}
        saving={saveCustomer.isPending}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSubmit={(values) =>
          saveCustomer.mutate({ id: editing?.customerId ?? null, ...values })
        }
      />
    </div>
  );
}

function CustomerFormDialog({
  open,
  initial,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: Aggregated | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; phone: string; email: string; address: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update contact details." : "Register a walk-in client."}
          </DialogDescription>
        </DialogHeader>
        <form
          key={initial?.key ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            const phone = String(fd.get("phone") ?? "").trim();
            if (!name || !phone) {
              toast.error("Name and phone are required");
              return;
            }
            onSubmit({
              name,
              phone,
              email: String(fd.get("email") ?? "").trim(),
              address: String(fd.get("address") ?? "").trim(),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={initial?.name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={3} defaultValue={initial?.address ?? ""} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
