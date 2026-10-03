import { computeProjectFinancials } from "./calculations";
import { supabase } from "@/integrations/supabase/client";

export interface AutoRisk {
  id: string;
  category: string;
  description: string;
  likelihood: string;
  impact: string;
  mitigation: string;
  status: string;
}

export interface ProjectSections {
  scope: any;
  visionMarket: any;
  siteLocation: any;
  schedule: any;
  budget: any;
  team: any;
  feasibility: any;
  riskAssessment: any;
}

export const fetchProjectSections = async (projectId: string): Promise<ProjectSections> => {
  const { data, error } = await supabase
    .from("project_details")
    .select("section, data")
    .eq("project_id", projectId);
  if (error) throw error;
  const map: Record<string, any> = {};
  (data || []).forEach((d) => { map[d.section] = d.data || {}; });
  return {
    scope: map["project-scope"] || {},
    visionMarket: map["vision-market"] || {},
    siteLocation: map["site-location"] || {},
    schedule: map["project-schedule"] || {},
    budget: map["budget-capital"] || {},
    team: map["project-team"] || {},
    feasibility: map["feasibility"] || {},
    riskAssessment: map["risk-assessment"] || {},
  };
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const generateAutoRisks = (s: ProjectSections): AutoRisk[] => {
  const risks: AutoRisk[] = [];
  const mk = (r: Omit<AutoRisk, "id">): AutoRisk => ({ id: crypto.randomUUID(), ...r });

  // a) Rent premium
  const rentPerUnit = s.feasibility?.rentalExit?.monthlyRentPerUnit || 0;
  const units = s.scope?.numberOfUnits || 0;
  const areaRent = s.visionMarket?.averageRent || 0;
  if (rentPerUnit > 0 && areaRent > 0) {
    const pct = ((rentPerUnit - areaRent) / areaRent) * 100;
    if (pct > 25) {
      risks.push(mk({
        category: "Market",
        description: `Projected rent is ${pct.toFixed(0)}% above area average (${fmt(rentPerUnit)}/mo vs ${fmt(areaRent)}/mo). Premium must be supported by comps.`,
        likelihood: "Medium", impact: "High", status: "Monitoring",
        mitigation: "Support with 3+ comparable rental listings at similar rents. Highlight new construction, accessibility, or unique features that justify the premium.",
      }));
    }
  }

  // b) DSCR
  const dscr = s.feasibility?.rentalExit?.dscr ?? s.feasibility?.dscr;
  if (typeof dscr === "number" && dscr > 0 && dscr < 1.25) {
    risks.push(mk({
      category: "Financial",
      description: `DSCR of ${dscr.toFixed(2)} is below the 1.25 threshold most lenders require.`,
      likelihood: "High", impact: "High", status: "Monitoring",
      mitigation: "Consider increasing rent, reducing debt, extending loan term, or adding equity to improve debt coverage.",
    }));
  }

  // c) Timeline gaps
  const milestones = (s.schedule?.milestones || []).filter((m: any) => m.startDate && m.endDate);
  const sorted = [...milestones].sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  for (let i = 0; i < sorted.length - 1; i++) {
    const endA = new Date(sorted[i].endDate).getTime();
    const startB = new Date(sorted[i + 1].startDate).getTime();
    const gapDays = (startB - endA) / (1000 * 60 * 60 * 24);
    if (gapDays > 14) {
      const weeks = Math.round(gapDays / 7);
      risks.push(mk({
        category: "Timeline",
        description: `${weeks}-week gap between ${sorted[i].name || "milestone"} and ${sorted[i + 1].name || "next milestone"}.`,
        likelihood: "Medium", impact: "Medium", status: "Monitoring",
        mitigation: "Confirm this gap is intentional. If construction is continuous, add the missing milestones.",
      }));
    }
  }

  // d) Insurance
  const ins = [
    s.riskAssessment?.buildersRiskInsurance,
    s.riskAssessment?.generalLiabilityInsurance,
    s.riskAssessment?.titleInsurance,
    s.riskAssessment?.propertyInsurance,
  ];
  const obtained = ins.filter((v) => v === "Obtained").length;
  if (obtained < 3) {
    risks.push(mk({
      category: "Compliance",
      description: `Only ${obtained} of 4 required insurance policies obtained.`,
      likelihood: "Low", impact: "High", status: "Monitoring",
      mitigation: "Obtain Builder's Risk, General Liability, Title Insurance, and Property Insurance before construction begins.",
    }));
  }

  // e) Missing GC
  const gcName = s.team?.gcCompanyName || s.team?.generalContractor?.companyName || "";
  if (!gcName.trim()) {
    risks.push(mk({
      category: "Project",
      description: "No general contractor identified.",
      likelihood: "Medium", impact: "High", status: "Monitoring",
      mitigation: "Engage a licensed general contractor with local experience before presenting to lenders.",
    }));
  }

  // f) Funding gap
  const b = s.budget || {};
  // Shared engine only — same TDC / funding gap as Budget, Feasibility and Executive Summary.
  const fin = computeProjectFinancials({ scope: s.scope, budget: b, feasibility: s.feasibility });
  const gap = fin.fundingGap;
  if (gap > 0) {
    risks.push(mk({
      category: "Financial",
      description: `Funding gap of ${fmt(gap)} exists.`,
      likelihood: "High", impact: "High", status: "Monitoring",
      mitigation: "Identify additional sources or reduce project scope to close the gap before presenting.",
    }));
  }

  // g) Construction cost (always)
  const contPct = fin.hardContPct;
  const contAmt = fin.hardContingency;
  risks.push(mk({
    category: "Construction",
    description: "Construction costs may exceed budget.",
    likelihood: "Medium", impact: "High", status: "Mitigated",
    mitigation: `${contPct}% contingency included (${fmt(contAmt)}). Fixed-price contract recommended with experienced GC.`,
  }));

  // h) Environmental
  const env = s.siteLocation?.environmentalConcerns || [];
  const envList = Array.isArray(env) ? env : (typeof env === "string" ? [env] : []);
  const flagged = envList.filter((e: string) => e && e.toLowerCase() !== "none");
  if (flagged.length > 0) {
    risks.push(mk({
      category: "Environmental",
      description: `Environmental concerns flagged: ${flagged.join(", ")}.`,
      likelihood: "Medium", impact: "High", status: "Monitoring",
      mitigation: "Complete required assessments (Phase I, lead/asbestos testing) and remediate before construction.",
    }));
  }

  // i) Flood zone
  const flood = s.siteLocation?.floodZone || "";
  if (flood && !flood.toLowerCase().includes("zone x") && !flood.toLowerCase().includes("minimal")) {
    risks.push(mk({
      category: "Environmental",
      description: `Property is in flood zone "${flood}", which may require flood insurance and elevation requirements.`,
      likelihood: "Medium", impact: "High", status: "Monitoring",
      mitigation: "Obtain flood insurance, verify elevation requirements with local authorities, and disclose to lenders.",
    }));
  }

  return risks;
};

export interface ResilienceAutoResult {
  checks: Record<string, boolean>;
  autoFlags: Record<string, boolean>; // which keys were determined by auto-score
}

export const generateResilienceScore = (s: ProjectSections): ResilienceAutoResult => {
  const b = s.budget || {};
  const cap = b.capitalStack || {};
  const ra = s.riskAssessment || {};
  const team = s.team || {};
  const sched = s.schedule || {};
  const sl = s.siteLocation || {};
  const vm = s.visionMarket || {};
  const fz = s.feasibility || {};

  const sourcesCount = [
    cap.developerEquity, cap.bankLoan, cap.privateLender,
    cap.grant1Amount, cap.grant2Amount, cap.grant3Amount, cap.otherSources,
  ].filter((v: any) => (v || 0) > 0).length;
  const grantsTotal = computeProjectFinancials({ scope: s.scope, budget: b, feasibility: s.feasibility }).grants;

  const compsCount = (vm.comparables || vm.comps || []).length;
  const subsidies = vm.subsidyPrograms || [];
  const subsidyCount = Array.isArray(subsidies) ? subsidies.length : 0;

  const envList = Array.isArray(sl.environmentalConcerns) ? sl.environmentalConcerns : [];
  const envClean = envList.filter((e: string) => e && e.toLowerCase() !== "none").length === 0;

  // Cash flow positive (rental)
  const rentPerUnit = fz.rentalExit?.monthlyRentPerUnit || 0;
  const units = s.scope?.numberOfUnits || 0;
  const monthlyOpEx = fz.rentalExit?.monthlyOperatingExpenses || 0;
  const monthlyDebt = fz.rentalExit?.monthlyDebtService || 0;
  const monthlyCashFlow = rentPerUnit * units - monthlyOpEx - monthlyDebt;

  // Timeline buffer: loan maturity vs completion
  const lastMs = (sched.milestones || []).reduce((latest: any, m: any) => {
    if (!m.endDate) return latest;
    if (!latest || new Date(m.endDate) > new Date(latest.endDate)) return m;
    return latest;
  }, null);
  const completion = lastMs?.endDate ? new Date(lastMs.endDate) : null;
  const loanMaturity = fz.rentalExit?.loanMaturityDate ? new Date(fz.rentalExit.loanMaturityDate) : null;
  const bufferOk = completion && loanMaturity
    ? (loanMaturity.getTime() - completion.getTime()) / (1000 * 60 * 60 * 24) > 90
    : false;

  const checks: Record<string, boolean> = {
    // Financial
    contingency15: (b.hardCosts?.contingencyPercent || 0) >= 15,
    operatingReserves: (b.operatingReserves || 0) > 0,
    multipleFunding: sourcesCount > 1,
    subsidyApproved: grantsTotal > 0,
    positiveCashFlow: monthlyCashFlow > 0,
    // Project
    experiencedGC: (team.gcStatus || team.generalContractor?.status) === "Engaged",
    timelineBuffer: bufferOk,
    permitsObtained: ["In Progress", "All Obtained", "Obtained"].includes(ra.permitStatus),
    environmentalAddressed: envClean,
    titleClear: ra.titleInsurance === "Obtained",
    propertyInsured: ra.propertyInsurance === "Obtained",
    // Market
    strongComps: compsCount >= 3,
    growingNeighborhood: ["Growing", "Stable"].includes(vm.populationTrend),
    housingNeed: !!(vm.communityImpact && vm.communityImpact.trim()),
    opportunityZone: subsidyCount > 0,
  };

  const autoFlags: Record<string, boolean> = {};
  Object.keys(checks).forEach((k) => { autoFlags[k] = true; });

  return { checks, autoFlags };
};
