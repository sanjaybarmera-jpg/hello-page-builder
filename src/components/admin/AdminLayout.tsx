import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Boxes, Coins, LayoutDashboard, LogOut, ReceiptText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/metal-rates", label: "Metal Rates", icon: Coins },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
] as const;

export function AdminShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/admin" }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
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
