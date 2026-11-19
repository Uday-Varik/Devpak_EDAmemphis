import { describe, it, expect } from "vitest";
import {
  computeProjectFinancials,
  computeSensitivityScenarios,
  returnOnCash,
  annualizeRoi,
  CASH_NOT_INVESTED,
} from "../calculations";

// Sale-side inputs with a positive ARV, so ROI is defined whenever cash is invested.
const build = (developerEquity: number | undefined, arv = 300000, tdcBudget = 200000) =>
  computeProjectFinancials({
    scope: {},
    budget: {
      capitalStack: developerEquity === undefined ? {} : { developerEquity },
      hardCosts: { itemized: tdcBudget },
    } as never,
    feasibility: { saleExit: { arv, salesCostsPercent: 0 } } as never,
  });

describe("returnOnCash (issues #9 and #28)", () => {
  it("returns null when cash is 0, not 0%", () => {
    expect(returnOnCash(50000, 0)).toBeNull();
  });

  it("returns null when cash is blank (undefined)", () => {
    expect(returnOnCash(50000, undefined as unknown as number)).toBeNull();
  });

  it("returns the real number when cash is positive", () => {
    expect(returnOnCash(25000, 100000)).toBe(25);
  });

  it("shows a negative return when profit is negative and cash is positive", () => {
    expect(returnOnCash(-20000, 100000)).toBe(-20);
  });
});

describe("computeProjectFinancials cash return", () => {
  it("roi and cashOnCash are null with 0 developer cash, even when profit is positive", () => {
    const fin = build(0);
    expect(fin.netProfit).toBeGreaterThan(0);
    expect(fin.roi).toBeNull();
    expect(fin.cashOnCash).toBeNull();
  });

  it("roi is null with blank developer cash", () => {
    const fin = build(undefined);
    expect(fin.roi).toBeNull();
  });

  it("roi is the real number with positive developer cash", () => {
    const fin = build(50000);
    expect(fin.roi).toBeCloseTo((fin.netProfit / 50000) * 100, 6);
  });

  it("roi is negative with positive cash and a loss", () => {
    const fin = build(50000, 150000, 200000);
    expect(fin.netProfit).toBeLessThan(0);
    expect(fin.roi).toBeLessThan(0);
  });
});

describe("sensitivity Base/Worst rows (issues #9 and #28)", () => {
  it("every scenario return is null with 0 cash", () => {
    const fin = build(0);
    const scenarios = computeSensitivityScenarios(fin);
    expect(scenarios.length).toBeGreaterThan(0);
    scenarios.forEach((s) => expect(s.return).toBeNull());
  });

  it("scenario returns are real numbers with positive cash", () => {
    const fin = build(50000);
    computeSensitivityScenarios(fin).forEach((s) => expect(typeof s.return).toBe("number"));
  });
});

describe("annualizeRoi", () => {
  it("spreads a return over holds longer than 12 months", () => {
    expect(annualizeRoi(30, 24)).toBe(15);
  });

  it("leaves a return unchanged for holds of 12 months or less", () => {
    expect(annualizeRoi(30, 12)).toBe(30);
  });
});

describe("display label", () => {
  it("uses the spec wording", () => {
    expect(CASH_NOT_INVESTED).toBe("Cash not invested");
  });
});
