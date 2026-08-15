import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, Product } from "@/lib/jewellery";

const KARATS = [14, 18, 22, 24];

const selectClass =
  "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type EditState = {
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

function toState(product: Product): EditState {
  const flat = product.making_charge_flat ?? null;
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    category_id: product.category_id ? String(product.category_id) : "",
    metal: product.metal ?? "gold",
    karat: product.karat ? String(product.karat) : "22",
    gross_weight: product.gross_weight != null ? String(product.gross_weight) : "",
    net_weight: product.net_weight != null ? String(product.net_weight) : "",
    making_type: flat !== null ? "flat" : "percent",
    making_value:
      flat !== null ? String(flat) : product.making_charge_percent != null ? String(product.making_charge_percent) : "",
  };
}

export function ProductEditDialog({
  product,
  categories,
  onOpenChange,
}: {
  product: Product | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [state, setState] = useState<EditState | null>(product ? toState(product) : null);

  useEffect(() => {
    setState(product ? toState(product) : null);
  }, [product]);

  const set = <K extends keyof EditState>(key: K, value: EditState[K]) =>
    setState((s) => (s ? { ...s, [key]: value } : s));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (!product || !state) throw new Error("Nothing to update.");
      if (!state.name.trim()) throw new Error("Title is required.");
      const net = Number(state.net_weight);
      if (!state.net_weight || Number.isNaN(net) || net <= 0)
        throw new Error("Net weight must be a positive number.");

      const { error } = await supabase
        .from("products")
        .update({
          name: state.name.trim(),
          description: state.description.trim() || null,
          category_id: state.category_id || null,
          metal: state.metal,
          karat: state.metal === "silver" ? null : Number(state.karat),
          gross_weight: state.gross_weight ? Number(state.gross_weight) : null,
          net_weight: net,
          making_charge_percent:
            state.making_type === "percent" && state.making_value
              ? Number(state.making_value)
              : null,
          making_charge_flat:
            state.making_type === "flat" && state.making_value ? Number(state.making_value) : null,
        })
        .eq("id", product.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit item</DialogTitle>
          <DialogDescription>SKU {product?.sku}</DialogDescription>
        </DialogHeader>

        {state && (
          <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="edit-name">Title</Label>
              <Input
                id="edit-name"
                className="mt-1.5"
                maxLength={140}
                value={state.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                className="mt-1.5"
                rows={3}
                maxLength={1000}
                value={state.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <select
                id="edit-category"
                className={selectClass}
                value={state.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-metal">Metal</Label>
              <select
                id="edit-metal"
                className={selectClass}
                value={state.metal}
                onChange={(e) => set("metal", e.target.value)}
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-karat">Purity (Karat)</Label>
              <select
                id="edit-karat"
                className={selectClass}
                value={state.karat}
                disabled={state.metal === "silver"}
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
                <Label htmlFor="edit-gross">Gross wt (g)</Label>
                <Input
                  id="edit-gross"
                  className="mt-1.5"
                  type="number"
                  step="0.01"
                  min="0"
                  value={state.gross_weight}
                  onChange={(e) => set("gross_weight", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-net">Net wt (g)</Label>
                <Input
                  id="edit-net"
                  className="mt-1.5"
                  type="number"
                  step="0.01"
                  min="0"
                  value={state.net_weight}
                  onChange={(e) => set("net_weight", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-making-type">Making charge type</Label>
              <select
                id="edit-making-type"
                className={selectClass}
                value={state.making_type}
                onChange={(e) => set("making_type", e.target.value as "percent" | "flat")}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-making-value">
                Making charge value {state.making_type === "percent" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="edit-making-value"
                className="mt-1.5"
                type="number"
                step="0.01"
                min="0"
                value={state.making_value}
                onChange={(e) => set("making_value", e.target.value)}
              />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
