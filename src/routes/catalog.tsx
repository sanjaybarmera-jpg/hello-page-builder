import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCategories, useMetalRates, useProducts } from "@/hooks/useJewelleryData";
import { calculateJewelleryPrice, inr, purityLabel } from "@/lib/jewellery";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Search = {
  q: string;
  category: string;
  purity: string; // comma separated e.g. "18,22"
  maxWeight: number;
  sort: string; // price_asc | price_desc | newest
};

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: str(search["q"]),
    category: str(search["category"]),
    purity: str(search["purity"]),
    maxWeight: Number(search["maxWeight"]) > 0 ? Number(search["maxWeight"]) : 50,
    sort: str(search["sort"], "newest"),
  }),
  head: () => ({
    meta: [
      { title: "Catalog — Search Gold & Diamond Jewellery | Ratan Jewellers" },
      {
        name: "description",
        content:
          "Search and filter the Ratan Jewellers catalog by category, purity, weight and price with live gold-rate pricing.",
      },
      { property: "og:title", content: "Catalog — Ratan Jewellers" },
      {
        property: "og:description",
        content: "Filter fine jewellery by category, purity and weight with live pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

const PURITIES = [18, 22, 24];

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: rates } = useMetalRates();
  const metalRates = rates ?? [];

  const setSearch = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const selectedPurities = search.purity
    ? search.purity.split(",").filter(Boolean).map(Number)
    : [];

  const list = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    const items = (products ?? []).filter((p) => {
      if (
        q &&
        ![p.name, p.sku, p.description ?? ""].some((f) => String(f).toLowerCase().includes(q))
      )
        return false;
      if (search.category && String(p.category_id) !== search.category) return false;
      if (selectedPurities.length && !selectedPurities.includes(Number(p.karat))) return false;
      if (Number(p.net_weight ?? 0) > search.maxWeight && search.maxWeight < 50) return false;
      return true;
    });

    const price = (p: (typeof items)[number]) =>
      calculateJewelleryPrice(p, metalRates).finalPrice;

    if (search.sort === "price_asc") items.sort((a, b) => price(a) - price(b));
    else if (search.sort === "price_desc") items.sort((a, b) => price(b) - price(a));
    else
      items.sort((a, b) =>
        String((b as { created_at?: string }).created_at ?? b.id).localeCompare(
          String((a as { created_at?: string }).created_at ?? a.id),
        ),
      );

    return items;
  }, [products, metalRates, search]);

  const togglePurity = (k: number) => {
    const next = selectedPurities.includes(k)
      ? selectedPurities.filter((v) => v !== k)
      : [...selectedPurities, k];
    setSearch({ purity: next.join(",") });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />


      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[240px_1fr]">
        <aside className="space-y-8">
          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Search
            </h2>
            <Input
              value={search.q}
              placeholder="Title, SKU or description"
              onChange={(e) => setSearch({ q: e.target.value })}
            />
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Category
            </h2>
            <div className="space-y-1 text-sm">
              <button
                onClick={() => setSearch({ category: "" })}
                className={`block w-full rounded-md px-2 py-1 text-left ${
                  !search.category ? "bg-secondary text-primary" : "text-muted-foreground"
                }`}
              >
                All
              </button>
              {(categories ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSearch({ category: String(c.id) })}
                  className={`block w-full rounded-md px-2 py-1 text-left ${
                    search.category === String(c.id)
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Purity
            </h2>
            <div className="space-y-2">
              {PURITIES.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedPurities.includes(k)}
                    onCheckedChange={() => togglePurity(k)}
                  />
                  {k}K
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Net weight
            </h2>
            <Slider
              value={[search.maxWeight]}
              min={0}
              max={50}
              step={1}
              onValueChange={(v) => setSearch({ maxWeight: v[0] ?? 50 })}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              0g – {search.maxWeight >= 50 ? "50g+" : `${search.maxWeight}g`}
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Sort by
            </h2>
            <select
              value={search.sort}
              onChange={(e) => setSearch({ sort: e.target.value })}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </aside>

        <section>
          <h1 className="font-serif text-4xl text-primary">Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${list.length} pieces · live priced incl. 3% GST`}
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => {
              const price = calculateJewelleryPrice(p, metalRates);
              return (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: String(p.id) }}
                  className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-4/3 overflow-hidden bg-secondary">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center font-serif text-4xl text-primary/30">
                        {p.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-primary">{p.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                        {purityLabel(p)}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                        {Number(p.net_weight)}g net
                      </span>
                      <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
                        SKU {p.sku}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{inr(price.finalPrice)}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {!isLoading && list.length === 0 && (
            <p className="mt-10 text-sm text-muted-foreground">
              No pieces match these filters.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
