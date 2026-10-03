/**
 * Single source of truth for all project financial calculations.
 *
 * Every producer (FeasibilityForm, ExecutiveSummaryForm, fetchProjectData / PDF export)
 * MUST consume these functions rather than recomputing locally. Divergent local copies
 * previously produced different TDC / Net Profit values in the UI vs. the exported PDF.
 *
 * Basis rule:
 *   netTdc (= TDC - grants) is used ONLY for netProfit, roi and profitMargin.
 *   Every other metric (allInBasis, capRate, break-even, one-percent rule) uses gross TDC.
 */

export interface BudgetTotals {
  acqBase: number;
  acqContPct: number;
  acqContingency: number;
  acqTotal: number;
  hardBase: number;
  hardContPct: number;
  hardContingency: number;
  hardTotal: number;
  softBase: number;
  softContPct: number;
  softContingency: number;
  softTotal: number;
  holdingBase: number;
  holdingContPct: number;
  holdingContingency: number;
  holdingTotal: number;
  operatingReserves: number;
  purchasePrice: number;
  tdc: number;
}

export interface ProjectFinancials extends BudgetTotals {
  // Capital stack
  landEquity: number;
  cashEquity: number;
  totalEquity: number;
  bankLoan: number;
  privateLender: number;
  totalDebt: number;
  grants: number;
  otherSources: number;
  totalSources: number;
  fundingGap: number;
  percentFunded: number;
  equityPercent: number;
  debtPercent: number;
  subsidyPercent: number;
  equityWithoutSubsidies: number;
  equityWithSubsidies: number;
  // Sale-side
  arv: number;
  salesCostsPct: number;
  salesCosts: number;
  netSaleProceeds: number;
  netTdc: number;
  netProfit: number;
  roi: number;
  roiOnTotalEquity: number;
  profitMargin: number;
  allInBasis: number;
  breakEvenArv: number;
  marginOfSafety: number;
  marginOfSafetyPercent: number;
  seventyMaxPurchase: number;
  /** ARV-dependent rule checks: "na" when no ARV is entered. */
  allInBasisCheck: RuleCheckStatus;
  seventyRuleCheck: RuleCheckStatus;

  // Rental-side
  grossRent: number;
  egi: number;
  opex: number;
  noi: number;
  annualDebtService: number;
  dscr: number;
  capRate: number;
  cashFlow: number;
  cashOnCash: number;
  onePercentRule: number;
  units: number;
  monthlyRentTotal: number;
  vacancyLoss: number;
  managementExpense: number;
  maintenanceExpense: number;
  reservesExpense: number;
  propertyTaxesExpense: number;
  insuranceExpense: number;
  otherExpense: number;
  /** Gross rent multiplier: purchase price / gross annual rent (same as the Feasibility page). */
  grm: number;
  // Per-square-foot
  sqftPlanned: number;
  constructionPerSF: number;
  totalPerSF: number;
  salePerSF: number;
  exitStrategy: string;
}

export type RuleCheckStatus = "pass" | "fail" | "na";
export const NO_ARV_LABEL = "N/A — no ARV entered";

/** 85% rule: TDC ≤ 85% of ARV. N/A when ARV is missing. */
export const allInBasisRule = (arv: number, allInBasis: number): RuleCheckStatus =>
  !(arv > 0) ? "na" : allInBasis <= 85 ? "pass" : "fail";
/** 70% rule: purchase ≤ 70% ARV − rehab. N/A when ARV is missing. */
export const seventyRule = (arv: number, purchasePrice: number, maxPurchase: number): RuleCheckStatus =>
  !(arv > 0) ? "na" : purchasePrice <= maxPurchase ? "pass" : "fail";
export const ruleCheckLabel = (st: RuleCheckStatus, pass = "PASS", fail = "FAIL"): string =>
  st === "na" ? NO_ARV_LABEL : st === "pass" ? pass : fail;

/** "a" / "an" for a following word, by vowel sound (simple heuristic). */
export const indefiniteArticle = (word: string): "a" | "an" => {
  const w = (word || "").trim().toLowerCase();
  if (/^(uni|use|usu|eu|one|once)/.test(w)) return "a";
  if (/^(hour|honest|honor|heir)/.test(w)) return "an";
  return /^[aeiou]/.test(w) ? "an" : "a";
};

/** Round half away from zero so a value and its negation display identically. */
export const roundHalfAway = (v: number): number => Math.sign(v || 0) * Math.round(Math.abs(v || 0));

/** Sums the numeric fields of a budget category plus any custom line items. */
export const sumCategory = (
  obj: Record<string, any> | undefined,
  excludeKeys: string[] = ["contingencyPercent", "customItems"],
): number => {
  const base = Object.entries(obj || {}).reduce((sum, [key, val]) => {
    if (excludeKeys.includes(key) || typeof val !== "number") return sum;
    return sum + val;
  }, 0);
  const customTotal = ((obj || {}).customItems || []).reduce(
    (sum: number, item: any) => sum + (Number(item?.amount) || 0),
    0,
  );
  return base + customTotal;
};

export const computeBudgetTotals = (
  budget: Record<string, any> | undefined,
  scope: Record<string, any> | undefined,
): BudgetTotals => {
  const b = budget || {};
  const acq = b.acquisition || {};
  const hard = b.hardCosts || {};
  const soft = b.softCosts || {};
  const holding = b.holdingCosts || {};

  // New construction on land the developer already owns: no closing/title costs apply
  // (the Budget form hides those fields in that case).
  const isNewConstruction = ((scope || {}).projectType || "") === "new-construction";
  const hideAcqExtras = isNewConstruction && !!acq.ownsProperty;
  const acqBase = (Number(acq.purchasePrice) || 0)
    + (hideAcqExtras ? 0 : (Number(acq.closingCosts) || 0) + (Number(acq.titleRecording) || 0));
  const acqContPct = Number(acq.contingencyPercent) || 0;
  const acqContingency = acqBase * (acqContPct / 100);
  const acqTotal = acqBase + acqContingency;

  const sqftPlanned = Number((scope || {}).sqftPlanned) || 0;
  // Per-square-foot mode replaces itemized construction costs entirely.
  const hardBase = hard.usePerSqftEstimate
    ? (Number(hard.costPerSqft) || 0) * sqftPlanned
    : sumCategory(hard, ["contingencyPercent", "customItems", "usePerSqftEstimate", "costPerSqft"]);
  const hardContPct = Number(hard.contingencyPercent) || 0;
  const hardContingency = hardBase * (hardContPct / 100);
  const hardTotal = hardBase + hardContingency;

  const softBase = sumCategory(soft);
  const softContPct = Number(soft.contingencyPercent) || 0;
  const softContingency = softBase * (softContPct / 100);
  const softTotal = softBase + softContingency;

  const holdingBase = sumCategory(holding);
  const holdingContPct = Number(holding.contingencyPercent) || 0;
  const holdingContingency = holdingBase * (holdingContPct / 100);
  const holdingTotal = holdingBase + holdingContingency;

  const operatingReserves = Number(b.operatingReserves) || 0;
  const tdc = acqTotal + hardTotal + softTotal + holdingTotal + operatingReserves;

  return {
    acqBase, acqContPct, acqContingency, acqTotal,
    hardBase, hardContPct, hardContingency, hardTotal,
    softBase, softContPct, softContingency, softTotal,
    holdingBase, holdingContPct, holdingContingency, holdingTotal,
    operatingReserves,
    purchasePrice: Number(acq.purchasePrice) || 0,
    tdc,
  };
};

export interface FinancialsInput {
  scope?: Record<string, any>;
  budget?: Record<string, any>;
  feasibility?: Record<string, any>;
}

export const computeProjectFinancials = ({ scope, budget, feasibility }: FinancialsInput): ProjectFinancials => {
  const s = scope || {};
  const b = budget || {};
  const f = feasibility || {};
  const acq = b.acquisition || {};
  const cap = b.capitalStack || {};

  const totals = computeBudgetTotals(b, s);
  const tdc = totals.tdc;

  // Land equity only applies to new-construction projects where the developer already
  // owns the land; for acquisition/rehab the purchase price already covers the property.
  const isNewConstruction = (s.projectType || "") === "new-construction";
  const landEquity = isNewConstruction && acq.ownsProperty
    ? Math.max(0, (acq.appraisedLandValue || 0) - (acq.originalPurchasePrice || acq.purchasePrice || 0))
    : 0;
  const cashEquity = cap.developerEquity || 0;
  const totalEquity = cashEquity + landEquity;
  const bankLoan = cap.bankLoan || 0;
  const privateLender = cap.privateLender || 0;
  const grants = (cap.grant1Amount || 0) + (cap.grant2Amount || 0) + (cap.grant3Amount || 0);
  const otherSources = cap.otherSources || 0;
  const totalSources = totalEquity + bankLoan + privateLender + grants + otherSources;
  const fundingGap = tdc - totalSources;
  const totalDebt = bankLoan + privateLender;
  const percentFunded = tdc > 0 ? Math.min((totalSources / tdc) * 100, 100) : 0;
  const equityPercent = tdc > 0 ? (totalEquity / tdc) * 100 : 0;
  const debtPercent = tdc > 0 ? (totalDebt / tdc) * 100 : 0;
  const subsidyPercent = tdc > 0 ? (grants / tdc) * 100 : 0;
  const equityWithoutSubsidies = tdc - totalDebt;
  const equityWithSubsidies = tdc - totalDebt - grants;

  // Sale side
  const arv = f.saleExit?.arv || 0;
  const salesCostsPct = f.saleExit?.salesCostsPercent ?? 8;
  const salesCosts = (arv * salesCostsPct) / 100;
  const netSaleProceeds = arv - salesCosts;
  const netTdc = Math.max(0, tdc - grants);
  const netProfit = netSaleProceeds - netTdc;
  const roi = cashEquity > 0 ? (netProfit / cashEquity) * 100 : 0;
  const roiOnTotalEquity = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  const profitMargin = arv > 0 ? (netProfit / arv) * 100 : 0;
  const allInBasis = arv > 0 ? (tdc / arv) * 100 : 0;
  const breakEvenArv = tdc + salesCosts;
  // Margin of safety is a downside-buffer measure and therefore uses GROSS tdc,
  // per the basis rule (only netProfit / roi / profitMargin use netTdc).
  const marginOfSafety = arv > 0 ? arv - breakEvenArv : 0;
  const marginOfSafetyPercent = arv > 0 ? (marginOfSafety / arv) * 100 : 0;
  const seventyMaxPurchase = arv * 0.7 - totals.hardTotal;
  const allInBasisCheck = allInBasisRule(arv, allInBasis);
  const seventyRuleCheck = seventyRule(arv, totals.purchasePrice, seventyMaxPurchase);

  // Rental side
  const rental = f.rentalExit || {};
  const units = rental.numberOfUnits || 1;
  const monthlyRentTotal = units * (rental.monthlyRentPerUnit || 0);
  const grossRent = monthlyRentTotal * 12;
  const egi = grossRent * (1 - (rental.vacancyRate ?? 8) / 100);
  const mgmt = (egi * (rental.managementPercent ?? 10)) / 100;
  const maint = (egi * (rental.maintenancePercent ?? 5)) / 100;
  const resv = (egi * (rental.reservesPercent ?? 5)) / 100;
  const vacancyLoss = grossRent - egi;
  const propertyTaxesExpense = rental.propertyTaxes || 0;
  const insuranceExpense = rental.insurance || 0;
  const otherExpense = rental.otherExpenses || 0;
  const opex = mgmt + propertyTaxesExpense + insuranceExpense + maint + resv + otherExpense;
  const noi = egi - opex;
  const mr = (rental.interestRate ?? 7.5) / 100 / 12;
  const np = (rental.loanTerm ?? 30) * 12;
  let monthlyDS = 0;
  if ((rental.loanAmount || 0) > 0 && mr > 0) {
    monthlyDS = (rental.loanAmount * (mr * Math.pow(1 + mr, np))) / (Math.pow(1 + mr, np) - 1);
  }
  const annualDebtService = monthlyDS * 12;
  const capRate = tdc > 0 ? (noi / tdc) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
  const cashFlow = noi - annualDebtService;
  const cashOnCash = cashEquity > 0 ? (cashFlow / cashEquity) * 100 : 0;
  const onePercentRule = tdc > 0 ? (monthlyRentTotal / tdc) * 100 : 0;
  const grm = grossRent > 0 ? totals.purchasePrice / grossRent : 0;

  const sqftPlanned = Number(s.sqftPlanned) || Number(s.sqftExisting) || 0;
  const constructionPerSF = sqftPlanned > 0 ? totals.hardTotal / sqftPlanned : 0;
  const totalPerSF = sqftPlanned > 0 ? tdc / sqftPlanned : 0;
  const salePerSF = sqftPlanned > 0 && arv > 0 ? arv / sqftPlanned : 0;

  return {
    ...totals,
    landEquity, cashEquity, totalEquity, bankLoan, privateLender, totalDebt, grants, otherSources,
    totalSources, fundingGap, percentFunded, equityPercent, debtPercent, subsidyPercent,
    equityWithoutSubsidies, equityWithSubsidies,
    arv, salesCostsPct, salesCosts, netSaleProceeds, netTdc, netProfit, roi, roiOnTotalEquity,
    profitMargin, allInBasis, breakEvenArv, marginOfSafety, marginOfSafetyPercent, seventyMaxPurchase,
    allInBasisCheck, seventyRuleCheck,
    grossRent, egi, opex, noi, annualDebtService, dscr, capRate, cashFlow, cashOnCash, onePercentRule,
    units, monthlyRentTotal, vacancyLoss, managementExpense: mgmt, maintenanceExpense: maint,
    reservesExpense: resv, propertyTaxesExpense, insuranceExpense, otherExpense, grm,
    sqftPlanned, constructionPerSF, totalPerSF, salePerSF,
    exitStrategy: f.exitStrategy?.strategy || "sell",
  };
};

/** A single sensitivity scenario, computed on the same netTdc basis as netProfit / roi. */
export interface SensitivityScenario {
  label: string;
  arvMod: number;
  costMod: number;
  arv: number;
  cost: number;
  profit: number;
  return: number;
}

export const DEFAULT_SENSITIVITY_MODS: { label: string; arvMod: number; costMod: number }[] = [
  { label: "Best Case (+10%)", arvMod: 10, costMod: -10 },
  { label: "Base Case", arvMod: 0, costMod: 0 },
  { label: "Conservative (-10%)", arvMod: -10, costMod: 10 },
  { label: "Stress Test (-20%)", arvMod: -20, costMod: 20 },
];

/**
 * Sensitivity scenarios derived from the shared engine. The cost basis is netTdc
 * (TDC less grants) so the Base Case row is identical to the headline netProfit / roi.
 */
export const computeSensitivityScenarios = (
  fin: Pick<ProjectFinancials, "arv" | "netTdc" | "salesCostsPct" | "cashEquity">,
  mods: { label: string; arvMod: number; costMod: number }[] = DEFAULT_SENSITIVITY_MODS,
): SensitivityScenario[] =>
  mods.map((m) => {
    const adjArv = fin.arv * (1 + m.arvMod / 100);
    const adjCost = fin.netTdc * (1 + m.costMod / 100);
    const salesCosts = (adjArv * fin.salesCostsPct) / 100;
    const profit = adjArv - salesCosts - adjCost;
    return {
      ...m,
      arv: adjArv,
      cost: adjCost,
      profit,
      return: fin.cashEquity > 0 ? (profit / fin.cashEquity) * 100 : 0,
    };
  });

/** Round a currency value to whole dollars so AI context values match on-screen formatting. */
export const roundCurrency = (value: number): number => roundHalfAway(value);


/** One year of the rental projection. Year 1 is the engine output verbatim. */
export interface RentalProjectionYear {
  year: number;
  grossRent: number; vacancyLoss: number; egi: number;
  managementExpense: number; propertyTaxesExpense: number; insuranceExpense: number;
  maintenanceExpense: number; reservesExpense: number; otherExpense: number;
  opex: number; opexRatio: number; noi: number;
  annualDebtService: number; cashFlow: number; monthlyCashFlow: number;
  capRate: number; cashOnCash: number; dscr: number; grm: number;
}

/**
 * Multi-year rental projection built on computeProjectFinancials.
 * Year 1 equals the engine (and therefore the Feasibility page) exactly. Later years grow
 * rent — and the percentage-of-EGI expenses (management, maintenance, reserves) with it —
 * by `rentGrowth`; fixed expenses (taxes, insurance, other) and debt service stay flat.
 */
export const computeRentalProjection = (
  fin: ProjectFinancials,
  years = 3,
  rentGrowth = 0.03,
): RentalProjectionYear[] =>
  Array.from({ length: years }, (_, i) => {
    const g = Math.pow(1 + rentGrowth, i);
    const grossRent = fin.grossRent * g;
    const vacancyLoss = fin.vacancyLoss * g;
    const egi = fin.egi * g;
    const managementExpense = fin.managementExpense * g;
    const maintenanceExpense = fin.maintenanceExpense * g;
    const reservesExpense = fin.reservesExpense * g;
    const opex = i === 0 ? fin.opex
      : managementExpense + fin.propertyTaxesExpense + fin.insuranceExpense + maintenanceExpense + reservesExpense + fin.otherExpense;
    const noi = i === 0 ? fin.noi : egi - opex;
    const cashFlow = i === 0 ? fin.cashFlow : noi - fin.annualDebtService;
    return {
      year: i + 1,
      grossRent, vacancyLoss, egi,
      managementExpense, propertyTaxesExpense: fin.propertyTaxesExpense, insuranceExpense: fin.insuranceExpense,
      maintenanceExpense, reservesExpense, otherExpense: fin.otherExpense,
      opex, opexRatio: egi > 0 ? (opex / egi) * 100 : 0, noi,
      annualDebtService: fin.annualDebtService, cashFlow, monthlyCashFlow: cashFlow / 12,
      capRate: i === 0 ? fin.capRate : fin.tdc > 0 ? (noi / fin.tdc) * 100 : 0,
      cashOnCash: i === 0 ? fin.cashOnCash : fin.cashEquity > 0 ? (cashFlow / fin.cashEquity) * 100 : 0,
      dscr: i === 0 ? fin.dscr : fin.annualDebtService > 0 ? noi / fin.annualDebtService : 0,
      grm: i === 0 ? fin.grm : grossRent > 0 ? fin.purchasePrice / grossRent : 0,
    };
  });
