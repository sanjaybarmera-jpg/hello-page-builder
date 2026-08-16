import { Link } from "@tanstack/react-router";

import { catalogSearch } from "@/components/SiteHeader";
import { useCategories } from "@/hooks/useJewelleryData";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  match: string[];
  image: string;
  className: string;
};

const TILES: Tile[] = [
  {
    label: "Rings",
    match: ["ring"],
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80",
    className: "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    label: "Earrings",
    match: ["earring"],
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    className: "sm:col-span-2 lg:col-span-2",
  },
  {
    label: "Pendants",
    match: ["pendant"],
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80",
    className: "lg:col-span-1",
  },
  {
    label: "Chains",
    match: ["chain"],
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    className: "lg:col-span-1",
  },
  {
    label: "Necklaces",
    match: ["necklace", "haar"],
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    className: "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    label: "Charms & Accessories",
    match: ["charm", "watch", "accessor"],
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80",
    className: "lg:col-span-1",
  },
  {
    label: "Silver Coins & Bullion",
    match: ["coin", "bullion"],
    image:
      "https://images.unsplash.com/photo-1610375461369-d613b564f4c4?auto=format&fit=crop&w=800&q=80",
    className: "lg:col-span-1",
  },
  {
    label: "Bangles & Bracelets",
    match: ["bangle", "bracelet"],
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=80",
    className: "sm:col-span-2 lg:col-span-2",
  },
  {
    label: "Kadas / Men's Silver",
    match: ["kada", "men"],
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=80",
    className: "sm:col-span-2 lg:col-span-2",
  },
];

export function ShopByCategoryBento() {
  const { data } = useCategories();
  const categories = data ?? [];

  const searchFor = (tile: Tile) => {
    const hit = categories.find((c) => {
      const haystack = `${c.name ?? ""} ${c.slug ?? ""}`.toLowerCase();
      return tile.match.some((m) => haystack.includes(m));
    });
    return hit
      ? catalogSearch({ category: String(hit.id) })
      : catalogSearch({ q: tile.label });
  };

  return (
    <section className="hero-ambient mt-16 rounded-3xl border border-gold/30 px-4 py-14 sm:px-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-gold-antique">Curated edits</p>
        <h2 className="mt-3 font-serif text-4xl tracking-wide text-primary sm:text-5xl">
          Shop By <span className="gold-text italic">Category</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Handcrafted silver, organised the way you shop — from everyday chains to heirloom
          necklaces.
        </p>
      </div>

      <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[170px] sm:grid-cols-4 lg:auto-rows-[180px] lg:grid-cols-6">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            to="/catalog"
            search={searchFor(tile)}
            aria-label={`Shop ${tile.label}`}
            className={cn(
              "group relative col-span-2 overflow-hidden rounded-3xl border border-gold/30 shadow-sm transition-shadow hover:shadow-xl",
              tile.className,
            )}
          >
            <img
              src={tile.image}
              alt={`${tile.label} silver jewellery by NAKKASHI`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-serif text-xl tracking-wide text-white drop-shadow-md sm:text-2xl">
                {tile.label}
              </h3>
              <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.3em] text-white/80">
                Explore
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
