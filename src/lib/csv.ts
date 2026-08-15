import type { Category, Product } from "@/lib/jewellery";

export const INVENTORY_COLUMNS = [
  "SKU",
  "Title",
  "Category",
  "Purity",
  "Gross_Weight_g",
  "Net_Weight_g",
  "Making_Charge_Type",
  "Making_Charge_Value",
  "Image_URL",
  "Created_At",
] as const;

function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildInventoryCsv(products: Product[], categories: Category[]): string {
  const catName = (id: Product["category_id"]) =>
    categories.find((c) => String(c.id) === String(id))?.name ?? "";
  const rows: (string | number | null | undefined)[][] = [[...INVENTORY_COLUMNS]];
  for (const p of products) {
    const flat = p.making_charge_flat ?? null;
    rows.push([
      p.sku,
      p.name,
      catName(p.category_id),
      p.karat ? `${p.karat}K` : (p.metal ?? "").toUpperCase(),
      p.gross_weight ?? "",
      p.net_weight,
      flat !== null ? "flat" : "percent",
      flat !== null ? flat : (p.making_charge_percent ?? ""),
      p.image_url ?? "",
      (p as { created_at?: string }).created_at ?? "",
    ]);
  }
  return toCsv(rows);
}

export const SAMPLE_CSV = toCsv([
  [...INVENTORY_COLUMNS],
  [
    "RJ-1001",
    "Aria Gold Ring",
    "Rings",
    "22K",
    "8.9",
    "8.5",
    "percent",
    "12",
    "https://example.com/ring.jpg",
    "",
  ],
]);

/** RFC4180-ish CSV parser supporting quoted cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ImportRow = {
  sku: string;
  name: string;
  description?: string | null;
  category_id: string | number | null;
  metal: string;
  karat: number | null;
  gross_weight: number | null;
  net_weight: number;
  making_charge_percent: number | null;
  making_charge_flat: number | null;
  image_url: string | null;
};

export type ImportResult = { rows: ImportRow[]; errors: string[] };

export function parseInventoryCsv(text: string, categories: Category[]): ImportResult {
  const table = parseCsv(text);
  const errors: string[] = [];
  const rows: ImportRow[] = [];
  if (table.length < 2) return { rows, errors: ["CSV has no data rows."] };

  const header = (table[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  const get = (line: string[], name: string) => (line[col(name)] ?? "").trim();

  table.slice(1).forEach((line, idx) => {
    const rowNo = idx + 2;
    const sku = get(line, "SKU");
    const name = get(line, "Title");
    const netRaw = get(line, "Net_Weight_g");
    const purity = get(line, "Purity").toUpperCase();

    if (!sku) return errors.push(`Row ${rowNo}: SKU is required.`);
    if (!name) return errors.push(`Row ${rowNo}: Title is required.`);
    const net = Number(netRaw);
    if (!netRaw || Number.isNaN(net) || net <= 0)
      return errors.push(`Row ${rowNo}: Net weight must be a positive number.`);
    if (!purity) return errors.push(`Row ${rowNo}: Purity is required.`);

    const karatMatch = purity.match(/(\d{2})\s*K/);
    const karat = karatMatch ? Number(karatMatch[1]) : null;
    const metal = karat ? "gold" : "silver";
    if (karat && ![14, 18, 22, 24].includes(karat))
      return errors.push(`Row ${rowNo}: Purity must be 14K, 18K, 22K or 24K.`);

    const grossRaw = get(line, "Gross_Weight_g");
    const gross = grossRaw ? Number(grossRaw) : null;
    const makingType = get(line, "Making_Charge_Type").toLowerCase() === "flat" ? "flat" : "percent";
    const makingRaw = get(line, "Making_Charge_Value");
    const making = makingRaw ? Number(makingRaw) : null;
    const categoryName = get(line, "Category");
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );

    rows.push({
      sku,
      name,
      category_id: category ? category.id : null,
      metal,
      karat,
      gross_weight: gross !== null && !Number.isNaN(gross) ? gross : null,
      net_weight: net,
      making_charge_percent: makingType === "percent" ? making : null,
      making_charge_flat: makingType === "flat" ? making : null,
      image_url: get(line, "Image_URL") || null,
    });
  });

  return { rows, errors };
}
