import { useCategories } from "@/hooks/useJewelleryData";

export function CategoryStrip() {
  const { data, isLoading, isError } = useCategories();
  const categories = data ?? [];

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl text-primary">Shop by category</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Curated edits
        </span>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading categories…</p>}
      {isError && (
        <p className="mt-4 text-sm text-destructive">Could not load categories.</p>
      )}

      <div className="mt-6 flex snap-x gap-5 overflow-x-auto pb-2">
        {categories.map((c) => (
          <article
            key={c.id}
            className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden bg-secondary">
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center font-serif text-3xl text-primary/40">
                  {c.name?.charAt(0)}
                </div>
              )}
            </div>
            <p className="px-4 py-3 text-center font-serif text-lg text-primary">{c.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
