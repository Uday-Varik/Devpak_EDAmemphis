import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { computeProjectFinancials } from "../calculations";
import { generateAutoRisks, type ProjectSections } from "../autoAssess";
import { computeFundingGap } from "../validatePackage";
import { computeBudgetDashboard } from "@/components/builder/sections/budget/BudgetSummaryDashboard";

/**
 * Per-SF construction mode with a stale itemized value still stored.
 * Every consumer must derive TDC and funding gap from the shared engine.
 */
const scope = { projectType: "acquisition-rehab", sqftPlanned: 1650 };
const budget = {
  acquisition: { purchasePrice: 60000, closingCosts: 2500, titleRecording: 1000, contingencyPercent: 0 },
  hardCosts: { usePerSqftEstimate: true, costPerSqft: 45, foundation: 40000, contingencyPercent: 15 },
  softCosts: { architectureEngineering: 1500, contingencyPercent: 0 },
  holdingCosts: { contingencyPercent: 0 },
  operatingReserves: 0,
  capitalStack: { developerEquity: 30000, bankLoan: 100000 },
};
const sections: ProjectSections = {
  scope, budget, feasibility: {}, visionMarket: {}, siteLocation: {}, schedule: {}, team: {}, riskAssessment: {},
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

describe("per-SF construction parity across consumers", () => {
  const engine = computeProjectFinancials({ scope, budget });

  it("engine uses $/SF × planned SF and ignores the stale itemized value", () => {
    expect(engine.hardBase).toBe(45 * 1650);
    expect(engine.hardTotal).toBeCloseTo(45 * 1650 * 1.15, 6);
    expect(engine.fundingGap).toBeGreaterThan(0);
  });

  it("Budget panel TDC and funding gap match the engine", () => {
    const panel = computeBudgetDashboard(budget, scope);
    expect(panel.totalDevelopmentCost).toBe(engine.tdc);
    expect(panel.fundingGap).toBe(engine.fundingGap);
  });

  it("validator funding gap matches the engine", () => {
    expect(computeFundingGap(sections)).toBe(engine.fundingGap);
  });

  it("risk generator reports the engine's funding gap", () => {
    const gapRisk = generateAutoRisks(sections).find((r: any) => /Funding gap/.test(r.description));
    expect(gapRisk).toBeDefined();
    expect(gapRisk!.description).toContain(fmt(engine.fundingGap));
  });
});
