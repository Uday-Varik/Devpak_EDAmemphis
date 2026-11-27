import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = Record<string, unknown>;

interface QueryStub {
  select: () => QueryStub;
  eq: (col: string, val: unknown) => QueryStub;
  maybeSingle: () => Promise<{ data: Row | null; error: null }>;
  then: (resolve?: (v: { data: Row[]; error: null }) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>;
}

// In-memory stand-in for the Supabase tables that runValidation and fetchProjectSections read.
const db = vi.hoisted(() => ({
  details: [] as Array<{ project_id: string; section: string; data: Record<string, unknown> }>,
  profiles: [] as Array<{ user_id: string; full_name: string }>,
  userId: "user-1" as string | null,
}));

function query(table: string): QueryStub {
  const filters: Record<string, unknown> = {};
  const rows = (): Row[] => {
    const src: Row[] = table === "project_details" ? db.details : table === "developer_profiles" ? db.profiles : [];
    return src.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v));
  };
  const q: QueryStub = {
    select: () => q,
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return q;
    },
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve, reject) => Promise.resolve({ data: rows(), error: null }).then(resolve, reject),
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
const put = (section: string, data: Row) => db.details.push({ project_id: PROJECT, section, data });

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
    (budget.data.capitalStack as Row).developerEquity = 100000;

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

describe("runValidation edge cases", () => {
  const section = (name: string) => db.details.find((d) => d.section === name)!.data;
  const sections = (findings: Array<{ section: string }>) => findings.map((f) => f.section);

  beforeEach(() => {
    db.details.length = 0;
    db.profiles.length = 0;
    db.userId = "user-1";
    seedFullPackage();
  });

  it("treats addresses that differ only in case or whitespace as consistent", async () => {
    section("site-location").propertyAddress = "  123 MAIN ST ";

    expect(sections(await runValidation(PROJECT))).not.toContain("Site & Location");
  });

  it("flags addresses that differ between Scope and Site & Location", async () => {
    section("site-location").propertyAddress = "456 Oak Ave";

    const findings = await runValidation(PROJECT);

    expect(findings).toContainEqual(expect.objectContaining({ severity: "critical", section: "Site & Location" }));
  });

  it("allows a DSCR of exactly 1.20 but flags anything below", async () => {
    const rental = (section("feasibility").rentalExit as Row);
    rental.dscr = 1.2;
    expect(sections(await runValidation(PROJECT))).not.toContain("Feasibility");

    rental.dscr = 1.19;
    const findings = await runValidation(PROJECT);
    expect(findings).toContainEqual({
      id: expect.any(String),
      severity: "critical",
      section: "Feasibility",
      message: "Your DSCR is 1.19, below the 1.20 minimum most lenders require.",
    });
  });

  it("flags rent only when it is more than 25% above the area average", async () => {
    (section("feasibility").rentalExit as Row).monthlyRentPerUnit = 1250;
    expect(sections(await runValidation(PROJECT))).not.toContain("Vision & Market");

    (section("feasibility").rentalExit as Row).monthlyRentPerUnit = 1260;
    const findings = await runValidation(PROJECT);
    expect(findings.find((f) => f.section === "Vision & Market")?.message).toBe(
      "Your projected rent is 26% above the area average. Provide supporting comps."
    );
  });

  it("counts comparables that use the price field and those missing sqft", async () => {
    const comps = (section("vision-market").comparables as Row[]);
    comps[2] = { price: 270000, sqft: 1900 };
    expect(sections(await runValidation(PROJECT))).not.toContain("Vision & Market");

    comps[2] = { salePrice: 270000 };
    const findings = await runValidation(PROJECT);
    expect(findings.find((f) => f.section === "Vision & Market")?.message).toBe(
      "Lenders expect at least 3 comparable properties. You have 2. Add more comps."
    );
  });

  it("ignores schedule gaps of exactly 14 days and flags longer ones in weeks", async () => {
    const milestones = section("project-schedule").milestones as Row[];
    milestones[1].startDate = "2026-07-14"; // 14 days after Foundation ends
    expect(sections(await runValidation(PROJECT))).not.toContain("Project Schedule");

    milestones[1].startDate = "2026-07-15"; // 15 days
    const findings = await runValidation(PROJECT);
    expect(findings.find((f) => f.section === "Project Schedule")?.message).toBe(
      "There is a 2-week gap between Foundation and Framing. Is this intentional?"
    );
  });

  it("warns when the loan matures under 90 days after completion", async () => {
    // Completion is Framing's end date, 2027-03-31.
    const rental = section("feasibility").rentalExit as Row;
    rental.loanMaturityDate = "2027-06-29"; // exactly 90 days
    expect(sections(await runValidation(PROJECT))).not.toContain("Feasibility");

    rental.loanMaturityDate = "2027-06-01"; // 62 days
    const findings = await runValidation(PROJECT);
    expect(findings.find((f) => f.section === "Feasibility")?.message).toBe(
      "Your loan matures 62 days after completion. Consider a longer term."
    );
  });

  it("reports readiness as info only below 50%, ignoring non-factor keys", async () => {
    const factors = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`factor${i}`, true]));
    db.details.find((d) => d.section === "resilience-factors")!.data = {
      ...factors(5),
      additionalStrengths: "text that is not a factor",
      _autoFlags: { something: true },
    };
    const info = (await runValidation(PROJECT)).find((f) => f.section === "Resilience Factors");
    expect(info).toEqual({
      id: expect.any(String),
      severity: "info",
      section: "Resilience Factors",
      message: "Your readiness score is 25%. Consider addressing unchecked items.",
    });

    db.details.find((d) => d.section === "resilience-factors")!.data = factors(10);
    expect(sections(await runValidation(PROJECT))).not.toContain("Resilience Factors");
  });

  it("flags sources that exceed uses as critical", async () => {
    // Total development cost is $250,000 in the seeded package.
    (section("budget-capital").capitalStack as Row).developerEquity = 255000;

    const findings = await runValidation(PROJECT);

    expect(findings).toContainEqual({
      id: expect.any(String),
      severity: "critical",
      section: "Budget & Sources/Uses",
      message: "Sources exceed uses by $5,000. Adjust sources or uses so the budget balances.",
    });
  });

  it("does not block on a funding gap for internal-planning packages", async () => {
    (section("budget-capital").capitalStack as Row).developerEquity = 100000;
    section("executive-summary").packagePurpose = "internal-planning";

    expect(sections(await runValidation(PROJECT))).not.toContain("Budget & Sources/Uses");
  });

  it("flags a blank developer name as critical", async () => {
    db.profiles[0].full_name = "   ";

    const findings = await runValidation(PROJECT);

    expect(findings).toContainEqual(expect.objectContaining({ severity: "critical", section: "Developer Profile" }));
  });
});
