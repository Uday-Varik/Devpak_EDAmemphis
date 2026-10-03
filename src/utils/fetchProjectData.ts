import { cleanAddressPart, composeAddress } from "@/utils/address";
import { supabase } from "@/integrations/supabase/client";
import type { PDFData } from "@/components/pdf/DevelopmentPackagePDF";
import { computeProjectFinancials, computeSensitivityScenarios, indefiniteArticle, type SensitivityScenario } from "./calculations";
import { isNarrativeStale } from "./narrativeStaleness";
import { buildOverviewFingerprint, buildRationaleFingerprint, generateRationaleText } from "./narrativeFingerprints";


const generatePDFOverview = (d: {
  projectName: string; address: string; tdc: number; arv: number; netProfit: number; roi: number;
  exitStrategy: string; scope: Record<string, any>; visionMarket: Record<string, any>;
  siteLocation: Record<string, any>; schedule: Record<string, any>; team: Record<string, any>;
  preparedBy: string; companyName: string; fundingGap: number; totalSources: number;
  equity: number; bankLoan: number; privateLender: number; grants: number; landEquity?: number;
  packagePurpose?: string; cashOnCash?: number;
}): string => {
  const parts: string[] = [];
  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const projectType = d.scope.projectType || "development";
  const neighborhood = (d.visionMarket.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "");
  const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return s; } };
  const lotSize = d.siteLocation.lotSize || "";
  const lotUnit = d.siteLocation.lotSizeUnit || "";
  const zoning = d.siteLocation.currentZoning || "";
  const condition = d.siteLocation.currentCondition || "";

  let intro = `${d.projectName} is ${indefiniteArticle(projectType)} ${projectType} development opportunity located at ${d.address || "the project site"}`;
  if (neighborhood) intro += ` in the ${neighborhood} neighborhood`;
  if (lotSize) intro += `. The property sits on a ${lotSize} ${lotUnit} lot`;
  if (zoning) intro += ` zoned ${zoning}`;
  if (condition) intro += ` and is currently ${condition}`;
  intro += ".";
  parts.push(intro);

  const debtAsk = (d.bankLoan || 0) + (d.privateLender || 0);
  if (d.packagePurpose === "loan-request" && debtAsk > 0) {
    parts.push(`This development package requests ${fmt(debtAsk)} in construction financing to support the project's capital stack.`);
  } else if (d.packagePurpose === "grant-application" && (d.grants || 0) > 0) {
    parts.push(`This project seeks ${fmt(d.grants)} in grant funding to address community housing needs and close the project's funding gap.`);
  } else if (d.packagePurpose === "investor-pitch" && d.arv > 0) {
    parts.push(`This project presents an investment opportunity with projected returns of ${d.roi.toFixed(1)}% on invested equity.`);
  } else if (d.packagePurpose === "internal-planning") {
    parts.push(`This document captures the project's plan, budget, schedule, and risk profile for internal reference.`);
  }

  const joinMulti = (v: any) => Array.isArray(v) ? v.filter(Boolean).join(" / ") : (v || "");
  const targetMarket = joinMulti(d.visionMarket.targetMarket);
  const incomeLevel = joinMulti(d.visionMarket.targetIncomeLevel);
  if (targetMarket || incomeLevel) {
    let market = "The project targets";
    if (targetMarket) market += ` ${targetMarket}`;
    if (incomeLevel) market += ` with a focus on ${incomeLevel}`;
    market += ".";
    if (d.visionMarket.communityImpact) market += ` ${d.visionMarket.communityImpact}`;
    parts.push(market);
  }

  if (d.tdc > 0) {
    let financial = `Total development costs are projected at ${fmt(d.tdc)}`;
    if (d.arv > 0) financial += ` with an after-repair value of ${fmt(d.arv)}, yielding an expected profit of ${fmt(d.netProfit)} and ROI of ${d.roi.toFixed(1)}%`;
    financial += ".";
    parts.push(financial);
  }

  const sources: string[] = [];
  if (d.equity > 0) sources.push(`${fmt(d.equity)} developer equity (cash)`);
  if ((d.landEquity || 0) > 0) sources.push(`${fmt(d.landEquity!)} land equity from existing property ownership`);
  if (d.bankLoan > 0) sources.push(`${fmt(d.bankLoan)} bank loan`);
  if (d.privateLender > 0) sources.push(`${fmt(d.privateLender)} private lending`);
  if (d.grants > 0) sources.push(`${fmt(d.grants)} in grants`);
  if (sources.length > 0) {
    let funding = `The project is funded with ${sources.join(", ")}`;
    if (d.fundingGap > 0) funding += `. A funding gap of ${fmt(d.fundingGap)} remains to be addressed`;
    funding += ".";
    parts.push(funding);
  }

  const milestones = d.schedule.milestones || [];
  const totalWeeks = milestones.reduce((s: number, m: any) => s + (m.duration || 0), 0);
  if (totalWeeks > 0 || d.schedule.startDate) {
    let sched = "";
    if (totalWeeks > 0) sched += `Construction is planned over ${totalWeeks} weeks (${Math.round(totalWeeks / 4.33)} months)`;
    if (d.schedule.startDate) {
      sched += sched ? `, from ${fmtDate(d.schedule.startDate)}` : `Construction starts ${fmtDate(d.schedule.startDate)}`;
    }
    if (d.schedule.endDate) sched += ` to ${fmtDate(d.schedule.endDate)}`;
    if (sched) { sched += "."; parts.push(sched); }
  }

  if (d.preparedBy) {
    let teamLine = `The development team is led by ${d.preparedBy}`;
    if (d.companyName) teamLine += ` of ${d.companyName}`;
    teamLine += ".";
    parts.push(teamLine);
  }

  return parts.join("\n\n");
};

export interface ProjectExportData extends PDFData {
  landEquity: number;
  cashEquity: number;
  totalEquity: number;
  bankLoan: number;
  privateLender: number;
  grants: number;
  totalSources: number;
  acqTotal: number;
  hardTotal: number;
  softTotal: number;
  holdingTotal: number;
  operatingReserves: number;
  allInBasis: number;
  salesCostsPct: number;
  salesCosts: number;
  netSaleProceeds: number;
  breakEvenArv: number;
  netTdc: number;
  sensitivityScenarios: SensitivityScenario[];
  marginOfSafety: number;
  marginOfSafetyPercent: number;
  seventyMaxPurchase: number;
  purchasePrice: number;
  roiOnTotalEquity: number;
  grossRent: number;
  egi: number;
  opex: number;
  annualDebtService: number;
  cashFlow: number;
  cashOnCash: number;
  onePercentRule: number;
  budgetTotals: Omit<import("./calculations").BudgetTotals, "purchasePrice">;
  noi: number;
  dscr: number;
  capRate: number;
  developerProfile?: any;
}

export const fetchProjectExportData = async (projectId: string): Promise<ProjectExportData> => {
  const [projectRes, detailsRes, profileRes] = await Promise.all([
    supabase.from("projects").select("name, address, user_id").eq("id", projectId).single(),
    supabase.from("project_details").select("section, data, completed").eq("project_id", projectId),
    supabase.auth.getUser(),
  ]);

  if (projectRes.error) throw new Error("Failed to load project");

  const project = projectRes.data;
  const details = detailsRes.data || [];

  let preparedBy = "";
  let developerTitle = "";
  let developerPhone = "";
  let developerEmail = "";
  let companyName = "";
  let developerProfile: any = null;
  if (profileRes.data?.user) {
    // Prefer the new developer_profiles table; fall back to legacy profiles table
    const [{ data: devProfile }, { data: legacy }] = await Promise.all([
      supabase.from("developer_profiles" as any).select("*").eq("user_id", profileRes.data.user.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", profileRes.data.user.id).maybeSingle(),
    ]);
    developerProfile = devProfile || null;
    const dp: any = devProfile || {};
    const lp: any = legacy || {};
    const fullName = (dp.full_name || lp.full_name || "").trim();
    if (fullName.length > 0) {
      preparedBy = fullName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else {
      const email = profileRes.data.user.email || "";
      const localPart = email.split("@")[0] || "Developer";
      preparedBy = localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
    }
    developerTitle = dp.professional_title || lp.title || "";
    developerPhone = dp.phone || lp.phone || "";
    developerEmail = dp.email || profileRes.data.user.email || "";
    companyName = dp.entity_name || lp.company_name || "";
  }

  const sectionMap: Record<string, any> = {};
  details.forEach((d) => { sectionMap[d.section] = d.data; });

  const scope = (sectionMap["project-scope"] as Record<string, any>) || {};
  const budget = (sectionMap["budget-capital"] as Record<string, any>) || {};
  const feasibility = (sectionMap["feasibility"] as Record<string, any>) || {};
  const execSummary = (sectionMap["executive-summary"] as Record<string, any>) || {};
  const visionMarket = (sectionMap["vision-market"] as Record<string, any>) || {};
  const siteLocation = (sectionMap["site-location"] as Record<string, any>) || {};
  const schedule = (sectionMap["project-schedule"] as Record<string, any>) || {};
  const teamData = (sectionMap["project-team"] as Record<string, any>) || {};
  const riskAssessment = (sectionMap["risk-assessment"] as Record<string, any>) || {};
  const resilience = (sectionMap["resilience-factors"] as Record<string, any>) || {};

  const acq = budget.acquisition || {};
  const cap = budget.capitalStack || {};

  // All financial math comes from the shared engine (src/utils/calculations.ts).
  const fin = computeProjectFinancials({ scope, budget, feasibility });
  const {
    acqBase, acqTotal, hardBase, hardTotal, softBase, softTotal,
    holdingBase, holdingTotal, operatingReserves, tdc,
    landEquity, cashEquity, totalEquity: equity, bankLoan, privateLender, grants,
    totalSources, fundingGap,
    arv, salesCostsPct, salesCosts, netTdc, netProfit, roi, roiOnTotalEquity, profitMargin,
    allInBasis, marginOfSafety, marginOfSafetyPercent, exitStrategy,
    grossRent, egi, opex, noi, annualDebtService: annualDS, capRate, dscr, cashFlow, cashOnCash,
    onePercentRule,
  } = fin;


  // Sale-side and per-SF values: shared engine only.
  const { netSaleProceeds, breakEvenArv, seventyMaxPurchase, purchasePrice,
    sqftPlanned, constructionPerSF, totalPerSF, salePerSF } = fin;

  const riskItems: string[] = [];
  if (arv > 0) {
    const stress = computeSensitivityScenarios(fin).find((sc) => sc.label.startsWith("Stress"));
    riskItems.push(`Stress test scenario shows ${(stress?.return ?? 0).toFixed(1)}% return`);
    if (marginOfSafety !== 0) {
      riskItems.push(`Margin of Safety: $${Math.abs(marginOfSafety).toLocaleString()} buffer (${marginOfSafetyPercent.toFixed(1)}%)`);
    }
  }
  if (fundingGap > 0) riskItems.push(`Funding gap of $${fundingGap.toLocaleString()} needs to be addressed`);
  if (allInBasis > 85 && arv > 0) riskItems.push("All-in basis exceeds 85% of ARV");

  // Site & Location is the authoritative address; fall back to the project record.
  const resolvedAddress =
    composeAddress(
      siteLocation.streetAddress,
      siteLocation.city,
      siteLocation.state,
      siteLocation.zipCode
    ) || cleanAddressPart(project.address || scope.address || "");

  // The saved Executive Summary narrative is authoritative. Only synthesize one
  // when the user has never generated/saved any overview text.
  const storedOverview = String(execSummary.projectOverview || "").trim();

  // A stored narrative may only be rendered when its fingerprint still matches
  // the live figures — otherwise it would contradict the numbers on the page.
  const liveOverviewFingerprint = buildOverviewFingerprint({
    address: resolvedAddress,
    projectType: scope.projectType || "",
    tdc,
    arv,
    netProfit,
    roi,
    noi,
    units: Number(scope.numberOfUnits) || Number(scope.units) || Number(scope.numUnits) || 0,
    sqftPlanned,
    exitStrategy,
    fundingGap,
    packagePurpose: execSummary.packagePurpose || "",
  });
  const overviewUsable =
    !!storedOverview &&
    !isNarrativeStale(storedOverview, execSummary.overviewFingerprint, liveOverviewFingerprint);

  const finalOverview =
    (overviewUsable ? storedOverview : "") ||
    generatePDFOverview({
      projectName: project.name,
      address: resolvedAddress,
      tdc, arv, netProfit, roi, exitStrategy,
      scope, visionMarket, siteLocation, schedule, team: teamData,
      preparedBy, companyName, fundingGap, totalSources,
      equity: cashEquity, bankLoan, privateLender, grants, landEquity,
      packagePurpose: execSummary.packagePurpose,
    }) ||
    "";

  // Go/No-Go rationale: same rule — regenerate at export when the stored text
  // no longer matches the live figures.
  const decisionData = (feasibility.decision || {}) as Record<string, any>;
  const storedRationale = String(decisionData.rationale || "").trim();
  const liveRationaleFingerprint = buildRationaleFingerprint({
    decision: decisionData.decision || "",
    roi,
    netProfit,
    marginOfSafetyPercent,
    dscr,
    cashOnCash,
    tdc,
  });
  const rationaleUsable =
    !!storedRationale &&
    !isNarrativeStale(storedRationale, decisionData.rationaleFingerprint, liveRationaleFingerprint);
  const finalRationale = rationaleUsable
    ? storedRationale
    : storedRationale
      ? generateRationaleText({
          includesSale: exitStrategy !== "rent",
          roi, tdc, netProfit, marginOfSafety, marginOfSafetyPercent,
          noi, dscr, capRate, cashOnCash,
        })
      : "";

  return {
    projectName: project.name,
    address: resolvedAddress,
    preparedBy, developerTitle, companyName, developerPhone, developerEmail,
    scope, budget,
    executiveSummary: { ...execSummary, projectOverview: finalOverview },
    feasibility: { ...feasibility, decision: { ...(feasibility.decision || {}), rationale: finalRationale } },
    visionMarket, siteLocation, schedule, team: teamData, riskAssessment, resilience,
    tdc, arv, netProfit, roi, profitMargin, exitStrategy, fundingGap, riskItems,
    sqftPlanned, constructionPerSF, totalPerSF, salePerSF,
    landEquity, cashEquity, totalEquity: equity, bankLoan, privateLender, grants, totalSources,
    acqTotal, hardTotal, softTotal, holdingTotal, operatingReserves, allInBasis, salesCostsPct,
    salesCosts, netSaleProceeds, breakEvenArv, marginOfSafety, marginOfSafetyPercent,
    seventyMaxPurchase, purchasePrice, netTdc,
    sensitivityScenarios: computeSensitivityScenarios(fin),
    roiOnTotalEquity,
    noi, dscr, capRate, grossRent, egi, opex, annualDebtService: annualDS, cashFlow, cashOnCash, onePercentRule,
    budgetTotals: {
      acqBase: fin.acqBase, acqContPct: fin.acqContPct, acqContingency: fin.acqContingency, acqTotal: fin.acqTotal,
      hardBase: fin.hardBase, hardContPct: fin.hardContPct, hardContingency: fin.hardContingency, hardTotal: fin.hardTotal,
      softBase: fin.softBase, softContPct: fin.softContPct, softContingency: fin.softContingency, softTotal: fin.softTotal,
      holdingBase: fin.holdingBase, holdingContPct: fin.holdingContPct, holdingContingency: fin.holdingContingency, holdingTotal: fin.holdingTotal,
      operatingReserves: fin.operatingReserves, tdc: fin.tdc,
    },
    developerProfile,
  };
};
