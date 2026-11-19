// Single source for the insurance fields stored on the riskAssessment section.
// RiskAssessmentForm writes these as top-level keys; every reader must use this list.
export const INSURANCE_FIELDS = [
  "buildersRiskInsurance",
  "generalLiabilityInsurance",
  "titleInsurance",
  "propertyInsurance",
] as const;

export const countObtainedInsurance = (risk: Record<string, unknown>): number =>
  INSURANCE_FIELDS.filter((f) => risk[f] === "Obtained").length;
