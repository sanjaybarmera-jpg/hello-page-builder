import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Search, ShoppingBag, UserCog } from "lucide-react";

import { RatesTicker } from "@/components/RatesTicker";
import { useCategories } from "@/hooks/useJewelleryData";
import { useCart } from "@/lib/cart";
import { Input } from "@/components/ui/input";

export type CatalogSearch = {
  q: string;
  category: string;
  purity: string;
  maxWeight: number;
  sort: string;
};

export const catalogSearch = (patch: Partial<CatalogSearch> = {}): CatalogSearch => ({
  q: "",
  category: "",
  purity: "",
  maxWeight: 50,
  sort: "newest",
  ...patch,
});

export function SiteHeader({ showCategories = true }: { showCategories?: boolean }) {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/catalog", search: catalogSearch({ q }) });
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur">
      <RatesTicker />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="mr-auto">
            <span className="block font-serif text-2xl leading-none tracking-tight text-primary">
              Ratan Jewellers
            </span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Since 1954
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <Link to="/" className="hover:text-primary" activeProps={{ className: "text-primary" }}>
              Home
            </Link>
            <Link to="/catalog" search={catalogSearch()} className="hover:text-primary">
              All Jewellery
            </Link>
            <Link to="/khata" className="hover:text-primary">
              Track Order / Bills
            </Link>
          </nav>

          <form onSubmit={submit} className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jewellery or SKU"
              aria-label="Search jewellery"
              className="w-56 rounded-full pl-9"
            />
          </form>

          <button
            type="button"
            onClick={cart.openCart}
            aria-label={`Open cart, ${cart.count} items`}
            className="relative rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-secondary"
          >
            <ShoppingBag className="h-4 w-4" />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {cart.count}
              </span>
            )}
          </button>

          <Link
            to="/admin"
            aria-label="Admin"
            className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <UserCog className="h-4 w-4" />
          </Link>
        </div>

        {showCategories && (categories?.length ?? 0) > 0 && (
          <div className="border-t border-border/70">
            <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-2.5">
              {(categories ?? []).map((c) => (
                <Link
                  key={String(c.id)}
                  to="/catalog"
                  search={catalogSearch({ category: String(c.id) })}
                  className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
