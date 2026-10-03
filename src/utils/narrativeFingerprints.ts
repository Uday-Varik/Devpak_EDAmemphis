// Shared fingerprint builders so the app forms and the PDF export agree on
// whether a stored narrative still matches the live figures.
import { buildFingerprint } from "./narrativeStaleness";

export interface OverviewFingerprintInput {
  address: string;
  projectType: string;
  tdc: number;
  arv: number;
  netProfit: number;
  roi: number;
  noi: number;
  units: number;
  sqftPlanned: number;
  exitStrategy: string;
  fundingGap: number;
  packagePurpose: string;
}

export const buildOverviewFingerprint = (v: OverviewFingerprintInput): string =>
  buildFingerprint({
    address: v.address || "",
    projectType: v.projectType || "",
    tdc: v.tdc || 0,
    arv: v.arv || 0,
    netProfit: v.netProfit || 0,
    roi: v.roi || 0,
    noi: v.noi || 0,
    units: v.units || 0,
    sqftPlanned: v.sqftPlanned || 0,
    exitStrategy: v.exitStrategy || "",
    fundingGap: v.fundingGap || 0,
    packagePurpose: v.packagePurpose || "",
  });

export interface RationaleFingerprintInput {
  decision: string;
  roi: number;
  netProfit: number;
  marginOfSafetyPercent: number;
  dscr: number;
  cashOnCash: number;
  tdc: number;
}

/** Figures only — checklist state is deliberately excluded so the export layer
 *  can recompute the same fingerprint without the form's checklist. */
export const buildRationaleFingerprint = (v: RationaleFingerprintInput): string =>
  buildFingerprint({
    decision: v.decision || "",
    roi: v.roi || 0,
    netProfit: v.netProfit || 0,
    marginOfSafetyPercent: v.marginOfSafetyPercent || 0,
    dscr: v.dscr || 0,
    cashOnCash: v.cashOnCash || 0,
    tdc: v.tdc || 0,
  });

const money = (n: number) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Go/No-Go rationale text. `criteria` clause is optional so the export layer
 *  can regenerate a figures-accurate rationale without checklist state. */
export const generateRationaleText = (
  v: {
    includesSale: boolean;
    roi: number;
    tdc: number;
    netProfit: number;
    marginOfSafety: number;
    marginOfSafetyPercent: number;
    noi: number;
    dscr: number;
    capRate: number;
    cashOnCash: number;
  },
  criteria?: { passed: number; total: number }
): string => {
  const parts: string[] = [];
  if (v.includesSale) {
    parts.push(`Projected ROI of ${(v.roi || 0).toFixed(1)}% on total development costs of ${money(v.tdc)}`);
    parts.push(`net profit of ${money(v.netProfit)}`);
    if (v.marginOfSafety !== 0) {
      parts.push(`a ${(v.marginOfSafetyPercent || 0).toFixed(1)}% margin of safety`);
    }
  } else {
    parts.push(`Projected NOI of ${money(v.noi)} with a DSCR of ${(v.dscr || 0).toFixed(2)}`);
    parts.push(`a ${(v.capRate || 0).toFixed(1)}% cap rate and ${(v.cashOnCash || 0).toFixed(1)}% cash-on-cash return`);
  }
  if (criteria) parts.push(`${criteria.passed} of ${criteria.total} feasibility criteria met`);
  return `${parts.join(", ")}.`;
};
