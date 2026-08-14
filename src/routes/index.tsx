import { createFileRoute } from "@tanstack/react-router";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { RatesTicker } from "@/components/RatesTicker";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ProductGrid } from "@/components/ProductGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ratan Jewellers — Fine Gold & Diamond Jewellery" },
      {
        name: "description",
        content:
          "Ratan Jewellers: timeless gold, diamond and silver jewellery crafted with heritage precision. Daily gold and silver rates updated.",
      },
      { property: "og:title", content: "Ratan Jewellers — Fine Gold & Diamond Jewellery" },
      {
        property: "og:description",
        content:
          "Timeless gold, diamond and silver jewellery crafted with heritage precision. Daily gold and silver rates updated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { name: "Gold", note: "22K & 24K classics" },
  { name: "Diamond", note: "Certified brilliance" },
  { name: "Silver", note: "Everyday elegance" },
  { name: "Bridal", note: "Heirloom sets" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <RatesTicker />


      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="font-serif text-2xl tracking-tight text-primary">Ratan Jewellers</p>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Since 1954
            </p>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            {CATEGORIES.map((c) => (
              <span key={c.name} className="transition-colors hover:text-primary">
                {c.name}
              </span>
            ))}
            <Link
              to="/catalog"
              search={{ q: "", category: "", purity: "", maxWeight: 50, sort: "newest" }}
              className="transition-colors hover:text-primary"
            >
              Catalog
            </Link>
            <Link to="/khata" className="transition-colors hover:text-primary">
              Track Order / Download Bill
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <SupabaseStatus />

        <section className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-accent-foreground">
              The Heritage Edit
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-primary sm:text-6xl">
              Jewellery made to be remembered
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Hallmarked gold, certified diamonds and hand-finished silver — crafted in our own
              workshops and priced transparently against today&apos;s rates.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Explore collections
              </button>
              <button className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Book an appointment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="font-serif text-xl text-primary">{c.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
        </section>

        <CategoryStrip />
        <ProductGrid />
      </main>


      <footer className="mt-10 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ratan Jewellers. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
