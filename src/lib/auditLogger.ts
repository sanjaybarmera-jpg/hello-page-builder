import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntity = "PRODUCT" | "RATE" | "ORDER";

export interface AuditLogRow {
  id: string | number;
  created_at: string;
  user_email: string | null;
  user_role: string | null;
  action_type: string;
  entity_type: string;
  details: string | null;
}

export interface LogActivityInput {
  actionType: AuditAction;
  entityType: AuditEntity;
  details: string;
}

/**
 * Best-effort audit trail write. Never throws: a logging failure must not
 * break the admin action that triggered it.
 */
export async function logActivity({
  actionType,
  entityType,
  details,
}: LogActivityInput): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;

    let role: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (profile as { role?: string } | null)?.role?.toUpperCase() ?? null;
    }

    await supabase.from("audit_logs").insert({
      user_email: user?.email ?? null,
      user_role: role,
      action_type: actionType,
      entity_type: entityType,
      details,
    });
  } catch {
    // swallow — audit logging is non-critical
  }
}
