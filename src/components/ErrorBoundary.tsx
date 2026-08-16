import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            NAKKASHI
          </p>
          <h1 className="mt-4 font-serif text-3xl text-foreground">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Our boutique hit an unexpected error. Your cart and orders are safe — please reload to
            continue browsing.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reload Store
            </button>
            <a
              href="/"
              className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Back to Home
            </a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Need help? Call{" "}
            <a href="tel:+919876543210" className="text-primary">
              +91 98765 43210
            </a>{" "}
            or email{" "}
            <a href="mailto:support@nakkashi.in" className="text-primary">
              support@nakkashi.in
            </a>
          </p>
        </div>
      </div>
    );
  }
}
