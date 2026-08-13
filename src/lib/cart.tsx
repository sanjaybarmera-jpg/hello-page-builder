import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  sku: string;
  image_url?: string | null;
  metal: string;
  karat: number | null;
  size?: string | null;
  net_weight: number;
  price: number;
  qty: number;
  metalPrice?: number;
  makingCharge?: number;
  gst?: number;
  ratePerGram?: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setQty: (key: string, qty: number) => void;
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rj-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed cart */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue["add"] = (item, qty = 1) => {
      const key = `${item.productId}-${item.karat ?? "na"}-${item.size ?? "na"}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty, price: item.price } : i));
        }
        return [...prev, { ...item, key, qty }];
      });
      setIsOpen(true);
    };

    return {
      items,
      add,
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
      setQty: (key, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
        ),
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.price * i.qty, 0),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
