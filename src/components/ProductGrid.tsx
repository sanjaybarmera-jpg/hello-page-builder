import { useMetalRates, useProducts } from "@/hooks/useJewelleryData";
import { LuxuryProductCard } from "@/components/LuxuryProductCard";

export function ProductGrid() {
  const { data: products, isLoading, isError } = useProducts();
  const { data: rates } = useMetalRates();
  const metalRates = rates ?? [];

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl tracking-wide text-primary">Live-priced jewellery</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Incl. 3% GST
        </span>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading products…</p>}
      {isError && <p className="mt-4 text-sm text-destructive">Could not load products.</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <LuxuryProductCard key={String(p.id)} product={p} metalRates={metalRates} />
        ))}
      </div>
    </section>
  );
}
