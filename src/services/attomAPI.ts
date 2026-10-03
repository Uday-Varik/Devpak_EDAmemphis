// ATTOM comps via the `attom-comps` edge function. The ATTOM key lives only on the server.
import { supabase } from "@/integrations/supabase/client";
import type { PropertySale } from "./dataMidsouthAPI";

export interface AttomCompResult {
  source: "attom";
  sales: PropertySale[];
  compsReturned: number;
  compsAfterFiltering: number;
  excluded: number;
  estimate: number | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  estimateSource: "attom_avm" | "median_comp";
  rangeDiscarded: boolean;
  searchNote?: string;
  distanceUnavailable?: boolean;
  cached?: boolean;
}

export const COMP_INPUT_ERROR = "Add a ZIP code or state in Site & Location to search comps";

/** Block the call before spending a trial request. */
export function validateCompInput(a: { street?: string; state?: string; zip?: string }): string | null {
  if (!a.street?.trim()) return COMP_INPUT_ERROR;
  if (!a.zip?.trim() && !a.state?.trim()) return COMP_INPUT_ERROR;
  return null;
}

/** Returns ATTOM results, or null when the caller should fall back to Data Midsouth. */
export async function fetchAttomComps(input: {
  street: string; city?: string; state?: string; zip?: string; lat?: number; lng?: number; subjectSqft?: number;
}): Promise<AttomCompResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("attom-comps", { body: input });
    if (error || !data || data.fallback || !Array.isArray(data.sales) || data.sales.length === 0) return null;
    return data as AttomCompResult;
  } catch {
    return null;
  }
}

export async function logFallbackLookup(input: {
  street: string; state?: string; zip?: string; found: boolean; compsReturned: number; compsAfterFiltering: number;
}) {
  try {
    await supabase.functions.invoke("attom-comps", { body: { mode: "log", ...input } });
  } catch { /* instrumentation only */ }
}
