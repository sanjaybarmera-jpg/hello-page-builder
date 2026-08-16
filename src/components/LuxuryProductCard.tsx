import { Link } from "@tanstack/react-router";
import { Eye, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart";
import {
  calculateJewelleryPrice,
  inr,
  purityLabel,
  type MetalRate,
  type Product,
} from "@/lib/jewellery";

export function LuxuryProductCard({
  product,
  metalRates,
}: {
  product: Product;
  metalRates: MetalRate[];
}) {
  const cart = useCart();
  const price = calculateJewelleryPrice(product, metalRates);

  const addToBag = () => {
    cart.add({
      productId: String(product.id),
      name: product.name,
      sku: product.sku,
      image_url: product.image_url ?? null,
      metal: product.metal,
      karat: product.karat,
      net_weight: Number(product.net_weight ?? 0),
      price: price.finalPrice,
      metalPrice: price.metalPrice,
      makingCharge: price.makingCharge,
      gst: price.gst,
      ratePerGram: price.ratePerGram,
    });
    toast.success(`${product.name} added to your bag`);
  };

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl">
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center font-serif text-5xl text-primary/25">
            {product.name?.charAt(0)}
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full border border-gold/50 bg-background/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-md">
          💎 {purityLabel(product)} BIS Hallmarked
        </span>

        <div className="absolute inset-x-4 bottom-4 flex translate-y-4 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            to="/product/$id"
            params={{ id: String(product.id) }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gold/50 bg-background/85 px-4 py-2 text-xs font-medium text-primary backdrop-blur-md transition-colors hover:bg-background"
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </Link>
          <button
            type="button"
            onClick={addToBag}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full gold-gradient px-4 py-2 text-xs font-semibold text-primary shadow-md transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Add to Bag
          </button>
        </div>
      </div>

      <div className="p-5">
        <Link
          to="/product/$id"
          params={{ id: String(product.id) }}
          className="font-serif text-xl leading-snug tracking-wide text-primary transition-colors hover:text-gold-antique"
        >
          {product.name}
        </Link>

        <p className="mt-3 font-serif text-2xl tracking-wide text-primary">
          {inr(price.finalPrice)}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Weight: {Number(product.net_weight ?? 0).toFixed(2)}g · Incl. 3% GST
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">SKU {product.sku}</p>
      </div>
    </article>
  );
}
