import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import type { AuditLogRow } from "@/lib/auditLogger";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/_shell/logs")({
  component: () => (
    <OwnerOnly>
      <AuditLogsPage />
    </OwnerOnly>
  ),
});

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-500/15 text-emerald-600",
  UPDATE: "bg-amber-500/15 text-amber-600",
  DELETE: "bg-red-500/15 text-red-600",
};

function useAuditLogs() {
  return useQuery({
    queryKey: ["audit_logs"],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<AuditLogRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AuditLogRow[];
    },
  });
}

function AuditLogsPage() {
  const { data: logs = [], isLoading, error } = useAuditLogs();
  const [entity, setEntity] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(
    () =>
      logs.filter((log) => {
        if (entity !== "ALL" && (log.entity_type ?? "").toUpperCase() !== entity) return false;
        if (action !== "ALL" && (log.action_type ?? "").toUpperCase() !== action) return false;
        const ts = log.created_at ? new Date(log.created_at).getTime() : 0;
        if (from && ts < new Date(`${from}T00:00:00`).getTime()) return false;
        if (to && ts > new Date(`${to}T23:59:59`).getTime()) return false;
        return true;
      }),
    [logs, entity, action, from, to],
  );

  return (
    <div>
      <header className="flex items-center gap-3">
        <History className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-serif text-3xl text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Every product, rate and order change recorded with user and role.
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger>
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All entities</SelectItem>
            <SelectItem value="PRODUCT">Products</SelectItem>
            <SelectItem value="RATE">Rates</SelectItem>
            <SelectItem value="ORDER">Orders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading activity…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load logs."}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No activity for these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User &amp; Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const act = (log.action_type ?? "").toUpperCase();
                return (
                  <tr key={String(log.id)} className="border-t border-border/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{log.user_email ?? "System"}</p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {log.user_role ?? "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          ACTION_STYLES[act] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {act || "—"}
                      </span>
                      <p className="mt-1 text-[11px] text-muted-foreground">{log.entity_type}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{log.details ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
