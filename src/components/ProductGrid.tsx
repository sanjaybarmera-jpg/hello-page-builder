import { useMetalRates, useProducts } from "@/hooks/useJewelleryData";
import { calculateJewelleryPrice, inr, purityLabel } from "@/lib/jewellery";

export function ProductGrid() {
  const { data: products, isLoading, isError } = useProducts();
  const { data: rates } = useMetalRates();
  const metalRates = rates ?? [];

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl text-primary">Live-priced jewellery</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Incl. 3% GST
        </span>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading products…</p>}
      {isError && <p className="mt-4 text-sm text-destructive">Could not load products.</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => {
          const price = calculateJewelleryPrice(p, metalRates);
          return (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-4/3 overflow-hidden bg-secondary">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center font-serif text-4xl text-primary/30">
                    {p.name?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-serif text-xl leading-snug text-primary">{p.name}</h3>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground">
                    {purityLabel(p)}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                    {Number(p.net_weight)}g net
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
                    SKU {p.sku}
                  </span>
                </div>

                <p className="mt-4 text-2xl font-semibold text-foreground">
                  {inr(price.finalPrice)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Metal {inr(price.metalPrice)} · Making {inr(price.makingCharge)} · GST{" "}
                  {inr(price.gst)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
