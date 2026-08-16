import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SAMPLE_CSV, downloadCsv, parseInventoryCsv, type ImportRow } from "@/lib/csv";
import type { Category } from "@/lib/jewellery";

export function ImportCsvDialog({ categories }: { categories: Category[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const readFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const result = parseInventoryCsv(text, categories);
    setFileName(file.name);
    setRows(result.rows);
    setErrors(result.errors);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (rows.length === 0) throw new Error("No valid rows to import.");
      const { error } = await supabase.from("products").upsert(rows, { onConflict: "sku" });
      if (error) throw new Error(error.message);
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} item${count === 1 ? "" : "s"} imported successfully`);
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setRows([]);
      setErrors([]);
      setFileName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Bulk import inventory</DialogTitle>
          <DialogDescription>
            Required columns: SKU, Title, Net_Weight_g, Purity. Existing SKUs are updated.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {fileName || "Click to choose a .csv file"}
          </span>
          <span className="text-xs text-muted-foreground">Parsed in your browser</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void readFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="button"
          onClick={() => downloadCsv("nakkashi_sample_template.csv", SAMPLE_CSV)}
          className="inline-flex items-center gap-2 self-start text-sm text-primary underline-offset-4 hover:underline"
        >
          <Download className="h-4 w-4" />
          Download sample template
        </button>

        {(rows.length > 0 || errors.length > 0) && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3 text-sm">
            <p className="text-foreground">{rows.length} valid row(s) ready to import.</p>
            {errors.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={rows.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} items` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
