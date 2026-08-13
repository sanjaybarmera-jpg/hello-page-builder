import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

type Status = "checking" | "connected" | "error";

export function SupabaseStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking connection to your Supabase project…");

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setMessage(
        "Missing environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example) and restart the dev server.",
      );
      return;
    }

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(`Could not reach Supabase: ${error.message}`);
          return;
        }
        setStatus("connected");
        setMessage("Connected to Custom Supabase");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setStatus("error");
        setMessage(
          `Could not reach Supabase: ${err instanceof Error ? err.message : "unknown error"}`,
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const tone =
    status === "connected"
      ? "border-primary/30 bg-primary/5 text-primary"
      : status === "error"
        ? "border-destructive/30 bg-destructive/5 text-destructive"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${tone}`}
    >
      {status === "checking" && <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />}
      {status === "connected" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {status === "error" && <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
