import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/jewellery";

export function CartDrawer() {
  const cart = useCart();

  const metal = cart.items.reduce((n, i) => n + (i.metalPrice ?? 0) * i.qty, 0);
  const making = cart.items.reduce((n, i) => n + (i.makingCharge ?? 0) * i.qty, 0);
  const gst = cart.items.reduce((n, i) => n + (i.gst ?? 0) * i.qty, 0);

  return (
    <>
      <button
        type="button"
        aria-label={`Open cart, ${cart.count} items`}
        onClick={cart.openCart}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <ShoppingBag className="h-5 w-5" />
        {cart.count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
            {cart.count}
          </span>
        )}
      </button>

      <Sheet open={cart.isOpen} onOpenChange={(o) => (o ? cart.openCart() : cart.closeCart())}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl text-primary">Your bag</SheetTitle>
            <SheetDescription>
              {cart.count === 0 ? "Your bag is empty." : `${cart.count} item(s) reserved for you.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            {cart.items.map((item) => (
              <div key={item.key} className="flex gap-3 rounded-xl border border-border p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.karat ? `${item.karat}K` : item.metal} · {item.net_weight}g
                    {item.size ? ` · Size ${item.size}` : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        aria-label="Decrease quantity"
                        className="px-2 py-1"
                        onClick={() => cart.setQty(item.key, item.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-5 text-center text-sm">{item.qty}</span>
                      <button
                        aria-label="Increase quantity"
                        className="px-2 py-1"
                        onClick={() => cart.setQty(item.key, item.qty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{inr(item.price * item.qty)}</span>
                      <button aria-label="Remove item" onClick={() => cart.remove(item.key)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cart.count > 0 && (
            <SheetFooter className="border-t border-border">
              <div className="w-full space-y-1.5 text-sm">
                <Row label="Metal value" value={inr(metal)} />
                <Row label="Making charges" value={inr(making)} />
                <Row label="GST (3%)" value={inr(gst)} />
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
                  <span>Total payable</span>
                  <span>{inr(cart.total)}</span>
                </div>
              </div>
              <Button asChild className="mt-3 w-full rounded-full" onClick={cart.closeCart}>
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
