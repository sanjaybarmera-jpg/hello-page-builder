import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer, MessageCircle, Send, Link2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/jewellery";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  copyToClipboard,
  generateSmsShareUrl,
  generateWhatsAppShareUrl,
  getInvoiceUrl,
} from "@/lib/shareUtils";

export const Route = createFileRoute("/order-confirmation/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Confirmation & GST Invoice — Ratan Jewellers" },
      {
        name: "description",
        content:
          "Your Ratan Jewellers order confirmation with a printable GST tax invoice showing metal value, making charges, CGST and SGST.",
      },
      { property: "og:title", content: "Order Confirmation — Ratan Jewellers" },
      {
        property: "og:description",
        content: "Printable GST tax invoice for your Ratan Jewellers order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

type OrderRow = {
  id: string | number;
  order_number: string;
  created_at?: string | null;
  payment_mode?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  pincode?: string | null;
  metal_amount?: number | null;
  making_amount?: number | null;
  gst_amount?: number | null;
  total_amount?: number | null;
};

type OrderItemRow = {
  id: string | number;
  title?: string | null;
  sku?: string | null;
  metal?: string | null;
  karat?: number | null;
  size?: string | null;
  net_weight?: number | null;
  rate_per_gram?: number | null;
  making_charge?: number | null;
  quantity?: number | null;
  line_total?: number | null;
};

function OrderConfirmation() {
  const { orderId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (oErr) throw new Error(oErr.message);
      const { data: items, error: iErr } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (iErr) throw new Error(iErr.message);
      return { order: order as unknown as OrderRow, items: (items ?? []) as unknown as OrderItemRow[] };
    },
  });

  if (isLoading) {
    return <p className="mx-auto max-w-4xl px-6 py-24 text-muted-foreground">Loading invoice…</p>;
  }
  if (error || !data) {
    return (
      <p className="mx-auto max-w-4xl px-6 py-24 text-muted-foreground">
        We couldn&apos;t find this order. {error instanceof Error ? error.message : ""}
      </p>
    );
  }

  const { order, items } = data;
  const taxable = Number(order.metal_amount ?? 0) + Number(order.making_amount ?? 0);
  const gst = Number(order.gst_amount ?? 0);
  const half = gst / 2;
  const netWeight = items.reduce(
    (sum, it) => sum + Number(it.net_weight ?? 0) * Number(it.quantity ?? 1),
    0,
  );
  const invoiceUrl = getInvoiceUrl(order.id);
  const shareOpts = { netWeight };
  const date = order.created_at ? new Date(order.created_at) : new Date();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <SiteHeader showCategories={false} />
      </div>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="font-serif text-3xl text-primary">Thank you for your order</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order {order.order_number} placed successfully.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/">Continue shopping</Link>
            </Button>
            <Button className="rounded-full" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print / Download PDF
            </Button>
            <Button
              className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5b]"
              onClick={() =>
                window.open(
                  generateWhatsAppShareUrl(order, invoiceUrl, shareOpts),
                  "_blank",
                  "noopener",
                )
              }
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Share via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                window.location.href = generateSmsShareUrl(order, invoiceUrl, shareOpts);
              }}
            >
              <Send className="mr-2 h-4 w-4" /> Share via SMS
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                const ok = await copyToClipboard(invoiceUrl);
                if (ok) toast.success("Invoice link copied!");
                else toast.error("Could not copy the link");
              }}
            >
              <Link2 className="mr-2 h-4 w-4" /> Copy Invoice Link
            </Button>
          </div>
        </div>

        <article className="mt-8 rounded-2xl border border-border bg-card p-8 print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-wrap justify-between gap-6 border-b border-border pb-6">
            <div>
              <p className="font-serif text-2xl text-primary">Ratan Jewellers</p>
              <p className="mt-1 text-xs text-muted-foreground">
                12 Zaveri Bazaar Road, Mumbai 400002
                <br />
                GSTIN: 27AAAAA0000A1Z5 · State: Maharashtra (27)
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Tax Invoice
              </p>
              <p className="mt-1">Invoice No: {order.order_number}</p>
              <p>Date: {date.toLocaleDateString("en-IN")}</p>
              <p>Payment: {order.payment_mode === "online" ? "UPI / Card" : "Cash / Pay at Store"}</p>
            </div>
          </header>

          <section className="border-b border-border py-5 text-xs text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Billed to</p>
            <p className="mt-1">{order.customer_name}</p>
            <p>{order.shipping_address}</p>
            <p>
              Pincode {order.pincode} · {order.customer_phone}
              {order.customer_email ? ` · ${order.customer_email}` : ""}
            </p>
          </section>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <Th>Description</Th>
                  <Th>HSN</Th>
                  <Th className="text-right">Net Wt (g)</Th>
                  <Th>Purity</Th>
                  <Th className="text-right">Rate/g</Th>
                  <Th className="text-right">Making</Th>
                  <Th className="text-right">Taxable</Th>
                  <Th className="text-right">CGST 1.5%</Th>
                  <Th className="text-right">SGST 1.5%</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const line = Number(it.line_total ?? 0);
                  const lineTaxable = line / 1.03;
                  const lineHalf = (line - lineTaxable) / 2;
                  return (
                    <tr key={String(it.id)} className="border-b border-border/60">
                      <Td>
                        {it.title}
                        <span className="block text-[10px] text-muted-foreground">
                          SKU {it.sku} · Qty {it.quantity}
                          {it.size ? ` · Size ${it.size}` : ""}
                        </span>
                      </Td>
                      <Td>{String(it.metal).toLowerCase() === "silver" ? "7113" : "7113"}</Td>
                      <Td className="text-right">{Number(it.net_weight ?? 0)}</Td>
                      <Td>{it.karat ? `${it.karat}K` : "925 Silver"}</Td>
                      <Td className="text-right">{inr(Number(it.rate_per_gram ?? 0))}</Td>
                      <Td className="text-right">{inr(Number(it.making_charge ?? 0))}</Td>
                      <Td className="text-right">{inr(lineTaxable)}</Td>
                      <Td className="text-right">{inr(lineHalf)}</Td>
                      <Td className="text-right">{inr(lineHalf)}</Td>
                      <Td className="text-right font-medium">{inr(line)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-xs space-y-1.5 text-sm">
              <Row label="Metal value" value={inr(Number(order.metal_amount ?? 0))} />
              <Row label="Making charges" value={inr(Number(order.making_amount ?? 0))} />
              <Row label="Taxable amount" value={inr(taxable)} />
              <Row label="CGST (1.5%)" value={inr(half)} />
              <Row label="SGST (1.5%)" value={inr(half)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
                <span>Grand total</span>
                <span>{inr(Number(order.total_amount ?? 0))}</span>
              </div>
            </dl>
          </div>

          <p className="mt-8 border-t border-border pt-4 text-[10px] text-muted-foreground">
            This is a computer-generated invoice. Gold rates applied are those prevailing at the
            time of order. All jewellery is BIS hallmarked.
          </p>
        </article>
      </div>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-2 pr-2 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 pr-2 align-top ${className}`}>{children}</td>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
