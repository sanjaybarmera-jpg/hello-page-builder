import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Barcode } from "@/components/admin/Barcode";
import { useProducts } from "@/hooks/useJewelleryData";
import type { Product } from "@/lib/jewellery";

export const Route = createFileRoute("/admin/_shell/tags")({
  component: TagsPage,
});

const HALLMARK: Record<number, string> = { 24: "999", 22: "916", 18: "750", 14: "585" };

function purityLabel(product: Product) {
  if (!product.karat) return product.metal?.toUpperCase() === "SILVER" ? "925 SILVER" : "—";
  return `${product.karat}K (${HALLMARK[product.karat] ?? "—"})`;
}

function TagsPage() {
  const products = useProducts();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});

  const list = useMemo(() => {
    const all = products.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) || String(p.sku ?? "").toLowerCase().includes(q),
    );
  }, [products.data, query]);

  const allSelected = list.length > 0 && list.every((p) => selected[String(p.id)]);

  const toggle = (product: Product) => {
    const key = String(product.id);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = 1;
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next: Record<string, number> = {};
    for (const p of list) next[String(p.id)] = selected[String(p.id)] ?? 1;
    setSelected(next);
  };

  const setQty = (id: string, qty: number) =>
    setSelected((prev) => ({ ...prev, [id]: Math.max(1, Math.min(50, qty || 1)) }));

  const tags = useMemo(() => {
    const out: Product[] = [];
    for (const p of products.data ?? []) {
      const qty = selected[String(p.id)];
      if (!qty) continue;
      for (let i = 0; i < qty; i += 1) out.push(p);
    }
    return out;
  }, [products.data, selected]);

  return (
    <div className="space-y-8">
      <header className="print-hidden flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Tag / Barcode Generator</h1>
          <p className="text-sm text-muted-foreground">
            Select inventory items and print physical jewellery tags.
          </p>
        </div>
        <Button onClick={() => window.print()} disabled={tags.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Print Selected Tags ({tags.length})
        </Button>
      </header>

      <section className="print-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or SKU"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={toggleAll} disabled={list.length === 0}>
            {allSelected ? "Clear All" : "Select All"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Purity</th>
                <th className="px-4 py-3">GW / NW</th>
                <th className="w-28 px-4 py-3">Qty</th>
              </tr>
            </thead>
            <tbody>
              {products.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading inventory…
                  </td>
                </tr>
              )}
              {!products.isLoading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
              {list.map((p) => {
                const key = String(p.id);
                const qty = selected[key];
                return (
                  <tr key={key} className="border-t border-border">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-current"
                        checked={Boolean(qty)}
                        onChange={() => toggle(p)}
                        aria-label={`Select ${p.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{purityLabel(p)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(p.gross_weight ?? p.net_weight)?.toFixed?.(2) ?? p.gross_weight}g /{" "}
                      {p.net_weight?.toFixed?.(2) ?? p.net_weight}g
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={qty ?? 1}
                        disabled={!qty}
                        onChange={(e) => setQty(key, Number(e.target.value))}
                        className="h-8 w-20"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="tag-sheet" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tags.map((p, i) => (
          <article
            key={`${p.id}-${i}`}
            className="jewel-tag rounded-md border border-border bg-white p-2 text-center text-black"
          >
            <p className="font-serif text-[11px] font-semibold tracking-[0.18em]">
              RATAN JEWELLERS
            </p>
            <Barcode value={String(p.sku ?? p.id)} height={30} className="mt-1 h-8 w-full" />
            <p className="font-mono text-[9px] tracking-widest">{p.sku}</p>
            <p className="mt-1 truncate text-[10px] font-medium">{p.name}</p>
            <div className="mt-1 flex items-center justify-between text-[9px]">
              <span>GW: {p.gross_weight ?? p.net_weight}g</span>
              <span>NW: {p.net_weight}g</span>
            </div>
            <p className="mt-1 inline-block rounded border border-black px-1.5 text-[9px] font-semibold">
              {purityLabel(p)}
            </p>
          </article>
        ))}
        {tags.length === 0 && (
          <p className="print-hidden col-span-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Select products above to preview printable tags.
          </p>
        )}
      </section>
    </div>
  );
}
