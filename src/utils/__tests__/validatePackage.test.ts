import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory stand-in for the Supabase tables that runValidation and fetchProjectSections read.
const db = vi.hoisted(() => ({
  details: [] as Array<{ project_id: string; section: string; data: any }>,
  profiles: [] as Array<{ user_id: string; full_name: string }>,
  userId: "user-1" as string | null,
}));

function query(table: string) {
  const filters: Record<string, unknown> = {};
  const rows = (): any[] => {
    const src = table === "project_details" ? db.details : table === "developer_profiles" ? db.profiles : [];
    return src.filter((r: any) => Object.entries(filters).every(([k, v]) => r[k] === v));
  };
  const q: any = {
    select: () => q,
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return q;
    },
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve: any, reject: any) => Promise.resolve({ data: rows(), error: null }).then(resolve, reject),
  };
  return q;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => query(table),
    auth: {
      getUser: async () => ({ data: { user: db.userId ? { id: db.userId } : null } }),
    },
  },
}));

import { sourcesExceedUsesMessage, runValidation } from "../validatePackage";
import { computeBudgetTotals } from "../calculations";

const PROJECT = "proj-1";
const put = (section: string, data: any) => db.details.push({ project_id: PROJECT, section, data });

/** A package where every validation rule passes. */
function seedFullPackage() {
  const scope = { address: "123 Main St", projectType: "new-construction", sqftPlanned: 1800 };
  const budget = { acquisition: { purchasePrice: 200000 }, hardCosts: { foundation: 50000 } };
  const tdc = computeBudgetTotals(budget, scope).tdc;
  put("project-scope", scope);
  put("site-location", { propertyAddress: "123 Main St" });
  put("budget-capital", { ...budget, capitalStack: { developerEquity: tdc } });
  put("feasibility", {
    exitStrategy: { strategy: "sell" },
    saleExit: { arv: 300000 },
    rentalExit: { monthlyRentPerUnit: 1000, dscr: 1.5, loanMaturityDate: "2028-03-31" },
  });
  put("vision-market", {
    averageRent: 1000,
    comparables: [
      { salePrice: 250000, sqft: 1800 },
      { salePrice: 260000, sqft: 1850 },
      { salePrice: 270000, sqft: 1900 },
    ],
  });
  put("project-schedule", {
    milestones: [
      { name: "Foundation", startDate: "2026-01-01", endDate: "2026-06-30" },
      { name: "Framing", startDate: "2026-07-01", endDate: "2027-03-31" },
    ],
  });
  put("resilience-factors", {});
  put("executive-summary", { packagePurpose: "lender" });
  db.profiles.push({ user_id: "user-1", full_name: "Jane Developer" });
}

const summarize = (findings: Array<{ severity: string; section: string }>) =>
  findings.map((f) => ({ severity: f.severity, section: f.section }));

describe("sourcesExceedUsesMessage", () => {
  it("flags sources that exceed uses", () => {
    expect(sourcesExceedUsesMessage(-5000)).toBe(
      "Sources exceed uses by $5,000. Adjust sources or uses so the budget balances."
    );
  });

  it("does not flag a balanced budget or a funding gap", () => {
    expect(sourcesExceedUsesMessage(0)).toBeNull();
    expect(sourcesExceedUsesMessage(0.4)).toBeNull();
    expect(sourcesExceedUsesMessage(-0.4)).toBeNull();
    expect(sourcesExceedUsesMessage(12000)).toBeNull();
  });
});

describe("runValidation end to end", () => {
  beforeEach(() => {
    db.details.length = 0;
    db.profiles.length = 0;
    db.userId = "user-1";
  });

  it("returns no findings for a fully filled package", async () => {
    seedFullPackage();

    const findings = await runValidation(PROJECT);

    expect(summarize(findings)).toEqual([]);
  });

  it("flags a funding gap as critical when sources fall short of uses", async () => {
    seedFullPackage();
    const budget = db.details.find((d) => d.section === "budget-capital")!;
    budget.data.capitalStack.developerEquity = 100000;

    const findings = await runValidation(PROJECT);

    expect(summarize(findings)).toEqual([{ severity: "critical", section: "Budget & Sources/Uses" }]);
    expect(findings[0].message).toBe("Funding gap of $150,000 needs to be addressed before presenting.");
  });

  it("returns the expected findings for an empty package", async () => {
    db.userId = "user-1";

    const findings = await runValidation(PROJECT);

    expect(summarize(findings)).toEqual([
      { severity: "warning", section: "Vision & Market" },
      { severity: "critical", section: "Developer Profile" },
      { severity: "warning", section: "Executive Summary" },
    ]);
    expect(findings[0].message).toBe("Lenders expect at least 3 comparable properties. You have 0. Add more comps.");
  });

  it("skips the developer profile check when no user is signed in", async () => {
    db.userId = null;

    const findings = await runValidation(PROJECT);

    expect(findings.map((f) => f.section)).not.toContain("Developer Profile");
  });
});
