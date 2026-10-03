// Single source of truth for resilience factor keys and scoring.
// Every surface (builder form, executive summary, readiness checklist, PDF)
// must read from here so the percentage and the category breakdown agree.

export const FINANCIAL_FACTORS = [
  { key: "contingency15", label: "Contingency budget of 15% or more" },
  { key: "operatingReserves", label: "Operating reserves funded (3–6 months)" },
  { key: "multipleFunding", label: "Multiple funding sources secured" },
  { key: "fixedRateFinancing", label: "Fixed-rate financing locked" },
  { key: "subsidyApproved", label: "Subsidy or grant funding approved" },
  { key: "positiveCashFlow", label: "Positive cash flow from month one (rental projects)" },
  { key: "conservativeProjections", label: "Conservative ARV/rent projections used" },
] as const;

export const PROJECT_FACTORS = [
  { key: "experiencedGC", label: "Experienced general contractor engaged" },
  { key: "fixedPriceContract", label: "Fixed-price construction contract" },
  { key: "timelineBuffer", label: "Construction timeline has buffer built in" },
  { key: "permitsObtained", label: "All permits obtained or in progress" },
  { key: "environmentalAddressed", label: "Environmental issues addressed" },
  { key: "titleClear", label: "Title clear with title insurance" },
  { key: "propertyInsured", label: "Property insurance secured" },
] as const;

export const MARKET_FACTORS = [
  { key: "strongComps", label: "Strong comparable sales/rentals support projections" },
  { key: "multipleExitStrategies", label: "Multiple exit strategies available (sell or rent)" },
  { key: "growingNeighborhood", label: "Location in growing/stable neighborhood" },
  { key: "belowMarketAcquisition", label: "Below-market acquisition price" },
  { key: "housingNeed", label: "Project fills identified housing need" },
  { key: "opportunityZone", label: "Opportunity Zone or incentive district benefits" },
] as const;

// Legacy key aliases from earlier data shapes, mapped to the canonical key.
const LEGACY_ALIASES: Record<string, string> = {
  contingencyBudget: "contingency15",
  fixedRate: "fixedRateFinancing",
  environmentalCleared: "environmentalAddressed",
  multipleExits: "multipleExitStrategies",
};

export const TOTAL_RESILIENCE_FACTORS =
  FINANCIAL_FACTORS.length + PROJECT_FACTORS.length + MARKET_FACTORS.length; // 20

export interface ResilienceScores {
  financial: number;
  project: number;
  market: number;
  total: number;
  totalPossible: number;
  percent: number;
  label: "Strong" | "Moderate" | "Needs Attention";
}

export const normalizeResilience = (raw: Record<string, any> | null | undefined) => {
  const data: Record<string, any> = { ...(raw || {}) };
  Object.entries(LEGACY_ALIASES).forEach(([legacy, canonical]) => {
    if (data[canonical] === undefined && data[legacy] !== undefined) {
      data[canonical] = data[legacy];
    }
  });
  return data;
};

export const computeResilience = (
  raw: Record<string, any> | null | undefined
): ResilienceScores => {
  const data = normalizeResilience(raw);
  const count = (factors: readonly { key: string }[]) =>
    factors.filter((f) => data[f.key] === true).length;

  const financial = count(FINANCIAL_FACTORS);
  const project = count(PROJECT_FACTORS);
  const market = count(MARKET_FACTORS);
  const total = financial + project + market;
  const percent = Math.round((total / TOTAL_RESILIENCE_FACTORS) * 100);

  return {
    financial,
    project,
    market,
    total,
    totalPossible: TOTAL_RESILIENCE_FACTORS,
    percent,
    label: percent >= 70 ? "Strong" : percent >= 40 ? "Moderate" : "Needs Attention",
  };
};
