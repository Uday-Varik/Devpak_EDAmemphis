export interface CensusData {
  zipCode: string;
  population: number;
  medianHouseholdIncome: number;
  medianHomeValue: number;
  medianGrossRent: number;
  totalHousingUnits: number;
  ownerOccupied: number;
  renterOccupied: number;
  ownershipRate: number;
  medianAge: number;
}

export interface CensusFetchResult {
  data: CensusData | null;
  error: string | null;
}

const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const CENSUS_API_KEY = "3e99f643654a59f4fccd4b7e510f42d27e610c2f";

const VARIABLES = [
  "NAME",
  "B01003_001E", // Total Population
  "B19013_001E", // Median Household Income
  "B25077_001E", // Median Home Value
  "B25064_001E", // Median Gross Rent
  "B25003_001E", // Total Housing Units (occupied)
  "B25003_002E", // Owner-Occupied
  "B25003_003E", // Renter-Occupied
  "B01002_001E", // Median Age
];

const GENERIC_ERROR =
  "Census data could not be loaded for this ZIP code. Please check the ZIP and try again.";

function parseNum(val: string | null | undefined): number {
  if (!val || val === "null" || val === "-666666666") return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export async function fetchCensusData(zipCode: string): Promise<CensusFetchResult> {
  const cleanZip = zipCode.replace(/\D/g, "").slice(0, 5);
  if (cleanZip.length !== 5) {
    return { data: null, error: "Invalid ZIP code. Enter a 5-digit ZIP." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${CENSUS_BASE}?get=${VARIABLES.join(",")}&for=zip%20code%20tabulation%20area:${cleanZip}&key=${CENSUS_API_KEY}`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.warn("Census API returned", res.status);
      return { data: null, error: GENERIC_ERROR };
    }

    // Some upstream failures (e.g. missing API key) redirect to an HTML page
    // that parses as text — guard against that before assuming JSON.
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();
    if (!contentType.includes("json") || !raw.trim().startsWith("[")) {
      console.warn("Census API returned non-JSON response", raw.slice(0, 200));
      return { data: null, error: GENERIC_ERROR };
    }

    let json: string[][];
    try {
      json = JSON.parse(raw);
    } catch {
      return { data: null, error: GENERIC_ERROR };
    }
    if (!json || json.length < 2) {
      return { data: null, error: GENERIC_ERROR };
    }

    const headers = json[0];
    const values = json[1];

    const idx = (name: string) => {
      const i = headers.indexOf(name);
      return i >= 0 ? values[i] : null;
    };

    const totalUnits = parseNum(idx("B25003_001E"));
    const ownerOcc = parseNum(idx("B25003_002E"));

    return {
      data: {
        zipCode: cleanZip,
        population: parseNum(idx("B01003_001E")),
        medianHouseholdIncome: parseNum(idx("B19013_001E")),
        medianHomeValue: parseNum(idx("B25077_001E")),
        medianGrossRent: parseNum(idx("B25064_001E")),
        totalHousingUnits: totalUnits,
        ownerOccupied: ownerOcc,
        renterOccupied: parseNum(idx("B25003_003E")),
        ownershipRate: totalUnits > 0 ? Math.round((ownerOcc / totalUnits) * 1000) / 10 : 0,
        medianAge: parseNum(idx("B01002_001E")),
      },
      error: null,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("Census API request timed out");
      return { data: null, error: "Census API timed out. Please try again." };
    }
    console.warn("Census API error:", err);
    return { data: null, error: GENERIC_ERROR };
  } finally {
    clearTimeout(timeout);
  }
}
