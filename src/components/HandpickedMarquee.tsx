import { Link } from "@tanstack/react-router";

import { catalogSearch } from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

type Collection = {
  title: string;
  note: string;
  query: string;
  image: string;
  cta?: boolean;
};

const COLLECTIONS: Collection[] = [
  {
    title: "NAKKASHI MEN",
    note: "Bold 925 silver for him",
    query: "men",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "DAINTY DREAMS",
    note: "Fine silver daily wear",
    query: "dainty",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "EVIL EYE & NAZARIYA",
    note: "Protective silver charms",
    query: "evil eye",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "THE CURVE & MINIMAL",
    note: "Modern geometric cuffs",
    query: "cuff",
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "HERITAGE KANDORA",
    note: "Rajasthani artisan silver",
    query: "kandora",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "CHIC SOLITAIRES",
    note: "Silver & moissanite sparkle",
    query: "solitaire",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "VIEW ALL COLLECTIONS",
    note: "Explore the full atelier",
    query: "",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    cta: true,
  },
];

function CollectionCard({ item }: { item: Collection }) {
  return (
    <Link
      to="/catalog"
      search={catalogSearch(item.query ? { q: item.query } : {})}
      aria-label={item.title}
      className="group relative h-[380px] w-[300px] shrink-0 overflow-hidden rounded-3xl border border-gold/40 shadow-sm transition-shadow hover:shadow-xl sm:h-[420px] sm:w-[330px]"
    >
      <img
        src={item.image}
        alt={`${item.title} — NAKKASHI handcrafted silver collection`}
        loading="lazy"
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        {item.cta ? (
          <span className="gold-gradient inline-block rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            {item.title}
          </span>
        ) : (
          <h3 className="font-serif text-2xl uppercase tracking-[0.12em] text-white drop-shadow-md">
            {item.title}
          </h3>
        )}
        <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/80">{item.note}</p>
      </div>
    </Link>
  );
}

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = reverse ? [...COLLECTIONS].reverse() : COLLECTIONS;
  return (
    <div className="group/row overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-6 hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-right" : "animate-marquee-left",
        )}
      >
        {[...items, ...items].map((item, i) => (
          <CollectionCard key={`${item.title}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function HandpickedMarquee() {
  return (
    <section className="mt-20">
      <div className="text-center">
        <h2 className="font-serif text-4xl tracking-[0.08em] text-primary sm:text-5xl">
          Handpicked <span className="gold-text italic">For You</span>
        </h2>
        <span className="gold-gradient mx-auto mt-4 block h-px w-32 rounded-full" />
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
          Curated 925 handcrafted designs crafted for every modern milestone.
        </p>
      </div>

      <div className="relative mt-10 space-y-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>
    </section>
  );
}
