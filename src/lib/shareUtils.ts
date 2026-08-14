export type ShareOrder = {
  id: string | number;
  order_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  total_amount?: number | null;
  status?: string | null;
  order_status?: string | null;
  payment_mode?: string | null;
};

export type ShareOptions = {
  /** Total net weight in grams across the order's items. */
  netWeight?: number;
};

/** Normalise an Indian mobile number to the 91XXXXXXXXXX form. */
export function cleanIndianPhone(raw?: string | null): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `91${local}`;
}

export function getInvoiceUrl(orderId: string | number): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/order-confirmation/${orderId}`;
}

function formatInr(amount?: number | null): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(amount ?? 0),
  );
}

export function buildInvoiceMessage(
  order: ShareOrder,
  invoiceUrl: string,
  options: ShareOptions = {},
): string {
  const status =
    order.order_status ?? order.status ?? (order.payment_mode === "online" ? "PAID" : "PENDING");
  return [
    "✨ *Ratan Jewellers - Order & Tax Invoice* ✨",
    `Dear ${order.customer_name ?? "Customer"},`,
    "Thank you for shopping with us! Here are your order details:",
    "",
    `📄 *Invoice #:* ${order.order_number}`,
    `💰 *Total Amount:* ₹${formatInr(order.total_amount)}`,
    `⚖️ *Net Weight:* ${Number(options.netWeight ?? 0).toFixed(2)}g`,
    `🔖 *Status:* ${String(status).toUpperCase()}`,
    "",
    `🔗 *View & Download Tax Invoice:* ${invoiceUrl}`,
    "",
    "📍 *Ratan Jewellers*",
    "For queries, contact us directly.",
  ].join("\n");
}

export function generateWhatsAppShareUrl(
  order: ShareOrder,
  invoiceUrl: string,
  options: ShareOptions = {},
): string {
  const phone = cleanIndianPhone(order.customer_phone);
  const text = encodeURIComponent(buildInvoiceMessage(order, invoiceUrl, options));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function generateSmsShareUrl(
  order: ShareOrder,
  invoiceUrl: string,
  options: ShareOptions = {},
): string {
  const phone = cleanIndianPhone(order.customer_phone);
  const body = encodeURIComponent(buildInvoiceMessage(order, invoiceUrl, options));
  return `sms:${phone ? `+${phone}` : ""}?body=${body}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
