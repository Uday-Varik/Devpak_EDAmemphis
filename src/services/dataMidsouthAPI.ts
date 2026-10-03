export interface PropertySale {
  transactionId: string;
  address: string;
  salePrice: number;
  recordDate: string;
  transactionType: string;
  propertyType: string;
  yearBuilt: string;
  acres: number;
  livingUnits: number;
  subdivision: string;
  parcelId: string;
  distanceMiles?: number;
  // Populated by ATTOM; Data Midsouth leaves these undefined
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface ApiRecord {
  transaction_id: string;
  property_address: string;
  val_consideration: number | null;
  record_date: string;
  transaction_type_desc: string;
  prop_lucdesc: string;
  year_built: string;
  acres: number;
  living_units: number;
  subdivision: string;
  par_id: string;
  geopoint: { lon: number; lat: number } | null;
  [key: string]: unknown;
}

interface ApiResponse {
  total_count: number;
  results: ApiRecord[];
}

const BASE_URL =
  "https://datamidsouth.opendatasoft.com/api/explore/v2.1/catalog/datasets/shelby-county-register-of-deeds-property-transactions/records";

const MAX_RESULTS = 10;

function buildDateClause(monthsBack: number): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  return `record_date >= date'${cutoff.toISOString().split("T")[0]}'`;
}

function mapRecord(r: ApiRecord): PropertySale {
  return {
    transactionId: r.transaction_id || "",
    address: r.property_address || "",
    salePrice: r.val_consideration || 0,
    recordDate: r.record_date || "",
    transactionType: r.transaction_type_desc || "",
    propertyType: r.prop_lucdesc || "",
    yearBuilt: r.year_built || "",
    acres: r.acres || 0,
    livingUnits: r.living_units || 0,
    subdivision: r.subdivision || "",
    parcelId: r.par_id || "",
  };
}

// Haversine distance in miles between two lat/lng points
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchRecords(
  whereClause: string,
  limit: number,
  orderBy = "record_date DESC"
): Promise<ApiResponse> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    where: whereClause,
    order_by: orderBy,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${BASE_URL}?${searchParams}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function extractZip(address: string): string {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : "";
}

/**
 * Search for nearby comparable sales.
 *
 * Priority:
 *   1. Geographic proximity (within_distance) when lat/lng provided — sorted by distance
 *   2. Strict ZIP-code-only fallback (exact suffix match) — sorted by record_date DESC
 *
 * Always returns up to MAX_RESULTS (10) records.
 */
export async function searchNearbySales(params: {
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  monthsBack?: number;
  zipCode?: string;
  limit?: number;
  sortBy?: "distance" | "date";
}): Promise<{ sales: PropertySale[]; totalCount: number; searchNote?: string }> {
  const limit = Math.min(params.limit || MAX_RESULTS, MAX_RESULTS);
  const monthsBack = params.monthsBack || 24;
  const dateClause = buildDateClause(monthsBack);
  const baseFilter = `val_consideration > 0 AND ${dateClause}`;

  // ---- Strategy 1: Geographic proximity ----
  if (params.latitude && params.longitude) {
    const radius = params.radiusMiles || 1;
    // Fetch a larger pool so we can sort client-side by exact distance,
    // then trim to MAX_RESULTS.
    const geoClause = `${baseFilter} AND within_distance(geopoint, geom'POINT(${params.longitude} ${params.latitude})', ${radius}mi)`;
    try {
      const data = await fetchRecords(geoClause, 50, "record_date DESC");
      if (data.results.length > 0) {
        const withDistance: PropertySale[] = data.results.map((r) => {
          const mapped = mapRecord(r);
          if (r.geopoint && typeof r.geopoint.lat === "number" && typeof r.geopoint.lon === "number") {
            mapped.distanceMiles = haversineMiles(
              params.latitude!,
              params.longitude!,
              r.geopoint.lat,
              r.geopoint.lon
            );
          }
          return mapped;
        });

        const sortBy = params.sortBy || "distance";
        const sorted = [...withDistance].sort((a, b) => {
          if (sortBy === "distance") {
            const ad = a.distanceMiles ?? Infinity;
            const bd = b.distanceMiles ?? Infinity;
            if (ad !== bd) return ad - bd;
            return (b.recordDate || "").localeCompare(a.recordDate || "");
          }
          return (b.recordDate || "").localeCompare(a.recordDate || "");
        });

        return {
          sales: sorted.slice(0, limit),
          totalCount: data.total_count,
          searchNote: `Within ${radius} mile${radius === 1 ? "" : "s"} of project address`,
        };
      }
    } catch (e) {
      console.warn("Geo search failed, falling back to ZIP code", e);
    }
  }

  // ---- Strategy 2: Strict ZIP code match ----
  // Only the project's own ZIP. Match the 5-digit ZIP at the END of the
  // address (or at end of address followed by nothing) using regex anchor
  // to avoid pulling in addresses that merely contain those digits.
  const zip = params.zipCode || extractZip(params.address || "");
  if (zip && /^\d{5}$/.test(zip)) {
    // Opendatasoft `like` uses * wildcards; force the ZIP to appear as the
    // trailing 5 digits of the address (preceded by space/comma).
    // e.g. "1847 ROZELLE ST MEMPHIS TN 38104"
    const clause = `${baseFilter} AND (property_address like '* ${zip}' OR property_address like '*,${zip}' OR property_address like '*,  ${zip}')`;
    try {
      const data = await fetchRecords(clause, limit, "record_date DESC");
      if (data.results.length > 0) {
        return {
          sales: data.results.map(mapRecord),
          totalCount: data.total_count,
          searchNote: `ZIP code ${zip} (no coordinates available for distance search)`,
        };
      }
    } catch (e) {
      console.warn("ZIP search failed", e);
    }
  }

  return { sales: [], totalCount: 0 };
}
