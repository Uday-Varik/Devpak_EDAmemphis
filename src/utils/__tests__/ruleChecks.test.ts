import { describe, it, expect } from "vitest";
import { computeProjectFinancials, indefiniteArticle, ruleCheckLabel, roundCurrency } from "../calculations";

const budget = { acquisition: { purchasePrice: 100000 }, hardCosts: { foundation: 40000 } };

describe("ARV-dependent rule checks", () => {
  it("are N/A with no ARV", () => {
    const f = computeProjectFinancials({ budget, feasibility: { exitStrategy: { strategy: "rent" } } });
    expect(f.allInBasisCheck).toBe("na");
    expect(f.seventyRuleCheck).toBe("na");
    expect(ruleCheckLabel(f.allInBasisCheck)).toBe("N/A — no ARV entered");
  });
  it("pass/fail with ARV", () => {
    expect(computeProjectFinancials({ budget, feasibility: { saleExit: { arv: 300000 } } }).allInBasisCheck).toBe("pass");
    expect(computeProjectFinancials({ budget, feasibility: { saleExit: { arv: 150000 } } }).allInBasisCheck).toBe("fail");
  });
});

describe("helpers", () => {
  it("uses an before vowel sounds", () => {
    expect(indefiniteArticle("acquisition and rehab")).toBe("an");
    expect(indefiniteArticle("new construction")).toBe("a");
  });
  it("rounds a value and its negation to the same magnitude", () => {
    expect(roundCurrency(-151012.5)).toBe(-151013);
    expect(roundCurrency(151012.5)).toBe(151013);
  });
});
