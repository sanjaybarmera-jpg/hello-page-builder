import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCategories, useMetalRates } from "@/hooks/useJewelleryData";
import { calculateJewelleryPrice, inr, type Product } from "@/lib/jewellery";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Jewellery Detail — Ratan Jewellers" },
      {
        name: "description",
        content:
          "Live gold-rate pricing, transparent price breakup, purity and size options on every Ratan Jewellers piece.",
      },
      { property: "og:title", content: "Jewellery Detail — Ratan Jewellers" },
      {
        property: "og:description",
        content: "Transparent, live-rate jewellery pricing with full price breakup.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProductDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center" role="alert">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center text-muted-foreground">
      This piece is no longer available.
    </div>
  ),
});

const SIZES = Array.from({ length: 13 }, (_, i) => String(i + 10));

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const { data: rates = [] } = useMetalRates();
  const { data: categories = [] } = useCategories();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Product | null;
    },
  });

  const [karat, setKarat] = useState<number | null>(null);
  const [size, setSize] = useState<string>("14");
  const [zoom, setZoom] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visit, setVisit] = useState({ name: "", phone: "", date: "" });

  const selectedKarat = karat ?? product?.karat ?? null;
  const isSilver = (product?.metal ?? "gold").toLowerCase() === "silver";

  const price = useMemo(() => {
    if (!product) return null;
    return calculateJewelleryPrice({ ...product, karat: isSilver ? null : selectedKarat }, rates);
  }, [product, rates, selectedKarat, isSilver]);

  if (isLoading) {
    return <p className="mx-auto max-w-6xl px-6 py-24 text-muted-foreground">Loading piece…</p>;
  }
  if (!product) {
    return (
      <p className="mx-auto max-w-6xl px-6 py-24 text-muted-foreground">
        This piece is no longer available.
      </p>
    );
  }

  const category = categories.find((c) => String(c.id) === String(product.category_id));

  const addToCart = () => {
    if (!price) return;
    cart.add({
      productId: String(product.id),
      name: product.name,
      sku: product.sku,
      image_url: product.image_url ?? null,
      metal: product.metal,
      karat: isSilver ? null : selectedKarat,
      size,
      net_weight: Number(product.net_weight),
      price: price.finalPrice,
      metalPrice: price.metalPrice,
      makingCharge: price.makingCharge,
      gst: price.gst,
      ratePerGram: price.ratePerGram,
    });
    toast.success(`${product.name} added to cart`);
  };

  const buyNow = () => {
    addToCart();
    navigate({ to: "/checkout" });
  };

  const submitVisit = async (e: FormEvent) => {
    e.preventDefault();
    if (!visit.name.trim() || !visit.phone.trim() || !visit.date) {
      toast.error("Please fill in your name, phone and preferred date.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(visit.phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (supabase) {
      const { error: visitError } = await supabase.from("home_tryon_requests").insert({
        customer_name: visit.name.trim(),
        phone: visit.phone.trim(),
        preferred_date: visit.date,
        product_id: String(product.id),
        product_title: product.name,
        product_sku: product.sku,
        status: "PENDING",
      });
      if (visitError) {
        toast.error(visitError.message);
        return;
      }
    }
    setVisitOpen(false);
    setVisit({ name: "", phone: "", date: "" });
    toast.success("Visit requested — our showroom team will call you shortly.");
  };

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-foreground hover:border-primary/50"
    }`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{category?.name ?? "Jewellery"}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <div
            className="overflow-hidden rounded-2xl border border-border bg-secondary"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className={`aspect-square w-full object-cover transition-transform duration-500 ${
                  zoom ? "scale-125" : "scale-100"
                }`}
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center font-serif text-6xl text-primary/25">
                {product.name?.charAt(0)}
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Hover image to zoom</p>
        </div>

        <div>
          <h1 className="font-serif text-4xl leading-tight text-primary">{product.name}</h1>
          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <p className="mt-6 text-3xl font-semibold text-foreground">{inr(price?.finalPrice ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of 3% GST · live metal rate</p>

          {!isSilver && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Gold purity</p>
              <div className="mt-3 flex gap-2">
                {[18, 22, 24].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKarat(k)}
                    className={pill(Number(selectedKarat) === k)}
                  >
                    {k}K
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Size</p>
              <Dialog>
                <DialogTrigger className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  Find your ring size guide
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ring size guide</DialogTitle>
                    <DialogDescription>
                      Measure the inner diameter of a ring that fits you well.
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Size 10 — 14.9 mm inner diameter</li>
                    <li>Size 14 — 16.2 mm inner diameter</li>
                    <li>Size 18 — 17.5 mm inner diameter</li>
                    <li>Size 22 — 18.8 mm inner diameter</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Still unsure? Book a showroom visit for a free sizing.
                  </p>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => setSize(s)} className={pill(size === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground">
              <BadgeCheck className="h-3.5 w-3.5" /> BIS Hallmarked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Lifetime exchange
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
              Gross {product.gross_weight ?? product.net_weight}g
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
              Net {product.net_weight}g
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
              SKU {product.sku}
            </span>
          </div>

          <Accordion type="single" collapsible defaultValue="breakup" className="mt-8">
            <AccordionItem value="breakup">
              <AccordionTrigger className="text-sm font-medium">Price breakup</AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2 text-sm">
                  <Row
                    label={`${isSilver ? "Silver" : `Gold ${selectedKarat ?? ""}K`} · ${product.net_weight}g × ${inr(price?.ratePerGram ?? 0)}/g`}
                    value={inr(price?.metalPrice ?? 0)}
                  />
                  <Row
                    label={
                      product.making_charge_flat
                        ? "Making charges (flat)"
                        : `Making charges (${product.making_charge_percent ?? 0}%)`
                    }
                    value={inr(price?.makingCharge ?? 0)}
                  />
                  <Row label="Subtotal" value={inr(price?.subtotal ?? 0)} />
                  <Row label="GST (3%)" value={inr(price?.gst ?? 0)} />
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                    <span>Grand total</span>
                    <span>{inr(price?.finalPrice ?? 0)}</span>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={addToCart}>Add to cart</Button>
            <Button variant="secondary" onClick={buyNow}>
              Buy now
            </Button>
            <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" /> Book home try-on
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book a try-on or showroom visit</DialogTitle>
                  <DialogDescription>
                    Share your details and we'll confirm your appointment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitVisit} className="space-y-4">
                  <div>
                    <Label htmlFor="visit-name">Full name</Label>
                    <Input
                      id="visit-name"
                      className="mt-1.5"
                      maxLength={100}
                      value={visit.name}
                      onChange={(e) => setVisit((v) => ({ ...v, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="visit-phone">Phone number</Label>
                    <Input
                      id="visit-phone"
                      className="mt-1.5"
                      maxLength={15}
                      value={visit.phone}
                      onChange={(e) => setVisit((v) => ({ ...v, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="visit-date">Preferred date</Label>
                    <Input
                      id="visit-date"
                      type="date"
                      className="mt-1.5"
                      value={visit.date}
                      onChange={(e) => setVisit((v) => ({ ...v, date: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Request visit</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
