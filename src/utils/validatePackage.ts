import { fetchProjectSections, type ProjectSections } from "./autoAssess";
import { supabase } from "@/integrations/supabase/client";
import { computeProjectFinancials } from "./calculations";

/** Funding gap for validation — straight from the shared engine. */
export const computeFundingGap = (sections: ProjectSections): number =>
  computeProjectFinancials({ scope: sections.scope, budget: sections.budget, feasibility: sections.feasibility }).fundingGap;

export type Severity = "critical" | "warning" | "info";

export interface ValidationFinding {
  id: string;
  severity: Severity;
  section: string;
  message: string;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;


export const runValidation = async (projectId: string): Promise<ValidationFinding[]> => {
  const findings: ValidationFinding[] = [];
  const push = (f: Omit<ValidationFinding, "id">) =>
    findings.push({ id: crypto.randomUUID(), ...f });

  const sections = await fetchProjectSections(projectId);
  const { scope, visionMarket, siteLocation, schedule, budget, team, feasibility, riskAssessment } = sections;
  const exec = (await supabase
    .from("project_details")
    .select("data")
    .eq("project_id", projectId)
    .eq("section", "executive-summary")
    .maybeSingle()).data?.data as any || {};
  const resilience = (await supabase
    .from("project_details")
    .select("data")
    .eq("project_id", projectId)
    .eq("section", "resilience-factors")
    .maybeSingle()).data?.data as any || {};

  // a) Address consistency
  const scopeAddr = (scope?.address || "").trim().toLowerCase();
  const siteAddr = (siteLocation?.propertyAddress || siteLocation?.address || "").trim().toLowerCase();
  if (scopeAddr && siteAddr && scopeAddr !== siteAddr) {
    push({
      severity: "critical",
      section: "Site & Location",
      message: "Your package shows different addresses in different sections. Please confirm.",
    });
  }

  // b) Key metrics completeness
  const exitStrategy = feasibility?.exitStrategy?.strategy || "";
  const arv = feasibility?.saleExit?.arv || 0;
  const rentPerUnit = feasibility?.rentalExit?.monthlyRentPerUnit || 0;
  if (exitStrategy === "sell" && !arv) {
    push({
      severity: "critical",
      section: "Feasibility",
      message: "Your package is missing the projected completed value (ARV).",
    });
  }
  if (exitStrategy === "rent" && !rentPerUnit) {
    push({
      severity: "critical",
      section: "Feasibility",
      message: "Your package is missing the projected rent.",
    });
  }

  // c) DSCR
  const dscr = feasibility?.rentalExit?.dscr;
  if (typeof dscr === "number" && dscr > 0 && dscr < 1.2) {
    push({
      severity: "critical",
      section: "Feasibility",
      message: `Your DSCR is ${dscr.toFixed(2)}, below the 1.20 minimum most lenders require.`,
    });
  }

  // d) Rent reasonableness
  const areaRent = visionMarket?.averageRent || 0;
  if (rentPerUnit > 0 && areaRent > 0) {
    const pct = ((rentPerUnit - areaRent) / areaRent) * 100;
    if (pct > 25) {
      push({
        severity: "warning",
        section: "Vision & Market",
        message: `Your projected rent is ${pct.toFixed(0)}% above the area average. Provide supporting comps.`,
      });
    }
  }

  // e) Comp count
  const comps = visionMarket?.comparables || visionMarket?.comps || [];
  const completeComps = comps.filter((c: any) => (c.salePrice || c.price) && c.sqft);
  if (completeComps.length < 3) {
    push({
      severity: "warning",
      section: "Vision & Market",
      message: `Lenders expect at least 3 comparable properties. You have ${completeComps.length}. Add more comps.`,
    });
  }

  // f) Timeline continuity
  const milestones = (schedule?.milestones || []).filter((m: any) => m.startDate && m.endDate);
  const sorted = [...milestones].sort(
    (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapDays =
      (new Date(sorted[i + 1].startDate).getTime() - new Date(sorted[i].endDate).getTime()) /
      (1000 * 60 * 60 * 24);
    if (gapDays > 14) {
      const weeks = Math.round(gapDays / 7);
      push({
        severity: "warning",
        section: "Project Schedule",
        message: `There is a ${weeks}-week gap between ${sorted[i].name || "milestone"} and ${sorted[i + 1].name || "next milestone"}. Is this intentional?`,
      });
    }
  }

  // g) Loan term vs project duration
  const lastMs = sorted[sorted.length - 1];
  const completion = lastMs?.endDate ? new Date(lastMs.endDate) : null;
  const loanMaturity = feasibility?.rentalExit?.loanMaturityDate
    ? new Date(feasibility.rentalExit.loanMaturityDate)
    : null;
  if (completion && loanMaturity) {
    const days = (loanMaturity.getTime() - completion.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 90) {
      push({
        severity: "warning",
        section: "Feasibility",
        message: `Your loan matures ${Math.round(days)} days after completion. Consider a longer term.`,
      });
    }
  }

  // h) Resilience score
  const TOTAL_FACTORS = 20;
  const resilienceCount = Object.entries(resilience).filter(
    ([k, v]) => k !== "_autoFlags" && k !== "additionalStrengths" && v === true
  ).length;
  if (resilienceCount > 0) {
    const pct = (resilienceCount / TOTAL_FACTORS) * 100;
    if (pct < 50) {
      push({
        severity: "info",
        section: "Resilience Factors",
        message: `Your readiness score is ${Math.round(pct)}%. Consider addressing unchecked items.`,
      });
    }
  }

  // i) Funding gap
  const gap = computeFundingGap(sections);
  if (gap > 0 && exec.packagePurpose !== "internal-planning") {
    push({
      severity: "critical",
      section: "Budget & Sources/Uses",
      message: `Funding gap of ${fmt(gap)} needs to be addressed before presenting.`,
    });
  }

  // j) Developer name
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: dp } = await supabase
      .from("developer_profiles" as any)
      .select("full_name")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const fullName = ((dp as any)?.full_name || "").trim();
    if (!fullName) {
      push({
        severity: "critical",
        section: "Developer Profile",
        message: "Developer name is missing. Complete your profile.",
      });
    }
  }

  // k) Package purpose
  if (!exec.packagePurpose) {
    push({
      severity: "warning",
      section: "Executive Summary",
      message: "No package purpose selected. Select one in the Executive Summary.",
    });
  }

  return findings;
};
