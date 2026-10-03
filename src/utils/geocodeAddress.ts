import { supabase } from "@/integrations/supabase/client";

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

/**
 * Geocode a one-line address with the Census geocoder (server-side, via the
 * attom-comps "geocode" mode) and return Site & Location fields.
 * Falls back to putting the raw text in streetAddress if no match is found.
 */
export const geocodeToSiteFields = async (address: string) => {
  const fallback = { streetAddress: address, city: "", state: "", zipCode: "" };
  const { data, error } = await supabase.functions.invoke("attom-comps", {
    body: { mode: "geocode", street: address, city: "", state: "", zip: "" },
  });
  const matched: string = data?.match?.matchedAddress || "";
  if (error || !matched) return fallback;
  // Census format: "1847 ROZELLE ST, MEMPHIS, TN, 38106"
  const parts = matched.split(",").map((p) => p.trim());
  if (parts.length < 4) return fallback;
  const [street, city, state, zip] = parts;
  return {
    streetAddress: titleCase(street),
    city: titleCase(city),
    state: state.toUpperCase(),
    zipCode: data.match.zip || zip,
  };
};
