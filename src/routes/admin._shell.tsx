import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminLayout";
import { AuthProvider } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/_shell")({
  beforeLoad: async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/login" });
    return { user: data.user };
  },
  component: () => (
    <AuthProvider>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AuthProvider>
  ),
});
