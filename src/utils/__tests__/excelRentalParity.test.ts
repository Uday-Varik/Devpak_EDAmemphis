import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { computeProjectFinancials } from "../calculations";
import { buildExcelRentalProjection } from "../generateExcel";

const rentalFixture = {
  scope: { projectType: "acquisition-rehab", sqftPlanned: 1800, numberOfUnits: 2 },
  budget: {
    acquisition: { purchasePrice: 90000, closingCosts: 3000, titleRecording: 1000, contingencyPercent: 0 },
    hardCosts: { foundation: 60000, contingencyPercent: 10 },
    softCosts: { contingencyPercent: 0 },
    holdingCosts: { contingencyPercent: 0 },
    capitalStack: { developerEquity: 40000, bankLoan: 120000 },
  },
  feasibility: {
    exitStrategy: { strategy: "rent" },
    rentalExit: {
      numberOfUnits: 2, monthlyRentPerUnit: 1100, vacancyRate: 8,
      managementPercent: 10, maintenancePercent: 5, reservesPercent: 5,
      propertyTaxes: 2400, insurance: 1500, otherExpenses: 600,
      loanAmount: 120000, interestRate: 7.5, loanTerm: 30,
    },
  },
};

describe("Excel rental pro forma uses the shared engine", () => {
  const fin = computeProjectFinancials(rentalFixture);
  const rows = buildExcelRentalProjection(rentalFixture);

  it("year-1 NOI equals the engine NOI", () => {
    expect(fin.noi).toBeGreaterThan(0);
    expect(rows[0].noi).toBe(fin.noi);
  });

  it("year-1 income, expenses, debt service and cash flow equal the engine", () => {
    expect(rows[0].grossRent).toBe(fin.grossRent);
    expect(rows[0].egi).toBe(fin.egi);
    expect(rows[0].opex).toBe(fin.opex);
    expect(rows[0].annualDebtService).toBe(fin.annualDebtService);
    expect(rows[0].cashFlow).toBe(fin.cashFlow);
    expect(rows[0].dscr).toBe(fin.dscr);
  });

  it("years 2-3 grow rent 3% on top of the engine values", () => {
    expect(rows[1].grossRent).toBeCloseTo(fin.grossRent * 1.03, 6);
    expect(rows[2].grossRent).toBeCloseTo(fin.grossRent * 1.03 ** 2, 6);
    expect(rows[2].annualDebtService).toBe(fin.annualDebtService);
  });
});
