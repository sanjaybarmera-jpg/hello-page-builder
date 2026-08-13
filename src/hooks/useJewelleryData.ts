import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, MetalRate, Product } from "@/lib/jewellery";

async function fetchTable<T>(table: string, columns = "*"): Promise<T[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export function useMetalRates() {
  return useQuery({
    queryKey: ["metal_rates"],
    queryFn: () => fetchTable<MetalRate>("metal_rates"),
    refetchInterval: 60_000,
    enabled: Boolean(supabase),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchTable<Category>("categories"),
    enabled: Boolean(supabase),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => fetchTable<Product>("products"),
    enabled: Boolean(supabase),
  });
}
