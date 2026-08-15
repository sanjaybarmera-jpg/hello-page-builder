import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAdminAuth } from "@/context/AuthContext";

export function OwnerOnly({ children }: { children: ReactNode }) {
  const { loading, isOwner } = useAdminAuth();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Checking permissions…</p>;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-serif text-2xl text-foreground">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This section is available to store owners only. Please contact the owner if you need
          access to revenue analytics or daily metal rates.
        </p>
        <Link
          to="/admin/inventory"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to Inventory
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
