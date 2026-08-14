import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, MessageCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/jewellery";
import { generateWhatsAppShareUrl, getInvoiceUrl } from "@/lib/shareUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/_shell/orders")({
  component: OrdersPage,
});

export const ORDER_STATUSES = [
  "PROCESSING",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

type AdminOrder = {
  id: string | number;
  order_number: string;
  created_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  shipping_address?: string | null;
  pincode?: string | null;
  payment_mode?: string | null;
  status?: string | null;
  order_status?: string | null;
  metal_amount?: number | null;
  making_amount?: number | null;
  gst_amount?: number | null;
  total_amount?: number | null;
};

type AdminOrderItem = {
  id: string | number;
  title?: string | null;
  sku?: string | null;
  karat?: number | null;
  metal?: string | null;
  size?: string | null;
  net_weight?: number | null;
  rate_per_gram?: number | null;
  making_charge?: number | null;
  quantity?: number | null;
  line_total?: number | null;
};

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin_orders"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AdminOrder[];
    },
  });
}

function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useAdminOrders();
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error: err } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", id);
      if (err) throw new Error(err.message);
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const items = useQuery({
    queryKey: ["admin_order_items", selected?.id],
    enabled: Boolean(supabase && selected),
    queryFn: async () => {
      if (!supabase || !selected) return [];
      const { data, error: err } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selected.id);
      if (err) throw new Error(err.message);
      return (data ?? []) as unknown as AdminOrderItem[];
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} order(s), newest first.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load orders."}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Loading orders…
                </td>
              </tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={String(o.id)} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{o.order_number}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-4 py-3">
                  {o.customer_name}
                  <span className="block text-xs text-muted-foreground">{o.customer_phone}</span>
                </td>
                <td className="px-4 py-3 text-right">{inr(Number(o.total_amount ?? 0))}</td>
                <td className="px-4 py-3">
                  <Badge variant={o.payment_mode === "online" ? "default" : "secondary"}>
                    {o.payment_mode === "online" ? "UPI / Card" : "Pay at Store"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={(o.order_status ?? "PROCESSING").toUpperCase()}
                    onValueChange={(status) => updateStatus.mutate({ id: o.id, status })}
                  >
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
                      View details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                      title="WhatsApp customer"
                      onClick={() => {
                        if (!o.customer_phone) {
                          toast.error("No phone number on this order");
                          return;
                        }
                        window.open(
                          generateWhatsAppShareUrl(o, getInvoiceUrl(o.id)),
                          "_blank",
                          "noopener",
                        );
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Order {selected?.order_number}
            </DialogTitle>
            <DialogDescription>
              {selected?.customer_name} · {selected?.customer_phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-border p-3 text-muted-foreground">
              <p className="text-xs uppercase tracking-wide">Shipping address</p>
              <p className="mt-1 text-foreground">{selected?.shipping_address}</p>
              <p>Pincode {selected?.pincode}</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Purity</th>
                    <th className="px-3 py-2 text-right">Net wt</th>
                    <th className="px-3 py-2 text-right">Rate/g</th>
                    <th className="px-3 py-2 text-right">Making</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(items.data ?? []).map((it) => (
                    <tr key={String(it.id)} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2">
                        {it.title}
                        <span className="block text-[10px] text-muted-foreground">
                          SKU {it.sku} · Qty {it.quantity}
                          {it.size ? ` · Size ${it.size}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2">{it.karat ? `${it.karat}K` : "925 Silver"}</td>
                      <td className="px-3 py-2 text-right">{Number(it.net_weight ?? 0)}g</td>
                      <td className="px-3 py-2 text-right">{inr(Number(it.rate_per_gram ?? 0))}</td>
                      <td className="px-3 py-2 text-right">{inr(Number(it.making_charge ?? 0))}</td>
                      <td className="px-3 py-2 text-right">{inr(Number(it.line_total ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-muted-foreground">
              <Row label="Metal value" value={inr(Number(selected?.metal_amount ?? 0))} />
              <Row label="Making charges" value={inr(Number(selected?.making_amount ?? 0))} />
              <Row label="GST (3%)" value={inr(Number(selected?.gst_amount ?? 0))} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
                <span>Grand total</span>
                <span>{inr(Number(selected?.total_amount ?? 0))}</span>
              </div>
            </div>

            {selected && (
              <Button
                className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                onClick={() => {
                  if (!selected.customer_phone) {
                    toast.error("No phone number on this order");
                    return;
                  }
                  const netWeight = (items.data ?? []).reduce(
                    (sum, it) =>
                      sum + Number(it.net_weight ?? 0) * Number(it.quantity ?? 1),
                    0,
                  );
                  window.open(
                    generateWhatsAppShareUrl(selected, getInvoiceUrl(selected.id), {
                      netWeight,
                    }),
                    "_blank",
                    "noopener",
                  );
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Customer
              </Button>
            )}

            {selected && (
              <Button asChild variant="outline" className="w-full">
                <Link
                  to="/order-confirmation/$orderId"
                  params={{ orderId: String(selected.id) }}
                  target="_blank"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open GST invoice
                </Link>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
