import { createFileRoute } from "@tanstack/react-router";
import { useMetalRates } from "@/hooks/useJewelleryData";
import { inr } from "@/lib/jewellery";

export const Route = createFileRoute("/admin/_shell/metal-rates")({
  component: MetalRatesPage,
});

function MetalRatesPage() {
  const { data = [], isLoading } = useMetalRates();

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Metal Rates</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Metal</th>
              <th className="px-4 py-3">Karat</th>
              <th className="px-4 py-3">Rate / gram</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-4 text-muted-foreground" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}
            {data.map((r, i) => (
              <tr key={String(r.id ?? i)} className="border-t border-border">
                <td className="px-4 py-3 capitalize text-foreground">{r.metal}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.karat ?? "—"}</td>
                <td className="px-4 py-3 text-foreground">{inr(Number(r.rate_per_gram))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
