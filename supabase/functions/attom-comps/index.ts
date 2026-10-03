// Edge function: attom-comps
// Auth-validated server-side proxy to ATTOM. The ATTOM key never leaves the server.
// Field names are based on a live inspection of ATTOM /sale/snapshot and /attomavm/detail.
// Notes from that inspection:
// - location.distance is always 0 on sale/snapshot, so distance is computed from lat/long.
// - saletranstype mixes non-sales (e.g. "Construction Loan/Financing") and salecode is often empty,
//   so we deliberately DO NOT filter on either one.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BASE = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";
const CACHE_MS = 24 * 60 * 60 * 1000;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8, r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

interface Comp {
  transactionId: string; address: string; salePrice: number; recordDate: string; transactionType: string;
  propertyType: string; yearBuilt: string; acres: number; livingUnits: number; subdivision: string; parcelId: string;
  distanceMiles?: number; sqft: number; bedrooms: number; bathrooms: number; landUse: string;
}

// deno-lint-ignore no-explicit-any
function mapSale(p: any, subj: { lat?: number; lng?: number }): Comp {
  const lat = Number(p?.location?.latitude), lng = Number(p?.location?.longitude);
  const hasGeo = subj.lat && subj.lng && Number.isFinite(lat) && Number.isFinite(lng);
  return {
    transactionId: String(p?.identifier?.attomId ?? p?.identifier?.Id ?? "") + ":" + (p?.sale?.saleTransDate ?? ""),
    address: p?.address?.oneLine || [p?.address?.line1, p?.address?.line2].filter(Boolean).join(", "),
    salePrice: num(p?.sale?.amount?.saleamt),
    recordDate: p?.sale?.saleTransDate || p?.sale?.amount?.salerecdate || p?.sale?.salesearchdate || "",
    transactionType: p?.sale?.amount?.saletranstype || "Sale",
    propertyType: p?.summary?.propclass || p?.summary?.propertyType || "",
    landUse: [p?.summary?.proptype, p?.summary?.propsubtype, p?.summary?.propLandUse].filter(Boolean).join(" "),
    yearBuilt: p?.summary?.yearbuilt ? String(p.summary.yearbuilt) : "",
    acres: num(p?.lot?.lotSize1),
    livingUnits: 1,
    subdivision: "",
    parcelId: p?.identifier?.apn || "",
    distanceMiles: hasGeo ? haversine(subj.lat!, subj.lng!, lat, lng) : undefined,
    sqft: num(p?.building?.size?.universalsize ?? p?.building?.size?.livingsize),
    bedrooms: num(p?.building?.rooms?.beds),
    bathrooms: num(p?.building?.rooms?.bathstotal),
  };
}

// Observed saletranstype values in 38104 (762 records): Resale, Construction Loan/Financing,
// Nominal/Quit Claim, REO (Real Estate-Owned), New Construction, (empty).
// Drop records that explicitly declare themselves non-sales; keep sales and empty values.
// REO/bank-owned sales are excluded separately: they are distressed transactions that sell
// below renovated market value, so they bias the average $/SF downward. DevPack comps
// support ARV and disposition value, so only arm's-length market sales qualify.
// Kept: Resale, New Construction, and empty transaction types.
const NON_SALE_RE = /loan|financ|refi|nominal|quit\s*claim|non[-\s]?arm|intrafamily|intra-family|transfer/i;
const REO_RE = /\breo\b|real[-\s]?estate[-\s]?owned|bank[-\s]?owned/i;
const LAND_RE = /vacant|\bland\b|\blots?\b/i;

export type SqftWindow = "25" | "40" | "none" | "unknown_subject";

function filterComps(all: Comp[], subjectSqft: number) {
  const counts = { nonSale: 0, reo: 0, land: 0, bulkPortfolio: 0, noSqft: 0, priceOutlier: 0, sizeMismatch: 0, noPrice: 0 };
  let rest = all.filter((c) => c.salePrice > 0);
  counts.noPrice = all.length - rest.length;
  // Non-sale transactions (loan amounts are not sale prices)
  let n = rest.length;
  rest = rest.filter((c) => !c.transactionType || !NON_SALE_RE.test(c.transactionType));
  counts.nonSale = n - rest.length;
  // REO / bank-owned distressed sales (bias $/SF below renovated market value)
  n = rest.length;
  rest = rest.filter((c) => !c.transactionType || !REO_RE.test(c.transactionType));
  counts.reo = n - rest.length;
  // Vacant land / lots by property type
  n = rest.length;
  rest = rest.filter((c) => !LAND_RE.test(`${c.propertyType} ${c.landUse}`));
  counts.land = n - rest.length;
  // Bulk portfolio clusters: 3+ comps sharing identical price AND date
  const groups = new Map<string, number>();
  for (const c of rest) groups.set(`${c.salePrice}|${c.recordDate}`, (groups.get(`${c.salePrice}|${c.recordDate}`) || 0) + 1);
  n = rest.length;
  rest = rest.filter((c) => (groups.get(`${c.salePrice}|${c.recordDate}`) || 0) < 3);
  counts.bulkPortfolio = n - rest.length;
  // Secondary land catch: zero sqft
  n = rest.length;
  rest = rest.filter((c) => c.sqft > 0);
  counts.noSqft = n - rest.length;
  // Outliers: $/SF bounds (1/3x–3x median $/SF) where sqft is known; raw-price bounds otherwise
  const medPsf = median(rest.filter((c) => c.sqft > 0).map((c) => c.salePrice / c.sqft));
  const med = median(rest.map((c) => c.salePrice));
  n = rest.length;
  rest = rest.filter((c) => {
    if (c.sqft > 0 && medPsf > 0) { const psf = c.salePrice / c.sqft; return psf <= medPsf * 3 && psf >= medPsf / 3; }
    return !(med > 0) || (c.salePrice <= med * 3 && c.salePrice >= med / 3);
  });
  counts.priceOutlier = n - rest.length;
  // Sqft window with a 3-comp floor: ±25% -> ±40% -> skip
  let sqftWindow: SqftWindow = "unknown_subject";
  if (subjectSqft > 0) {
    const within = (pct: number) => rest.filter((c) => c.sqft >= subjectSqft * (1 - pct) && c.sqft <= subjectSqft * (1 + pct));
    const w25 = within(0.25);
    if (w25.length >= 3) { sqftWindow = "25"; counts.sizeMismatch = rest.length - w25.length; rest = w25; }
    else {
      const w40 = within(0.4);
      if (w40.length >= 3) { sqftWindow = "40"; counts.sizeMismatch = rest.length - w40.length; rest = w40; }
      else sqftWindow = "none";
    }
  }
  return { comps: rest, excluded: all.length - rest.length, counts, sqftWindow };
}

async function attomGet(key: string, path: string, params: Record<string, string>) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
      headers: { apikey: key, Accept: "application/json" }, signal: ctrl.signal,
    });
    const text = await r.text();
    // deno-lint-ignore no-explicit-any
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* non-JSON (e.g. suspended account HTML) */ }
    return { status: r.status, body };
  } finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

    const street = str(body.street), city = str(body.city, 80), state = str(body.state, 20), zip = str(body.zip, 10);
    const lat = num(body.lat) || undefined, lng = num(body.lng) || undefined;
    const subjectSqft = Math.max(0, num(body.subjectSqft));

    // Instrumentation: awaited with ~2s timeout so the row isn't lost when the function exits.
    const logLookup = async (row: { found: boolean; source: string; comps_returned: number; comps_after_filtering: number }) => {
      try {
        await Promise.race([
          admin.from("comp_lookups").insert({ user_id: user.id, address: street, state, zip, ...row }),
          new Promise((res) => setTimeout(res, 2000)),
        ]);
      } catch (e) { console.error("comp_lookups insert failed", e); }
    };

    // Client reports the Data Midsouth fallback outcome so every lookup gets a row.
    if (body.mode === "log") {
      await logLookup({
        found: !!body.found, source: "datamidsouth",
        comps_returned: Math.max(0, Math.floor(num(body.compsReturned))),
        comps_after_filtering: Math.max(0, Math.floor(num(body.compsAfterFiltering))),
      });
      return json({ ok: true });
    }

    const geocode = async () => {
      try {
        const oneLine = [street, city, state, zip].filter(Boolean).join(", ");
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
        const g = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(oneLine)}&benchmark=Public_AR_Current&format=json`, { signal: ctrl.signal });
        clearTimeout(t);
        const m = (await g.json())?.result?.addressMatches?.[0];
        const c = m?.coordinates;
        if (c && Number.isFinite(Number(c.y)) && Number.isFinite(Number(c.x))) {
          return { lat: Number(c.y), lng: Number(c.x), zip: String(m?.addressComponents?.zip || ""), matchedAddress: String(m?.matchedAddress || "") };
        }
      } catch (e) { console.warn("Census geocode failed", e); }
      return null;
    };

    // Site & Location ZIP check: geocode only (no ATTOM call)
    if (body.mode === "geocode") {
      if (!street) return json({ error: "street required" }, 400);
      return json({ match: await geocode() });
    }

    if (!street || (!zip && !state)) {
      return json({ error: "Add a ZIP code or state in Site & Location to search comps" }, 400);
    }

    const cacheKey = ["v6", street, city, state, zip, subjectSqft || ""].join("|").toLowerCase().replace(/[^a-z0-9|]+/g, " ").replace(/\s+/g, " ").trim();
    const { data: cached } = await admin.from("comp_cache").select("payload, created_at").eq("cache_key", cacheKey).maybeSingle();
    if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_MS) {
      const p = cached.payload as Record<string, unknown>;
      await logLookup({ found: true, source: "attom", comps_returned: num(p.compsReturned), comps_after_filtering: num(p.compsAfterFiltering) });
      return json({ ...p, cached: true });
    }

    const key = Deno.env.get("ATTOM_API_KEY");
    const fallback = (reason: string) => json({ fallback: true, reason });
    if (!key) return fallback("not_configured");

    // Subject coordinates: Site & Location lat/long, else US Census Geocoder (cached with payload)
    let sLat = lat, sLng = lng, coordSource: "site" | "census" | null = lat && lng ? "site" : null;
    if (!coordSource) {
      const g = await geocode();
      if (g) { sLat = g.lat; sLng = g.lng; coordSource = "census"; }
    }

    const since = new Date(); since.setMonth(since.getMonth() - 24);
    const sinceStr = since.toISOString().slice(0, 10).replace(/-/g, "/");
    const base: Record<string, string> = { pagesize: "2000", startsalesearchdate: sinceStr, orderby: "salesearchdate desc" };
    if (!coordSource && !zip) return fallback("no_zip_or_coordinates");

    const addr2 = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const avmP = attomGet(key, "/attomavm/detail", { address1: street, address2: addr2 }).catch(() => ({ status: 0, body: null }));

    // Radius search 1 -> 2 -> 3 mi until >=3 comps survive filtering; ZIP search only if geocoding failed
    const radii = coordSource ? [1, 2, 3] : [0];
    // deno-lint-ignore no-explicit-any
    let mapped: Comp[] = [], result: any = null, radiusUsed = 0;
    for (const r of radii) {
      const params = r ? { ...base, latitude: String(sLat), longitude: String(sLng), radius: String(r) } : { ...base, postalcode: zip };
      const sales = await attomGet(key, "/sale/snapshot", params);
      if (sales.status === 401 || sales.status === 403 || !sales.body) {
        console.warn("ATTOM unavailable", sales.status);
        if (result) break;
        return fallback(`attom_status_${sales.status}`);
      }
      const raw = Array.isArray(sales.body.property) ? sales.body.property : [];
      mapped = raw.map((p: unknown) => mapSale(p, { lat: sLat, lng: sLng }));
      result = filterComps(mapped, subjectSqft);
      radiusUsed = r;
      if (result.comps.length >= 3) break;
    }
    if (!mapped.length) return fallback("no_results");
    const { comps, excluded, counts, sqftWindow } = result as ReturnType<typeof filterComps>;
    comps.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity) || b.recordDate.localeCompare(a.recordDate));
    const avm = await avmP;

    // Estimate: AVM value if present, else median comp price (null/0 != no data)
    const amt = avm.body?.property?.[0]?.avm?.amount;
    let estimate = num(amt?.value);
    let low: number | null = num(amt?.low) || null;
    let high: number | null = num(amt?.high) || null;
    let estimateSource: "attom_avm" | "median_comp" = "attom_avm";
    if (!estimate) {
      estimate = Math.round(median(comps.map((c) => c.salePrice)));
      estimateSource = "median_comp";
      low = high = null;
    }
    // Range sanity: discard inverted/invalid ranges
    let rangeDiscarded = false;
    if (low != null && high != null && (low > estimate || high < estimate)) {
      low = high = null; rangeDiscarded = true;
    }

    const payload = {
      source: "attom",
      sales: comps.slice(0, 10),
      compsReturned: mapped.length,
      compsAfterFiltering: comps.length,
      radiusMiles: radiusUsed || null, excluded, excludedBreakdown: counts, sqftWindow, subjectSqft: subjectSqft || null,
      subjectLat: sLat ?? null, subjectLng: sLng ?? null, coordSource, distanceUnavailable: !coordSource,
      estimate: estimate || null, estimateLow: low, estimateHigh: high, estimateSource, rangeDiscarded,
      searchNote: (radiusUsed ? `Within ${radiusUsed} mile${radiusUsed > 1 ? "s" : ""} of the property${radiusUsed > 1 ? " (widened: fewer than 3 comps closer in)" : ""}` : `ZIP code ${zip} (address could not be located, so searched by ZIP)`) +
        (sqftWindow === "25" ? ` · size within ±25% of ${subjectSqft.toLocaleString()} SF`
          : sqftWindow === "40" ? ` · size widened to ±40% of ${subjectSqft.toLocaleString()} SF (fewer than 3 comps at ±25%)`
          : sqftWindow === "none" ? " · size filter skipped (fewer than 3 comps even at ±40%)"
          : " · no size filter (planned square footage not set)"),
    };

    await logLookup({ found: comps.length > 0, source: "attom", comps_returned: mapped.length, comps_after_filtering: comps.length });
    if (comps.length === 0) return json({ ...payload, fallback: true, reason: "all_filtered" });
    await admin.from("comp_cache").upsert({ cache_key: cacheKey, payload, created_at: new Date().toISOString() });
    return json(payload);
  } catch (e) {
    console.error("attom-comps error", e);
    return json({ fallback: true, reason: "error" });
  }
});
