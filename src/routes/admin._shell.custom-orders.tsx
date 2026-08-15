import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Plus, UploadCloud } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/jewellery";
import { cleanIndianPhone } from "@/lib/shareUtils";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/_shell/custom-orders")({
  component: CustomOrdersPage,
});

export const CUSTOM_STAGES = [
  "DESIGNING",
  "CASTING",
  "POLISHING",
  "READY",
  "DELIVERED",
] as const;

const KARATS = [14, 18, 22, 24] as const;

type CustomOrder = {
  id: string | number;
  order_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  title?: string | null;
  karat?: number | null;
  est_net_weight?: number | null;
  reference_image_url?: string | null;
  estimated_cost?: number | null;
  advance_amount?: number | null;
  balance_amount?: number | null;
  target_delivery_date?: string | null;
  notes?: string | null;
  stage?: string | null;
  created_at?: string | null;
};

function makeOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CUST-${year}-${rand}`;
}

function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86_400_000);
}

function buildProgressMessage(order: CustomOrder): string {
  return [
    "✨ *Ratan Jewellers - Bespoke Jewellery Update* ✨",
    `Dear ${order.customer_name ?? "Customer"},`,
    `Your custom order *${order.title ?? "Bespoke piece"}* (Order #${order.order_number}) is now in *${(order.stage ?? "DESIGNING").toUpperCase()}* stage.`,
    `Target Delivery Date: ${
      order.target_delivery_date
        ? new Date(order.target_delivery_date).toLocaleDateString("en-IN")
        : "To be confirmed"
    }`,
    `Pending Balance: ₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
      Number(order.balance_amount ?? 0),
    )}`,
  ].join("\n");
}

function CustomOrdersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin_custom_orders"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase
        .from("custom_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as CustomOrder[];
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string | number; stage: string }) => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("custom_orders").update({ stage }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Stage updated");
      queryClient.invalidateQueries({ queryKey: ["admin_custom_orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const list = orders.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Custom Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} bespoke commission(s) in the pipeline.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Custom Order
        </Button>
      </div>

      {orders.error && (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {orders.error instanceof Error ? orders.error.message : "Could not load custom orders."}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Design</th>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Specs</th>
              <th className="px-4 py-3 text-right">Advance / Balance</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Loading custom orders…
                </td>
              </tr>
            )}
            {!orders.isLoading && list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No bespoke orders yet.
                </td>
              </tr>
            )}
            {list.map((o) => {
              const due = daysUntil(o.target_delivery_date);
              return (
                <tr key={String(o.id)} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    {o.reference_image_url ? (
                      <button type="button" onClick={() => setPreview(o.reference_image_url ?? null)}>
                        <img
                          src={o.reference_image_url}
                          alt={`${o.title ?? "Custom order"} reference`}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{o.order_number}</td>
                  <td className="px-4 py-3">
                    {o.customer_name}
                    <span className="block text-xs text-muted-foreground">{o.customer_phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    {o.title}
                    <span className="block text-xs text-muted-foreground">
                      {o.karat ? `${o.karat}K` : "—"} · {Number(o.est_net_weight ?? 0).toFixed(2)}g
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="block">{inr(Number(o.advance_amount ?? 0))} paid</span>
                    <Badge variant={Number(o.balance_amount ?? 0) > 0 ? "secondary" : "default"}>
                      {Number(o.balance_amount ?? 0) > 0
                        ? `${inr(Number(o.balance_amount ?? 0))} due`
                        : "Fully paid"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {o.target_delivery_date ? (
                      <span
                        className={
                          due !== null && due <= 3
                            ? "rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {new Date(o.target_delivery_date).toLocaleDateString("en-IN")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={(o.stage ?? "DESIGNING").toUpperCase()}
                      onValueChange={(stage) => updateStage.mutate({ id: o.id, stage })}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const phone = cleanIndianPhone(o.customer_phone);
                        if (!phone) {
                          toast.error("No phone number on this order");
                          return;
                        }
                        window.open(
                          `https://wa.me/${phone}?text=${encodeURIComponent(buildProgressMessage(o))}`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Send Progress
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(next) => !next && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reference design</DialogTitle>
            <DialogDescription>Customer supplied design photo.</DialogDescription>
          </DialogHeader>
          {preview && (
            <img src={preview} alt="Custom order reference" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <NewCustomOrderDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewCustomOrderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [estimate, setEstimate] = useState(0);
  const [advance, setAdvance] = useState(0);
  const balance = Math.max(0, estimate - advance);

  const create = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      if (!supabase) throw new Error("Supabase is not configured");
      const fd = new FormData(form);
      const name = String(fd.get("customer_name") ?? "").trim();
      const phone = String(fd.get("customer_phone") ?? "").trim();
      const title = String(fd.get("title") ?? "").trim();
      if (!name || !phone || !title) throw new Error("Customer name, phone and title are required");

      let reference_image_url: string | null = null;
      if (file) {
        const path = `custom/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        reference_image_url = supabase.storage.from("product-images").getPublicUrl(path).data
          .publicUrl;
      }

      const { error } = await supabase.from("custom_orders").insert({
        order_number: makeOrderNumber(),
        customer_name: name,
        customer_phone: phone,
        title,
        karat: Number(fd.get("karat") ?? 22),
        est_net_weight: Number(fd.get("est_net_weight") ?? 0),
        reference_image_url,
        estimated_cost: estimate,
        advance_amount: advance,
        balance_amount: balance,
        target_delivery_date: String(fd.get("target_delivery_date") ?? "") || null,
        notes: String(fd.get("notes") ?? "").trim() || null,
        stage: "DESIGNING",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Custom order created");
      setFile(null);
      setEstimate(0);
      setAdvance(0);
      queryClient.invalidateQueries({ queryKey: ["admin_custom_orders"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create order"),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New custom order</DialogTitle>
          <DialogDescription>Book a bespoke jewellery commission.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(e.currentTarget);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer name</Label>
              <Input id="customer_name" name="customer_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone number</Label>
              <Input id="customer_phone" name="customer_phone" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Item title</Label>
              <Input id="title" name="title" placeholder="Bridal Kundan Choker" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="karat">Target purity</Label>
              <select
                id="karat"
                name="karat"
                defaultValue="22"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {KARATS.map((k) => (
                  <option key={k} value={k}>
                    {k}K
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="est_net_weight">Estimated net weight (g)</Label>
              <Input id="est_net_weight" name="est_net_weight" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            onClick={() => fileInput.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-sm ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
            {file ? file.name : "Drag & drop a reference design photo, or click to browse"}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated total (₹)</Label>
              <Input
                id="estimated_cost"
                type="number"
                min="0"
                step="1"
                value={estimate || ""}
                onChange={(e) => setEstimate(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance_amount">Advance token (₹)</Label>
              <Input
                id="advance_amount"
                type="number"
                min="0"
                step="1"
                value={advance || ""}
                onChange={(e) => setAdvance(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remaining balance</Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">
                {inr(balance)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target_delivery_date">Target delivery date</Label>
              <Input id="target_delivery_date" name="target_delivery_date" type="date" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Special making notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Create custom order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
