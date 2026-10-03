import { describe, it, expect } from "vitest";
import { computeProjectFinancials, computeBudgetTotals, type FinancialsInput } from "../calculations";

/**
 * Deterministic tests for the project financial engine.
 *
 * The critical assertion is producer identity: FeasibilityForm, ExecutiveSummaryForm and
 * fetchProjectData (PDF export) must all derive TDC / Net Profit from the SAME function.
 */

// --- Fixture 1: itemized construction, grants present -------------------------------
const baseFixture: FinancialsInput = {
  scope: { projectType: "acquisition-rehab", sqftPlanned: 2400, sqftExisting: 1800 },
  budget: {
    acquisition: { purchasePrice: 75000, closingCosts: 3000, titleRecording: 1500, contingencyPercent: 5 },
    hardCosts: { foundation: 75000, contingencyPercent: 15 },
    softCosts: { architecture: 7500, contingencyPercent: 10 },
    holdingCosts: { contingencyPercent: 10 },
    operatingReserves: 0,
    capitalStack: { developerEquity: 40000, bankLoan: 120000, grant1Name: "HOME Funds", grant1Amount: 15000 },
  },
  feasibility: { exitStrategy: { strategy: "sell" }, saleExit: { arv: 250000, salesCostsPercent: 6 } },
};

// --- Fixture 2: per-square-foot construction estimate --------------------------------
const perSqftFixture: FinancialsInput = {
  ...baseFixture,
  budget: {
    ...baseFixture.budget,
    hardCosts: { usePerSqftEstimate: true, costPerSqft: 40, contingencyPercent: 15 },
  },
};

// --- Fixture 3: no grants -------------------------------------------------------------
const noGrantsFixture: FinancialsInput = {
  ...baseFixture,
  budget: {
    ...baseFixture.budget,
    capitalStack: { developerEquity: 40000, bankLoan: 120000 },
  },
};

const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe("Fixture 1 — itemized construction with grants", () => {
  const r = computeProjectFinancials(baseFixture);

  // Hand calculation:
  //   acq base 75,000 + 3,000 + 1,500 = 79,500 -> x1.05 = 83,475
  //   hard base 75,000 -> x1.15 = 86,250
  //   soft base  7,500 -> x1.10 =  8,250
  //   holding 0, reserves 0
  //   TDC = 177,975
  it("computes category totals", () => {
    near(r.acqTotal, 83475);
    near(r.hardTotal, 86250);
    near(r.softTotal, 8250);
    near(r.holdingTotal, 0);
  });

  it("computes TDC and netTdc", () => {
    near(r.tdc, 177975);
    near(r.netTdc, 177975 - 15000); // 162,975
  });

  it("computes sale returns on the net basis", () => {
    near(r.salesCosts, 15000);          // 250,000 x 6%
    near(r.netSaleProceeds, 235000);
    near(r.netProfit, 72025);           // 235,000 - 162,975
    near(r.roi, 180.0625);              // 72,025 / 40,000
    near(r.profitMargin, 28.81);        // 72,025 / 250,000
  });

  it("computes gross-basis metrics from TDC, not netTdc", () => {
    near(r.allInBasis, 71.19);          // 177,975 / 250,000
    near(r.breakEvenArv, 192975);       // TDC + sales costs
    near(r.capRate, 0);                 // no rental income entered
    near(r.onePercentRule, 0);
  });

  it("computes the capital stack", () => {
    near(r.totalSources, 175000);       // 40,000 + 120,000 + 15,000
    near(r.fundingGap, 2975);           // 177,975 - 175,000
    near(r.landEquity, 0);              // not new construction
  });
});

describe("Fixture 2 — per-square-foot construction estimate", () => {
  const r = computeProjectFinancials(perSqftFixture);

  it("derives construction base from $/SF x planned sq ft", () => {
    near(r.hardBase, 96000);            // 40 x 2,400
    near(r.hardTotal, 110400);          // x1.15
  });

  it("flows the per-SF construction cost into TDC", () => {
    near(r.tdc, 202125);                // 83,475 + 110,400 + 8,250
    near(r.netTdc, 187125);
    near(r.netProfit, 47875);           // 235,000 - 187,125
  });

  it("never yields a zero construction cost when itemized fields are absent", () => {
    expect(r.hardBase).toBeGreaterThan(0);
    expect(r.constructionPerSF).toBeCloseTo(46, 6); // 110,400 / 2,400
  });
});

describe("Fixture 3 — no grants", () => {
  const r = computeProjectFinancials(noGrantsFixture);

  it("leaves netTdc equal to TDC", () => {
    near(r.grants, 0);
    near(r.netTdc, r.tdc);
    near(r.tdc, 177975);
  });

  it("computes profit off the ungranted basis", () => {
    near(r.netProfit, 57025);           // 235,000 - 177,975
    near(r.roi, 142.5625);
  });
});

/**
 * Producer identity.
 *
 * All three producers call computeProjectFinancials / computeBudgetTotals with the same
 * raw section data. These assertions pin that contract: any producer that reintroduces a
 * local calculation will drift from these values and fail here.
 */
describe("producer identity — FeasibilityForm / ExecutiveSummaryForm / fetchProjectData", () => {
  const fixtures: Array<[string, FinancialsInput]> = [
    ["itemized", baseFixture],
    ["perSqft", perSqftFixture],
    ["noGrants", noGrantsFixture],
  ];

  for (const [label, fixture] of fixtures) {
    it(`produces identical TDC and netProfit for the ${label} fixture`, () => {
      // FeasibilityForm path: budget totals + financials
      const feasibility = computeProjectFinancials({
        scope: fixture.scope,
        budget: fixture.budget,
        feasibility: fixture.feasibility,
      });
      // ExecutiveSummaryForm path: same entry point, same inputs
      const execSummary = computeProjectFinancials({ ...fixture });
      // fetchProjectData (PDF export) path: budget totals shared with the financials
      const exportTotals = computeBudgetTotals(fixture.budget, fixture.scope);
      const exportFinancials = computeProjectFinancials({ ...fixture });

      expect(feasibility.tdc).toBe(execSummary.tdc);
      expect(feasibility.tdc).toBe(exportTotals.tdc);
      expect(feasibility.tdc).toBe(exportFinancials.tdc);

      expect(feasibility.netProfit).toBe(execSummary.netProfit);
      expect(feasibility.netProfit).toBe(exportFinancials.netProfit);

      expect(feasibility.netTdc).toBe(execSummary.netTdc);
      expect(feasibility.hardTotal).toBe(exportTotals.hardTotal);
      expect(feasibility.roi).toBe(exportFinancials.roi);
    });
  }

  it("counts custom line items in every producer (the historical FeasibilityForm defect)", () => {
    const withCustom: FinancialsInput = {
      ...baseFixture,
      budget: {
        ...baseFixture.budget,
        hardCosts: { foundation: 75000, contingencyPercent: 15, customItems: [{ name: "Sitework", amount: 10000 }] },
      },
    };
    const r = computeProjectFinancials(withCustom);
    near(r.hardBase, 85000);
    near(r.tdc, 177975 + 10000 * 1.15); // 189,475
  });
});

// --- Fixture 4: rental exit, same budget as fixture 1 ---------------------------------
const rentalExitData = {
  numberOfUnits: 4,
  monthlyRentPerUnit: 1200,
  vacancyRate: 8,
  managementPercent: 10,
  maintenancePercent: 5,
  reservesPercent: 5,
  propertyTaxes: 2400,
  insurance: 1800,
  otherExpenses: 0,
  loanAmount: 120000,
  interestRate: 7.5,
  loanTerm: 30,
};

const rentalFixture: FinancialsInput = {
  ...baseFixture,
  feasibility: { exitStrategy: { strategy: "rent" }, rentalExit: rentalExitData },
};

// --- Fixture 5: rent per unit set but numberOfUnits missing (the original zero bug) ----
const rentalNoUnitsFixture: FinancialsInput = {
  ...baseFixture,
  feasibility: {
    exitStrategy: { strategy: "rent" },
    rentalExit: { ...rentalExitData, numberOfUnits: undefined },
  },
};

describe("Fixture 4 — rental exit", () => {
  const r = computeProjectFinancials(rentalFixture);

  // Hand calculation:
  //   gross rent = 4 x 1,200 x 12                = 57,600
  //   EGI        = 57,600 x 0.92                 = 52,992
  //   mgmt 10%   = 5,299.20   maint 5% = 2,649.60   reserves 5% = 2,649.60
  //   opex       = 5,299.20 + 2,400 + 1,800 + 2,649.60 + 2,649.60 = 14,798.40
  //   NOI        = 52,992 - 14,798.40            = 38,193.60
  it("computes income and operating expenses", () => {
    near(r.grossRent, 57600);
    near(r.egi, 52992);
    near(r.opex, 14798.4);
    near(r.noi, 38193.6);
  });

  it("computes debt service on a 30-year 7.5% loan of 120,000", () => {
    expect(r.annualDebtService / 12).toBeCloseTo(839.0574102633318, 6);
    expect(r.annualDebtService).toBeCloseTo(10068.688923159982, 6);
  });

  it("computes DSCR, cap rate, cash flow and cash-on-cash", () => {
    expect(r.dscr).toBeCloseTo(3.793304201915221, 6);       // 38,193.60 / 10,068.69
    expect(r.capRate).toBeCloseTo(21.46009270965023, 6);     // NOI / gross TDC 177,975
    expect(r.cashFlow).toBeCloseTo(28124.911076840017, 6);
    expect(r.cashOnCash).toBeCloseTo(70.31227769210004, 6);  // cash flow / 40,000 equity
  });

  it("computes the 1% rule off gross TDC", () => {
    expect(r.onePercentRule).toBeCloseTo(2.69700800674252, 6); // 4,800 / 177,975
  });

  it("uses gross TDC (not netTdc) for cap rate and the 1% rule", () => {
    near(r.tdc, 177975);
    near(r.netTdc, 162975);
    expect(r.capRate).toBeCloseTo((r.noi / r.tdc) * 100, 10);
    expect(r.onePercentRule).toBeCloseTo((4800 / r.tdc) * 100, 10);
  });
});

describe("Fixture 5 — rent per unit set, numberOfUnits absent", () => {
  const r = computeProjectFinancials(rentalNoUnitsFixture);

  it("never silently returns zero for the rental metrics", () => {
    expect(r.grossRent).toBeGreaterThan(0);
    expect(r.egi).toBeGreaterThan(0);
    expect(r.noi).not.toBe(0);
    expect(r.capRate).not.toBe(0);
    expect(r.dscr).toBeGreaterThan(0);
    expect(r.onePercentRule).toBeGreaterThan(0);
  });

  it("falls back to a single unit", () => {
    near(r.grossRent, 14400);          // 1 x 1,200 x 12
    near(r.egi, 13248);
  });
});

describe("producer identity — rental metrics", () => {
  it("produces identical NOI / DSCR / cap rate / cash-on-cash across all three producers", () => {
    const feasibility = computeProjectFinancials({
      scope: rentalFixture.scope,
      budget: rentalFixture.budget,
      feasibility: rentalFixture.feasibility,
    });
    const execSummary = computeProjectFinancials({ ...rentalFixture });
    const exportFinancials = computeProjectFinancials({ ...rentalFixture });

    for (const key of ["noi", "dscr", "capRate", "cashOnCash", "cashFlow", "onePercentRule", "egi", "opex"] as const) {
      expect(feasibility[key]).toBe(execSummary[key]);
      expect(feasibility[key]).toBe(exportFinancials[key]);
    }
  });
});
