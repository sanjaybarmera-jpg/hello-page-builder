import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  CalendarHeart,
  Coins,
  LayoutDashboard,
  LogOut,
  ReceiptText,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

function useCount(table: string, column: string, pending: string[]) {
  return useQuery({
    queryKey: ["admin_count", table],
    enabled: Boolean(supabase),
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!supabase) return 0;
      const { data, error } = await supabase.from(table).select(column);
      if (error) return 0;
      return ((data ?? []) as unknown as Record<string, unknown>[]).filter((row) => {
        const value = String(row[column] ?? "PENDING");
        return pending.includes(value.toUpperCase());
      }).length;
    },
  });
}

export function AdminShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pendingOrders = useCount("orders", "order_status", ["PROCESSING", "READY", "PENDING"]);
  const pendingLeads = useCount("home_tryon_requests", "status", ["PENDING"]);

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, count: 0 },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes, count: 0 },
    { to: "/admin/metal-rates", label: "Metal Rates", icon: Coins, count: 0 },
    { to: "/admin/orders", label: "Orders", icon: ReceiptText, count: pendingOrders.data ?? 0 },
    { to: "/admin/leads", label: "Leads", icon: CalendarHeart, count: pendingLeads.data ?? 0 },
  ] as const;

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase?.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/60 px-4 py-6 md:block">
        <Link to="/" className="block px-2">
          <p className="font-serif text-2xl leading-none text-foreground">Ratan</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Jewellers
          </p>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map(({ to, label, icon: Icon, count }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/admin" }}
              activeProps={{
                className: "bg-primary/10 text-primary font-medium border-l-2 border-primary",
              }}
              inactiveProps={{ className: "border-l-2 border-transparent" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">{children ?? <Outlet />}</main>
    </div>
  );
}
