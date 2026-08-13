import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/jewellery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Ratan Jewellers" },
      {
        name: "description",
        content:
          "Securely complete your Ratan Jewellers order with transparent gold pricing, making charges and GST.",
      },
      { property: "og:title", content: "Checkout — Ratan Jewellers" },
      {
        property: "og:description",
        content: "Complete your jewellery order with transparent, live gold-rate pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

type Payment = "cash" | "online";

function orderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RJ-${new Date().getFullYear()}-${rand}`;
}

function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<Payment>("cash");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const metal = cart.items.reduce((n, i) => n + (i.metalPrice ?? 0) * i.qty, 0);
  const making = cart.items.reduce((n, i) => n + (i.makingCharge ?? 0) * i.qty, 0);
  const gst = cart.items.reduce((n, i) => n + (i.gst ?? 0) * i.qty, 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }
    if (cart.items.length === 0) {
      toast.error("Your bag is empty.");
      return;
    }
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim() || !form.pincode.trim()) {
      toast.error("Please fill in name, phone, address and pincode.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .upsert(
          {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            pincode: form.pincode.trim(),
          },
          { onConflict: "phone" },
        )
        .select()
        .single();
      if (custErr) throw custErr;

      const number = orderNumber();
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          order_number: number,
          customer_id: customer?.id ?? null,
          customer_name: form.full_name.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim() || null,
          shipping_address: form.address.trim(),
          pincode: form.pincode.trim(),
          payment_mode: payment,
          status: "pending",
          metal_amount: metal,
          making_amount: making,
          gst_amount: gst,
          total_amount: cart.total,
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        cart.items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          title: i.name,
          sku: i.sku,
          metal: i.metal,
          karat: i.karat,
          size: i.size ?? null,
          net_weight: i.net_weight,
          rate_per_gram: i.ratePerGram ?? null,
          making_charge: i.makingCharge ?? 0,
          quantity: i.qty,
          unit_price: i.price,
          line_total: i.price * i.qty,
        })),
      );
      if (itemsErr) throw itemsErr;

      cart.clear();
      toast.success(`Order ${number} placed`);
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: String(order.id) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          ← Continue shopping
        </Link>
        <h1 className="mt-4 font-serif text-4xl text-primary">Checkout</h1>

        <div className="mt-8 grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="full_name" label="Full name" value={form.full_name} onChange={set("full_name")} />
              <Field id="phone" label="Phone number" value={form.phone} onChange={set("phone")} />
            </div>
            <Field id="email" label="Email" type="email" value={form.email} onChange={set("email")} />
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} value={form.address} onChange={set("address")} className="mt-1.5" />
            </div>
            <div className="sm:w-48">
              <Field id="pincode" label="Pincode" value={form.pincode} onChange={set("pincode")} />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Payment mode</legend>
              {(
                [
                  ["cash", "Cash / Pay at Store"],
                  ["online", "UPI / Card Payment"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                    payment === value ? "border-primary bg-secondary" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={payment === value}
                    onChange={() => setPayment(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <Button type="submit" disabled={saving} className="w-full rounded-full">
              {saving ? "Placing order…" : `Place order · ${inr(cart.total)}`}
            </Button>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <p className="font-serif text-xl text-primary">Order summary</p>
            <ul className="mt-4 space-y-3 text-sm">
              {cart.items.map((i) => (
                <li key={i.key} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {i.name} × {i.qty}
                    <span className="block text-xs">
                      {i.karat ? `${i.karat}K` : i.metal} · {i.net_weight}g
                      {i.size ? ` · Size ${i.size}` : ""}
                    </span>
                  </span>
                  <span>{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Metal value</span><span className="text-foreground">{inr(metal)}</span></div>
              <div className="flex justify-between"><span>Making charges</span><span className="text-foreground">{inr(making)}</span></div>
              <div className="flex justify-between"><span>GST (3%)</span><span className="text-foreground">{inr(gst)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
                <span>Total</span><span>{inr(cart.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} className="mt-1.5" />
    </div>
  );
}
