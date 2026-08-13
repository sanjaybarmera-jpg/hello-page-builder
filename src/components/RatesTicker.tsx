import { useMetalRates } from "@/hooks/useJewelleryData";
import type { MetalRate } from "@/lib/jewellery";

const label = (r: MetalRate) =>
  r.metal?.toLowerCase() === "silver" ? "Silver" : `Gold ${r.karat ?? ""}K`;

const order = (r: MetalRate) =>
  r.metal?.toLowerCase() === "silver" ? 100 : -(Number(r.karat) || 0);

export function RatesTicker() {
  const { data, isLoading, isError } = useMetalRates();
  const rates = [...(data ?? [])].sort((a, b) => order(a) - order(b));

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-2 text-xs tracking-wide">
        <span className="flex shrink-0 items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <span className="uppercase tracking-[0.25em] opacity-80">Live rates</span>
        </span>

        {isLoading && <span className="opacity-70">Loading today&apos;s rates…</span>}
        {isError && <span className="opacity-70">Rates unavailable right now</span>}
        {!isLoading &&
          !isError &&
          rates.length === 0 && <span className="opacity-70">No rates published yet</span>}

        {rates.map((r) => (
          <span key={`${r.metal}-${r.karat ?? "na"}`} className="flex items-center gap-2">
            <span className="opacity-70">{label(r)}</span>
            <span className="font-semibold">
              ₹{Number(r.rate_per_gram).toLocaleString("en-IN")}/g
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
