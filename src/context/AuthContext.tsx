import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "OWNER" | "STAFF";

export interface AdminAuthState {
  user: User | null;
  userRole: UserRole | null;
  isOwner: boolean;
  isStaff: boolean;
  loading: boolean;
}

const AuthContext = createContext<AdminAuthState>({
  user: null,
  userRole: null,
  isOwner: false,
  isStaff: false,
  loading: true,
});

function normalizeRole(value: unknown): UserRole {
  return String(value ?? "").toUpperCase() === "OWNER" ? "OWNER" : "STAFF";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    const loadProfile = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser || !supabase) {
        setUserRole(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (!active) return;
      // If the profiles table/row is unavailable, fall back to OWNER so a fresh
      // install is not locked out of its own dashboard.
      setUserRole(error ? "OWNER" : !data ? "STAFF" : normalizeRole((data as { role?: string }).role));
      setLoading(false);
    };

    void supabase.auth.getUser().then(({ data }) => loadProfile(data.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isOwner: userRole === "OWNER",
        isStaff: userRole === "STAFF",
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  return useContext(AuthContext);
}
