export type MetalRate = {
  id?: string | number;
  metal: string; // "gold" | "silver"
  karat: number | null; // 24, 22, 18 ... null for silver
  rate_per_gram: number;
  updated_at?: string;
};

export type Category = {
  id: string | number;
  name: string;
  slug?: string | null;
  image_url?: string | null;
};

export type Product = {
  id: string | number;
  name: string;
  sku: string;
  metal: string; // "gold" | "silver"
  karat: number | null;
  description?: string | null;
  gross_weight?: number | null;
  net_weight: number; // grams
  making_charge_percent?: number | null;
  making_charge_flat?: number | null;
  image_url?: string | null;
  category_id?: string | number | null;
};

export type PriceBreakdown = {
  metalPrice: number;
  makingCharge: number;
  subtotal: number;
  gst: number;
  finalPrice: number;
  ratePerGram: number;
};

export const GST_RATE = 0.03;

export function findRate(product: Product, metalRates: MetalRate[]): number {
  const metal = (product.metal ?? "gold").toLowerCase();
  const match =
    metalRates.find(
      (r) =>
        r.metal?.toLowerCase() === metal &&
        (product.karat == null || Number(r.karat) === Number(product.karat)),
    ) ?? metalRates.find((r) => r.metal?.toLowerCase() === metal);
  return Number(match?.rate_per_gram ?? 0);
}

/**
 * BlueStone-style price formula:
 *   Metal Price  = net weight * rate for the product's karat
 *   Making       = metal price * making% / 100, or a flat rate
 *   Subtotal     = metal price + making
 *   GST (3%)     = subtotal * 0.03
 *   Final Price  = subtotal + GST
 */
export function calculateJewelleryPrice(
  product: Product,
  metalRates: MetalRate[],
): PriceBreakdown {
  const ratePerGram = findRate(product, metalRates);
  const metalPrice = Number(product.net_weight ?? 0) * ratePerGram;

  const makingCharge = product.making_charge_flat
    ? Number(product.making_charge_flat)
    : (metalPrice * Number(product.making_charge_percent ?? 0)) / 100;

  const subtotal = metalPrice + makingCharge;
  const gst = subtotal * GST_RATE;

  return {
    metalPrice,
    makingCharge,
    subtotal,
    gst,
    finalPrice: subtotal + gst,
    ratePerGram,
  };
}

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const purityLabel = (p: { metal: string; karat: number | null }) =>
  p.karat ? `${p.karat}K` : p.metal?.toLowerCase() === "silver" ? "925 Silver" : "—";
