import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, FileText, Gem, ShieldCheck } from "lucide-react";

import { SiteHeader, catalogSearch } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { useCategories, useMetalRates, useProducts } from "@/hooks/useJewelleryData";
import { calculateJewelleryPrice, inr, purityLabel } from "@/lib/jewellery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ratan Jewellers — Fine Gold & Diamond Jewellery" },
      {
        name: "description",
        content:
          "Ratan Jewellers: BIS hallmarked gold, certified diamond and silver jewellery priced live against today's metal rates, with instant digital GST invoices.",
      },
      { property: "og:title", content: "Ratan Jewellers — Fine Gold & Diamond Jewellery" },
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
  { icon: ShieldCheck, title: "100% BIS Hallmarked", note: "Every gram certified for purity" },
  { icon: BadgeCheck, title: "Certified Quality", note: "IGI / GIA graded diamonds" },
  { icon: Gem, title: "Transparent Live Pricing", note: "Metal value + making, no hidden mark-up" },
  { icon: FileText, title: "Instant GST Invoicing", note: "Digital tax invoice on every order" },
];

function Index() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const { data: rates } = useMetalRates();
  const metalRates = rates ?? [];
  const featured = (products ?? []).slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-accent-foreground">
                The Heritage Edit
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-primary sm:text-6xl">
                Jewellery made to be remembered
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Hallmarked gold, certified diamonds and hand-finished silver — crafted in our own
                workshops since 1954 and priced transparently against today&apos;s rates.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/catalog"
                  search={catalogSearch()}
                  className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Explore collections
                </Link>
                <Link
                  to="/khata"
                  className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Track order / bill
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-serif text-lg text-primary">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-10">
          <SupabaseStatus />

          <section className="mt-10">
            <h2 className="font-serif text-3xl text-primary">Shop by category</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(categories ?? []).map((c) => (
                <Link
                  key={String(c.id)}
                  to="/catalog"
                  search={catalogSearch({ category: String(c.id) })}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
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
                  <p className="px-5 py-4 font-serif text-xl text-primary">{c.name}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-3xl text-primary">Featured jewellery</h2>
              <Link
                to="/catalog"
                search={catalogSearch()}
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => {
                const price = calculateJewelleryPrice(p, metalRates);
                return (
                  <Link
                    key={String(p.id)}
                    to="/product/$id"
                    params={{ id: String(p.id) }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-56 w-full bg-secondary" />
                    )}
                    <div className="p-5">
                      <p className="font-serif text-xl text-primary">{p.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-secondary px-3 py-1">
                          {purityLabel(p)}
                        </span>
                        <span className="rounded-full bg-secondary px-3 py-1">
                          {Number(p.net_weight ?? 0)}g
                        </span>
                        <span className="rounded-full bg-secondary px-3 py-1">{p.sku}</span>
                      </div>
                      <p className="mt-3 text-lg font-semibold">{inr(price.finalPrice)}</p>
                      <p className="text-[11px] text-muted-foreground">Incl. 3% GST</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-16 overflow-hidden rounded-3xl border border-border bg-secondary/50 px-8 py-12 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-accent-foreground">
              Home Try-On
            </p>
            <h2 className="mt-3 font-serif text-4xl text-primary">
              Try it at home before you buy
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Pick your favourites and our trusted advisor brings them to your doorstep, insured
              and hallmarked. Book a try-on from any product page.
            </p>
            <Link
              to="/catalog"
              search={catalogSearch()}
              className="mt-7 inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
