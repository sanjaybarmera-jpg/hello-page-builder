import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, RefreshCw, ShieldCheck, Star, Truck } from "lucide-react";

import { SiteHeader, catalogSearch } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { LuxuryProductCard } from "@/components/LuxuryProductCard";
import { useCategories, useMetalRates, useProducts } from "@/hooks/useJewelleryData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NAKKASHI — Fine Gold & Diamond Jewellery" },
      {
        name: "description",
        content:
          "NAKKASHI: BIS hallmarked gold, certified diamond and silver jewellery priced live against today's metal rates, with instant digital GST invoices.",
      },
      { property: "og:title", content: "NAKKASHI — Fine Gold & Diamond Jewellery" },
      {
        property: "og:description",
        content:
          "Live-rate pricing, BIS hallmarked gold, certified diamonds and instant digital GST invoicing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PILLARS = [
  { icon: ShieldCheck, title: "BIS Hallmarked", note: "Every gram certified for purity" },
  { icon: BadgeCheck, title: "100% Certified", note: "IGI / GIA graded diamonds" },
  { icon: Truck, title: "Secure Delivery", note: "Fully insured, doorstep despatch" },
  { icon: RefreshCw, title: "Lifetime Exchange", note: "Transparent buyback on gold" },
];

const TESTIMONIALS = [
  {
    name: "Ananya & Rohit",
    city: "Bandra, Mumbai",
    story:
      "Our entire bridal set was crafted in eight weeks. The live-rate pricing meant zero surprises on the final bill.",
  },
  {
    name: "Meera Shah",
    city: "Surat",
    story:
      "The 22K temple necklace is exactly like the sketch I brought in. Hallmark and invoice reached me the same evening.",
  },
  {
    name: "Karthik Iyer",
    city: "Pune",
    story:
      "Exchanged an old chain and upgraded — the buyback rate was fair and everything was documented properly.",
  },
];

function Index() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const { data: rates } = useMetalRates();
  const metalRates = rates ?? [];
  const featured = (products ?? []).slice(0, 8);
  const goldRate = metalRates.find(
    (r) => r.metal?.toLowerCase() === "gold" && Number(r.karat) === 22,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="hero-ambient relative overflow-hidden border-b border-gold/30">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-background/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-primary backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-gold" />
                </span>
                {goldRate
                  ? `Live 22K Gold · ₹${Number(goldRate.rate_per_gram).toLocaleString("en-IN")}/g`
                  : "Live metal rates today"}
              </span>

              <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
                Jewellery made to be <span className="gold-text">remembered</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Handcrafted Silver at Direct Wholesale Rates — hallmarked purity, honest making
                charges and transparent pricing against today&apos;s live metal rates.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/catalog"
                  search={catalogSearch()}
                  className="gold-gradient rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide text-primary shadow-lg transition-opacity hover:opacity-90"
                >
                  Explore Royal Collections
                </Link>
                <Link
                  to="/catalog"
                  search={catalogSearch({ purity: "22" })}
                  className="rounded-full border border-primary/50 px-8 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  View 22K BIS Gold
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-gold/30 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg"
                >
                  <p.icon className="h-5 w-5 text-gold-antique" />
                  <p className="mt-3 font-serif text-lg tracking-wide text-primary">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-10">
          <SupabaseStatus />

          <section className="mt-10">
            <h2 className="font-serif text-3xl tracking-wide text-primary">Shop by category</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(categories ?? []).map((c) => (
                <Link
                  key={String(c.id)}
                  to="/catalog"
                  search={catalogSearch({ category: String(c.id) })}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg"
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      loading="lazy"
                      className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-40 w-full bg-secondary" />
                  )}
                  <p className="px-5 py-4 font-serif text-xl tracking-wide text-primary">{c.name}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-3xl tracking-wide text-primary">Featured jewellery</h2>
              <Link
                to="/catalog"
                search={catalogSearch()}
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-gold-antique"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <LuxuryProductCard key={String(p.id)} product={p} metalRates={metalRates} />
              ))}
            </div>
          </section>

          <section className="mt-16">
            <p className="text-center text-xs uppercase tracking-[0.4em] text-gold-antique">
              Purity • Craft • Honest Pricing
            </p>
            <h2 className="mt-3 text-center font-serif text-4xl tracking-wide text-primary">
              Stories from our patrons
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="rounded-3xl border border-gold/30 bg-card p-7 shadow-sm"
                >
                  <div className="flex gap-1 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    “{t.story}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <p className="font-serif text-lg text-primary">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold-antique">
                      <BadgeCheck className="h-3 w-3" /> Verified buyer
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-gold/30 bg-card p-8">
              <p className="text-xs uppercase tracking-[0.4em] text-gold-antique">Bespoke</p>
              <h3 className="mt-3 font-serif text-3xl tracking-wide text-primary">
                Bespoke &amp; custom jewellery
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Bring us a sketch or an heirloom — our karigars craft it in 22K hallmarked gold.
              </p>
              <Link
                to="/catalog"
                search={catalogSearch()}
                className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start your custom design
              </Link>
            </div>
            <div className="rounded-3xl border border-gold/30 bg-card p-8">
              <p className="text-xs uppercase tracking-[0.4em] text-gold-antique">Khata</p>
              <h3 className="mt-3 font-serif text-3xl tracking-wide text-primary">
                Already placed an order?
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Look up your purchase history and download your GST tax invoice instantly.
              </p>
              <Link
                to="/khata"
                className="mt-6 inline-block rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Lookup Your Bill &amp; Khata
              </Link>
            </div>
          </section>

          <section className="mt-16 overflow-hidden rounded-3xl border border-gold/30 bg-secondary/50 px-8 py-12 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gold-antique">Home Try-On</p>
            <h2 className="mt-3 font-serif text-4xl tracking-wide text-primary">
              Try it at home before you buy
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Pick your favourites and our trusted advisor brings them to your doorstep, insured
              and hallmarked. Book a try-on from any product page.
            </p>
            <Link
              to="/catalog"
              search={catalogSearch()}
              className="gold-gradient mt-7 inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-primary shadow-lg transition-opacity hover:opacity-90"
            >
              Book a Home Try-On
            </Link>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
