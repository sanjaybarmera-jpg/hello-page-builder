import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/_shell/leads")({
  component: LeadsPage,
});

export const LEAD_STATUSES = ["PENDING", "CONTACTED", "COMPLETED", "REJECTED"] as const;

type Lead = {
  id: string | number;
  customer_name?: string | null;
  phone?: string | null;
  preferred_date?: string | null;
  address?: string | null;
  product_title?: string | null;
  product_sku?: string | null;
  status?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
};

export function useLeads() {
  return useQuery({
    queryKey: ["home_tryon_requests"],
    enabled: Boolean(supabase),
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { data, error } = await supabase
        .from("home_tryon_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Lead[];
    },
  });
}

function LeadsPage() {
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading, error } = useLeads();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string | number;
      patch: { status?: string; admin_notes?: string };
    }) => {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error: err } = await supabase.from("home_tryon_requests").update(patch).eq("id", id);
      if (err) throw new Error(err.message);
    },
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["home_tryon_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Home Try-On Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {leads.length} appointment request(s).
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load leads."}
        </p>
      )}

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading leads…</p>}
      {!isLoading && leads.length === 0 && !error && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No try-on requests yet.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {leads.map((lead) => {
          const key = String(lead.id);
          const status = (lead.status ?? "PENDING").toUpperCase();
          return (
            <article key={key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{lead.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.phone}</p>
                </div>
                <Badge variant={status === "PENDING" ? "default" : "secondary"}>{status}</Badge>
              </div>

              <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                <Item
                  label="Preferred date"
                  value={
                    lead.preferred_date
                      ? new Date(lead.preferred_date).toLocaleDateString("en-IN")
                      : "—"
                  }
                />
                <Item label="Address" value={lead.address ?? "—"} />
                <Item
                  label="Product"
                  value={
                    lead.product_title
                      ? `${lead.product_title}${lead.product_sku ? ` (${lead.product_sku})` : ""}`
                      : "—"
                  }
                />
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select
                  value={status}
                  onValueChange={(next) => update.mutate({ id: lead.id, patch: { status: next } })}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                className="mt-3"
                rows={2}
                placeholder="Admin notes…"
                value={notes[key] ?? lead.admin_notes ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [key]: e.target.value }))}
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() =>
                  update.mutate({
                    id: lead.id,
                    patch: { admin_notes: notes[key] ?? lead.admin_notes ?? "" },
                  })
                }
              >
                Save note
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 uppercase tracking-wide">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
