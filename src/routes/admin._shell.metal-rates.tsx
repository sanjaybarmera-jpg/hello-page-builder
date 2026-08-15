import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useMetalRates } from "@/hooks/useJewelleryData";
import { inr, type MetalRate } from "@/lib/jewellery";
import { Button } from "@/components/ui/button";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/_shell/metal-rates")({
  component: () => (
    <OwnerOnly>
      <MetalRatesPage />
    </OwnerOnly>
  ),
});

const ROWS: { metal: string; karat: number | null; label: string }[] = [
  { metal: "gold", karat: 24, label: "Gold 24K" },
  { metal: "gold", karat: 22, label: "Gold 22K" },
  { metal: "gold", karat: 18, label: "Gold 18K" },
  { metal: "silver", karat: null, label: "Silver" },
];

const keyOf = (metal: string, karat: number | null) => `${metal}-${karat ?? "na"}`;

function MetalRatesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useMetalRates();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    ROWS.forEach((row) => {
      const existing = data.find(
        (r: MetalRate) =>
          r.metal?.toLowerCase() === row.metal && (r.karat ?? null) === row.karat,
      );
      next[keyOf(row.metal, row.karat)] =
        existing?.rate_per_gram != null ? String(existing.rate_per_gram) : "";
    });
    setDraft(next);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const payload = ROWS.map((row) => ({
        metal: row.metal,
        karat: row.karat,
        rate_per_gram: Number(draft[keyOf(row.metal, row.karat)] || 0),
        updated_at: new Date().toISOString(),
      })).filter((r) => r.rate_per_gram > 0);

      if (payload.length === 0) throw new Error("Enter at least one rate.");

      const { error } = await supabase
        .from("metal_rates")
        .upsert(payload, { onConflict: "metal,karat" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Rates updated — ticker and prices refreshed");
      qc.invalidateQueries({ queryKey: ["metal_rates"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <header>
        <h1 className="font-serif text-3xl text-foreground">Metal Rates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update today's rates — the live ticker and every product price recalculate instantly.
        </p>
      </header>

      <div className="mt-6 max-w-2xl overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Metal</th>
              <th className="px-4 py-3">Rate per gram (₹)</th>
              <th className="px-4 py-3">Current</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const k = keyOf(row.metal, row.karat);
              const value = draft[k] ?? "";
              return (
                <tr key={k} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{row.label}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 max-w-40"
                      value={value}
                      aria-label={`${row.label} rate per gram`}
                      onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {isLoading ? "…" : inr(Number(value || 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button className="mt-6" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update rates
      </Button>
    </div>
  );
}
