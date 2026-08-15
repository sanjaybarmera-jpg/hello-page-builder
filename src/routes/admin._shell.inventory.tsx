import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCategories, useMetalRates, useProducts } from "@/hooks/useJewelleryData";
import { calculateJewelleryPrice, inr, purityLabel } from "@/lib/jewellery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/_shell/inventory")({
  component: InventoryPage,
});

const KARATS = [14, 18, 22, 24];

type FormState = {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  metal: string;
  karat: string;
  gross_weight: string;
  net_weight: string;
  making_type: "percent" | "flat";
  making_value: string;
};

const emptyForm: FormState = {
  sku: "",
  name: "",
  description: "",
  category_id: "",
  metal: "gold",
  karat: "22",
  gross_weight: "",
  net_weight: "",
  making_type: "percent",
  making_value: "",
};

function InventoryPage() {
  const qc = useQueryClient();
  const categories = useCategories();
  const rates = useMetalRates();
  const products = useProducts();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (!form.sku.trim() || !form.name.trim()) throw new Error("SKU and title are required.");
      if (!form.net_weight) throw new Error("Net weight is required.");

      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${form.sku.trim().replace(/[^a-zA-Z0-9-_]/g, "")}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        metal: form.metal,
        karat: form.metal === "silver" ? null : Number(form.karat),
        gross_weight: form.gross_weight ? Number(form.gross_weight) : null,
        net_weight: Number(form.net_weight),
        making_charge_percent:
          form.making_type === "percent" && form.making_value ? Number(form.making_value) : null,
        making_charge_flat:
          form.making_type === "flat" && form.making_value ? Number(form.making_value) : null,
        image_url,
      };

      const { error } = await supabase.from("products").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Item added to inventory");
      setForm(emptyForm);
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const fieldClass = "mt-1.5";
  const selectClass =
    "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl text-foreground">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add new jewellery items and manage your catalogue.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
      >
        <h2 className="font-serif text-xl text-foreground">Add New Item</h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU / Barcode</Label>
              <Input
                id="sku"
                className={fieldClass}
                value={form.sku}
                maxLength={64}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="RJ-0001"
              />
            </div>
            <div>
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                className={fieldClass}
                value={form.name}
                maxLength={140}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Aria Diamond Ring"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className={fieldClass}
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Hand-finished 22K gold with a brushed matte surface…"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className={selectClass}
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">Select category</option>
                {(categories.data ?? []).map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="metal">Metal</Label>
              <select
                id="metal"
                className={selectClass}
                value={form.metal}
                onChange={(e) => set("metal", e.target.value)}
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <div>
              <Label htmlFor="karat">Purity (Karat)</Label>
              <select
                id="karat"
                className={selectClass}
                value={form.karat}
                disabled={form.metal === "silver"}
                onChange={(e) => set("karat", e.target.value)}
              >
                {KARATS.map((k) => (
                  <option key={k} value={k}>
                    {k}K
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gross">Gross wt (g)</Label>
                <Input
                  id="gross"
                  className={fieldClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.gross_weight}
                  onChange={(e) => set("gross_weight", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="net">Net wt (g)</Label>
                <Input
                  id="net"
                  className={fieldClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.net_weight}
                  onChange={(e) => set("net_weight", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="makingType">Making charge type</Label>
              <select
                id="makingType"
                className={selectClass}
                value={form.making_type}
                onChange={(e) => set("making_type", e.target.value as "percent" | "flat")}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="makingValue">
                Making charge value {form.making_type === "percent" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="makingValue"
                className={fieldClass}
                type="number"
                step="0.01"
                min="0"
                value={form.making_value}
                onChange={(e) => set("making_value", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Product image</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`mt-1.5 flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"
              }`}
            >
              {preview ? (
                <div className="relative h-full w-full">
                  <img
                    src={preview}
                    alt="Selected product preview"
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-foreground">Drag &amp; drop an image</p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse · uploaded to product-images
                  </p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save item
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm(emptyForm);
              setFile(null);
              setPreview(null);
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">Current inventory</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `ratan_jewellers_inventory_${new Date().toISOString().slice(0, 10)}.csv`,
                  buildInventoryCsv(products.data ?? [], categories.data ?? []),
                )
              }
              disabled={(products.data ?? []).length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
            <ImportCsvDialog categories={categories.data ?? []} />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Purity</th>
                <th className="px-4 py-3">Net wt</th>
                <th className="px-4 py-3">Live price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products.data ?? []).map((p) => (
                <tr key={String(p.id)} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{purityLabel(p)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.net_weight}g</td>
                  <td className="px-4 py-3 text-foreground">
                    {inr(calculateJewelleryPrice(p, rates.data ?? []).finalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.isLoading && (products.data ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ProductEditDialog
        product={editing}
        categories={categories.data ?? []}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete SKU {deleting?.sku}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

