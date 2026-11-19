import { describe, it, expect } from "vitest";
import { countObtainedInsurance, INSURANCE_FIELDS } from "../riskInsurance";

describe("countObtainedInsurance", () => {
  it("counts flat insurance fields marked Obtained", () => {
    expect(
      countObtainedInsurance({
        buildersRiskInsurance: "Obtained",
        generalLiabilityInsurance: "Pending",
        titleInsurance: "Obtained",
        propertyInsurance: "",
      })
    ).toBe(2);
  });

  it("ignores the legacy nested insurance object", () => {
    expect(countObtainedInsurance({ insurance: { buildersRisk: "Obtained" } })).toBe(0);
  });

  it("reads exactly the four flat keys the risk form writes", () => {
    expect([...INSURANCE_FIELDS]).toEqual([
      "buildersRiskInsurance",
      "generalLiabilityInsurance",
      "titleInsurance",
      "propertyInsurance",
    ]);
  });
});
