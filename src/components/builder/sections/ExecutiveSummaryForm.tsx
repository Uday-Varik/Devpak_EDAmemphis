import { useState, useMemo, useEffect, useCallback } from "react";
import { computeProjectFinancials, computeSensitivityScenarios, roundCurrency, indefiniteArticle } from "@/utils/calculations";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Save,
  FileDown,
  MapPin,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  Home,
  BarChart3,
  AlertTriangle,
  Users,
  Calendar,
  Shield,
  ShieldAlert,
  Building2,
  Landmark,
  ChevronDown,
  FileText,
  Briefcase,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { generatePDF } from "@/utils/generatePDF";
import { generateLenderSummary } from "@/utils/generateLenderSummary";
import { generateInvestorOnePager } from "@/utils/generateInvestorOnePager";
import { generateExcel } from "@/utils/generateExcel";
import { toast } from "@/hooks/use-toast";
import { ExecutiveSummaryDashboard } from "./executive/ExecutiveSummaryDashboard";
import { PackageReadinessChecklist } from "./executive/PackageReadinessChecklist";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PreExportValidationModal } from "@/components/builder/PreExportValidationModal";
import { AIGenerateButton } from "@/components/ai/AIGenerateButton";
import { computeResilience } from "@/utils/resilience";
import { StaleNarrativeNotice } from "@/components/builder/StaleNarrativeNotice";
import { buildOverviewFingerprint } from "@/utils/narrativeFingerprints";
import { isNarrativeStale, PACKAGE_SECTIONS, countCompletedSections } from "@/utils/narrativeStaleness";
import { composeAddress } from "@/utils/address";

interface ExecutiveSummaryFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  "new-construction": "new construction",
  "renovation-rehab": "renovation/rehab",
  "acquisition-rehab": "acquisition and rehab",
  // legacy
  "gut-renovation": "renovation/rehab",
  "light-renovation": "renovation/rehab",
};

const formatCurrency = (value: number): string =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatCompact = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const ExecutiveSummaryForm = ({
  data,
  onSave,
  saving,
}: ExecutiveSummaryFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [projectData, setProjectData] = useState<any>(null);
  const [scopeData, setScopeData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [feasibilityData, setFeasibilityData] = useState<any>(null);
  const [visionData, setVisionData] = useState<any>(null);
  const [siteData, setSiteData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [resilienceData, setResilienceData] = useState<any>(null);
  const [sectionsCompleted, setSectionsCompleted] = useState<Record<string, boolean>>({});
  const [developerProfileName, setDeveloperProfileName] = useState<string>("");

  const [formData, setFormData] = useState<Record<string, any>>({
    projectOverview: data.projectOverview || "",
    investmentThesis: data.investmentThesis || "",
    overviewEdited: data.overviewEdited || false,
    overviewFingerprint: data.overviewFingerprint || "",
    thesisFingerprint: data.thesisFingerprint || "",
    packagePurpose: data.packagePurpose || "",
    ...data,
  });
  const [exporting, setExporting] = useState<string | null>(null);
  const [pendingExport, setPendingExport] = useState<{ label: string; run: () => Promise<void> } | null>(null);

  const requestExport = (label: string, run: () => Promise<void>) => {
    if (!projectId) return;
    setPendingExport({ label, run });
  };

  const proceedExport = async () => {
    if (!pendingExport) return;
    const { label, run } = pendingExport;
    setPendingExport(null);
    setExporting(`Generating ${label}...`);
    try {
      await run();
      toast({ title: `${label} ready`, description: "Download started." });
    } catch (err) {
      console.error(err);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleAutoSave = useCallback(async (data: any) => {
    // Always persist — never gate autosave on other sections' completion.
    await onSave(data, false);
  }, [onSave]);

  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  // Fetch all section data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      const [projectRes, detailsRes] = await Promise.all([
        supabase.from("projects").select("name, address").eq("id", projectId).single(),
        supabase
          .from("project_details")
          .select("section, data, completed")
          .eq("project_id", projectId),
      ]);

      if (projectRes.data) setProjectData(projectRes.data);

      if (detailsRes.data) {
        const completed: Record<string, boolean> = {};
        detailsRes.data.forEach((d) => {
          completed[d.section] = d.completed;
          const sectionData = d.data as Record<string, any>;
          switch (d.section) {
            case "project-scope": setScopeData(sectionData); break;
            case "budget-capital": setBudgetData(sectionData); break;
            case "feasibility": setFeasibilityData(sectionData); break;
            case "vision-market": setVisionData(sectionData); break;
            case "site-location": setSiteData(sectionData); break;
            case "project-schedule": setScheduleData(sectionData); break;
            case "project-team": setTeamData(sectionData); break;
            case "risk-assessment": setRiskData(sectionData); break;
            case "resilience-factors": setResilienceData(sectionData); break;
          }
        });
        setSectionsCompleted(completed);
      }

      // Fetch developer profile full_name (fallback to profiles.full_name)
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (uid) {
        const { data: dp } = await supabase
          .from("developer_profiles" as any)
          .select("full_name")
          .eq("user_id", uid)
          .maybeSingle();
        let name = ((dp as any)?.full_name || "").trim();
        console.log("[PackageReadiness] developer_profiles.full_name =", (dp as any)?.full_name);
        if (!name) {
          const { data: pr } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", uid)
            .maybeSingle();
          console.log("[PackageReadiness] profiles.full_name =", (pr as any)?.full_name);
          name = ((pr as any)?.full_name || "").trim();
        }
        setDeveloperProfileName(name);
        console.log("[PackageReadiness] resolved developerProfileName =", name);
      }
    };
    fetchData();
  }, [projectId]);

  // Derived calculations from ALL sections
  const calcs = useMemo(() => {
    const budget = budgetData || {};
    const feas = feasibilityData || {};
    const scope = scopeData || {};
    const vision = visionData || {};
    const site = siteData || {};
    const schedule = scheduleData || {};
    const team = teamData || {};
    const risk = riskData || {};
    const resilience = resilienceData || {};

    // Budget totals
    const acq = budget.acquisition || {};
    const hard = budget.hardCosts || {};
    const soft = budget.softCosts || {};
    const holding = budget.holdingCosts || {};
    const cap = budget.capitalStack || {};

    // All budget + sale-side math comes from the shared engine (src/utils/calculations.ts)
    // so this panel, the Feasibility panel and the PDF export can never disagree.
    const fin = computeProjectFinancials({ scope, budget, feasibility: feas });
    const {
      acqTotal, hardTotal, softTotal, holdingTotal, operatingReserves, tdc,
      constructionPerSF, totalPerSF, sqftPlanned,
      landEquity, cashEquity, totalEquity: equity, bankLoan, privateLender,
      grants: totalSubsidies, totalSources, fundingGap,
      arv, salesCostsPct, salesCosts, netTdc, netProfit, roi, roiOnTotalEquity,
      profitMargin, allInBasis, salePerSF,
    } = fin;
    const hasARV = arv > 0;

    const seventyMax = fin.seventyMaxPurchase;
    const exitStrategy = feas.exitStrategy?.strategy || "sell";

    // Break-even / margin of safety: gross basis. Stress return: shared engine (netTdc basis).
    const breakEvenArv = fin.breakEvenArv;
    const marginOfSafety = fin.marginOfSafety;
    const marginOfSafetyPct = fin.marginOfSafetyPercent;
    const worstCaseRoi =
      computeSensitivityScenarios(fin).find((sc) => sc.label.startsWith("Stress"))?.return ?? 0;

    const capParts: string[] = [];
    if (cashEquity > 0) capParts.push(`${formatCompact(cashEquity)} developer equity (cash)`);
    if (landEquity > 0) capParts.push(`${formatCompact(landEquity)} land equity`);
    if (bankLoan > 0) capParts.push(`${formatCompact(bankLoan)} bank financing`);
    if (privateLender > 0) capParts.push(`${formatCompact(privateLender)} private lending`);
    if (totalSubsidies > 0) capParts.push(`${formatCompact(totalSubsidies)} grant funding`);
    const capitalSummary = capParts.join(", ");

    const grants: string[] = [];
    if (cap.grant1Name && cap.grant1Amount > 0) grants.push(`${cap.grant1Name}: ${formatCompact(cap.grant1Amount)}`);
    if (cap.grant2Name && cap.grant2Amount > 0) grants.push(`${cap.grant2Name}: ${formatCompact(cap.grant2Amount)}`);
    if (cap.grant3Name && cap.grant3Amount > 0) grants.push(`${cap.grant3Name}: ${formatCompact(cap.grant3Amount)}`);

    // Rental metrics come from the shared engine so Feasibility, this panel and the
    // PDF export can never disagree on NOI / DSCR / cap rate / cash-on-cash.
    const rentalExit = feas.rentalExit || {};
    const rentUnits = Number(rentalExit.numberOfUnits) || Number(scope.numberOfUnits) || Number(scope.units) || Number(scope.numUnits) || 1;
    const rentPerUnit = Number(rentalExit.monthlyRentPerUnit) || 0;
    const monthlyRent = rentPerUnit * rentUnits;
    const {
      grossRent: grossAnnualRent, egi: effectiveGrossIncome, opex: totalOpEx,
      noi, capRate, dscr, annualDebtService, cashFlow: annualCashFlow, cashOnCash,
    } = fin;
    const monthlyDebtService = annualDebtService / 12;
    const hasRentalData = rentPerUnit > 0;

    const units = Number(scope.numberOfUnits) || Number(scope.units) || Number(scope.numUnits) || 0;
    const bedrooms = Number(scope.bedrooms || scope.bedroomsPerUnit) || 0;
    const bathrooms = Number(scope.bathrooms || scope.bathroomsPerUnit) || 0;

    // Vision & Market data
    const neighborhoodName = vision.neighborhoodName || "";
    const joinMulti = (v: any) => Array.isArray(v) ? v.filter(Boolean).join(" / ") : (v || "");
    const targetMarket = joinMulti(vision.targetMarket);
    const targetIncomeLevel = joinMulti(vision.targetIncomeLevel);
    const communityImpact = vision.communityImpact || "";
    const medianHomePrice = vision.medianHomePrice || 0;
    const averageRent = vision.averageRent || 0;
    const vacancyRate = vision.vacancyRate || 0;
    const marketTrend = vision.marketTrend || "";
    const comps: any[] = vision.comparables || [];
    const avgPricePerSqFt = comps.length > 0
      ? comps.reduce((sum: number, c: any) => sum + ((c.price && c.sqft && c.sqft > 0) ? c.price / c.sqft : 0), 0) / comps.filter((c: any) => c.price && c.sqft && c.sqft > 0).length || 0
      : 0;

    // Site data
    const fullAddress = composeAddress(site.streetAddress, site.city, site.state, site.zipCode);
    const lotSize = site.lotSize || "";
    const lotSizeUnit = site.lotSizeUnit || "sq ft";
    const currentZoning = site.currentZoning || "";
    const currentCondition = site.currentCondition || "";
    const floodZone = site.floodZone || "";
    const subsidyPrograms: any[] = site.subsidyPrograms || [];
    const totalSubsidyValue = subsidyPrograms.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0);
    const subsidyNames = subsidyPrograms.map((p: any) => p.programName).filter(Boolean);

    // Schedule data
    const totalDurationWeeks = schedule.milestones?.length > 0
      ? schedule.milestones.reduce((sum: number, m: any) => sum + (m.durationWeeks || 0), 0)
      : 0;
    const totalMonths = Math.round(totalDurationWeeks / 4.33);
    const scheduleStartDate = schedule.startDate || "";
    const scheduleEndDate = schedule.endDate || "";
    const milestones: any[] = schedule.milestones || [];
    const milestonesComplete = milestones.filter((m: any) => m.status === "Complete").length;
    const milestonesInProgress = milestones.filter((m: any) => m.status === "In Progress").length;
    const milestonesDelayed = milestones.filter((m: any) => m.status === "Delayed").length;

    // Team data
    const developerName = team.developerName || "";
    const developerCompany = team.developerCompany || "";
    const developerRole = team.roleOnProject || "";
    const gcCompany = team.gc?.companyName || "";
    const gcStatus = team.gc?.status || "";
    const architectCompany = team.architect?.companyName || "";
    const architectStatus = team.architect?.status || "";
    const additionalTeamCount = (team.consultants || []).length;

    // Construction & property management
    const constructionManagement = team.constructionManagement || "";
    const propertyManagement = team.propertyManagement || "";

    // Risk data
    const risks: any[] = risk.risks || [];
    const riskCount = risks.length;
    const highRisks = risks.filter((r: any) => r.likelihood === "High").length;
    const mediumRisks = risks.filter((r: any) => r.likelihood === "Medium").length;
    const lowRisks = risks.filter((r: any) => r.likelihood === "Low").length;

    const insurance = risk.insurance || {};
    const insuranceFields = ["buildersRisk", "generalLiability", "titleInsurance", "propertyInsurance"];
    const insuranceObtained = insuranceFields.filter(f => insurance[f] === "Obtained").length;
    const permitStatus = insurance.permitStatus || "";

    // Resilience — single shared source (keys + scoring) so the percentage
    // and the category breakdown can never disagree.
    const resilienceScores = computeResilience(resilience);
    const totalResilienceChecked = resilienceScores.total;
    const financialScore = resilienceScores.financial;
    const projectScore = resilienceScores.project;
    const marketScore = resilienceScores.market;
    const totalResilienceItems = resilienceScores.totalPossible;
    const resiliencePercent = resilienceScores.percent;
    const resilienceLabel = resilienceScores.label;

    return {
      tdc, acqTotal, hardTotal, softTotal, holdingTotal, operatingReserves,
      equity, cashEquity, landEquity, bankLoan, privateLender, totalSubsidies, totalSources, fundingGap,
      arv, hasARV, netProfit, roi, roiOnTotalEquity, profitMargin, allInBasis,
      seventyMax, seventyPassed: (acq.purchasePrice || 0) <= seventyMax,
      allInBasisPassed: allInBasis <= 85,
      exitStrategy, capitalSummary, grants,
      marginOfSafety, marginOfSafetyPct, worstCaseRoi,
      sqftPlanned, constructionPerSF, totalPerSF, salePerSF,
      monthlyRent, capRate, units, bedrooms, bathrooms, salesCostsPct,
      // Rental-exit metrics for snapshot adaptation
      noi, dscr, cashOnCash, hasRentalData, annualCashFlow, monthlyDebtService,
      projectName: projectData?.name || "",
      address: projectData?.address || scope.address || "",
      projectType: scope.projectType || "",
      scopeOfWork: scope.scopeOfWork || scope.projectDescription || "",
      // Vision
      neighborhoodName, targetMarket, targetIncomeLevel, communityImpact,
      medianHomePrice, averageRent, vacancyRate, marketTrend,
      avgPricePerSqFt, compsCount: comps.filter((c: any) => c.price).length,
      // Site
      fullAddress, lotSize, lotSizeUnit, currentZoning, currentCondition, floodZone,
      totalSubsidyValue, subsidyNames,
      // Schedule
      totalDurationWeeks, totalMonths, scheduleStartDate, scheduleEndDate,
      milestones, milestonesComplete, milestonesInProgress, milestonesDelayed,
      // Team
      developerName, developerCompany, developerRole,
      gcCompany, gcStatus, architectCompany, architectStatus,
      additionalTeamCount, constructionManagement, propertyManagement,
      // Risk
      riskCount, highRisks, mediumRisks, lowRisks,
      insuranceObtained, permitStatus,
      // Resilience
      financialScore, projectScore, marketScore,
      totalResilienceChecked, totalResilienceItems, resiliencePercent, resilienceLabel,
    };
  }, [budgetData, feasibilityData, scopeData, projectData, visionData, siteData, scheduleData, teamData, riskData, resilienceData]);

  // Generate overview text — comprehensive 5-paragraph lender pitch
  const generateOverview = useCallback(() => {
    const {
      projectName, projectType, fullAddress, address, scopeOfWork,
      tdc, arv, hasARV, netProfit, roi, capitalSummary, fundingGap,
      sqftPlanned, totalPerSF, salePerSF, exitStrategy,
      units, bedrooms, bathrooms, monthlyRent, capRate, totalSubsidies, equity,
      neighborhoodName, targetMarket, targetIncomeLevel, communityImpact,
      lotSize, lotSizeUnit, currentZoning, currentCondition,
      totalDurationWeeks, totalMonths, scheduleStartDate, scheduleEndDate,
      developerName, developerCompany, totalSubsidyValue, subsidyNames,
    } = calcs;
    const typeLabel = PROJECT_TYPE_LABELS[projectType] || projectType || "development";
    const name = projectName || "[Project Name]";
    const addr = fullAddress || address || "[address]";

    // Paragraph 1: The Opportunity (with site + vision data)
    let p1 = `${name} is ${indefiniteArticle(typeLabel)} ${typeLabel} development opportunity located at ${addr}`;
    if (neighborhoodName) p1 += ` in the ${neighborhoodName} neighborhood`;
    p1 += ".";
    if (lotSize) p1 += ` The property sits on a ${lotSize} ${lotSizeUnit} lot`;
    if (currentZoning) p1 += ` zoned ${currentZoning}`;
    if (currentCondition) p1 += ` and is currently ${currentCondition.toLowerCase()}`;
    if (lotSize || currentZoning || currentCondition) p1 += ".";
    if (scopeOfWork) p1 += ` ${scopeOfWork}`;
    // "4 units, each with 3 bedrooms and 2 bathrooms, totaling 2,400 square feet."
    const roomParts: string[] = [];
    if (bedrooms > 0) roomParts.push(`${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`);
    if (bathrooms > 0) roomParts.push(`${bathrooms} bathroom${bathrooms > 1 ? "s" : ""}`);
    const sqftPhrase = sqftPlanned > 0 ? `${sqftPlanned.toLocaleString()} square feet of living space` : "";
    if (units > 0) {
      let delivery = `${units} unit${units > 1 ? "s" : ""}`;
      if (roomParts.length > 0) {
        delivery += units > 1
          ? `, each with ${roomParts.join(" and ")}`
          : ` with ${roomParts.join(" and ")}`;
      }
      if (sqftPhrase) delivery += `${roomParts.length > 0 ? "," : ""} totaling ${sqftPhrase}`;
      p1 += ` The property will deliver ${delivery}.`;
    } else if (roomParts.length > 0 || sqftPhrase) {
      const tail = [roomParts.join(" and "), sqftPhrase].filter(Boolean).join(", totaling ");
      p1 += ` The property will deliver ${tail}.`;
    }

    // Purpose-driven framing
    const purpose = formData.packagePurpose;
    const debtAsk = (calcs.bankLoan || 0) + (calcs.privateLender || 0);
    let pPurpose = "";
    if (purpose === "loan-request" && debtAsk > 0) {
      pPurpose = `This development package requests ${formatCurrency(debtAsk)} in construction financing to support the project's capital stack.`;
    } else if (purpose === "grant-application" && (calcs.totalSubsidies || 0) > 0) {
      pPurpose = `This project seeks ${formatCurrency(calcs.totalSubsidies)} in grant funding to address community housing needs and close the project's funding gap.`;
    } else if (purpose === "investor-pitch" && hasARV) {
      pPurpose = `This project presents an investment opportunity with projected returns of ${formatPercent(roi)} on invested equity.`;
    } else if (purpose === "internal-planning") {
      pPurpose = `This document captures the project's plan, budget, schedule, and risk profile for internal reference.`;
    }

    // Paragraph 2: Market & Target (from vision)
    let p2 = "";
    if (targetMarket || targetIncomeLevel) {
      p2 = `The project targets ${targetMarket || "the local market"}`;
      if (targetIncomeLevel) p2 += ` with a focus on ${targetIncomeLevel} residents`;
      p2 += ".";
    }
    if (communityImpact) p2 += ` ${communityImpact}`;

    // Paragraph 3: The Investment
    let p3 = `Total development costs are projected at ${formatCurrency(tdc)}`;
    if (sqftPlanned > 0) p3 += ` (${formatCurrency(Math.round(totalPerSF))} per square foot)`;
    if (hasARV) {
      p3 += `, with an after-repair value of ${formatCurrency(arv)}`;
      if (sqftPlanned > 0) p3 += ` (${formatCurrency(Math.round(salePerSF))} per square foot)`;
      p3 += `, yielding an expected profit of ${formatCurrency(netProfit)} and a ${formatPercent(roi)} return on invested equity.`;
    } else {
      p3 += ".";
    }

    // Paragraph 4: Funding + Subsidies
    const fundingStatus = fundingGap <= 0 ? "fully funded" : `seeking ${formatCurrency(fundingGap)} in additional funding`;
    let p4 = `The project is ${fundingStatus}.`;
    if (capitalSummary) p4 += ` Capital sources include ${capitalSummary}.`;
    if (totalSubsidyValue > 0) {
      p4 += ` The project benefits from ${formatCurrency(totalSubsidyValue)} in incentives`;
      if (subsidyNames.length > 0) p4 += ` including ${subsidyNames.join(", ")}`;
      p4 += ".";
    } else if (totalSubsidies > 0 && equity > 0) {
      p4 += ` Grant funding reduces the out-of-pocket equity requirement by ${formatCurrency(totalSubsidies)}.`;
    }

    // Paragraph 5: Timeline & Team
    let p5 = "";
    if (totalDurationWeeks > 0) {
      p5 = `Construction is planned over ${totalDurationWeeks} weeks (${totalMonths} months)`;
      if (scheduleStartDate && scheduleEndDate) p5 += `, from ${scheduleStartDate} to ${scheduleEndDate}`;
      p5 += ".";
    }
    if (developerName || developerCompany) {
      const teamLead = [developerName, developerCompany].filter(Boolean).join(" of ");
      p5 += ` The development team is led by ${teamLead}.`;
    }

    // Paragraph 6: Exit
    let p6 = "";
    if (exitStrategy === "sell") {
      p6 = "The planned exit strategy is to sell the completed property.";
      if (hasARV && sqftPlanned > 0) {
        p6 += ` Comparable sales in the area support the projected ARV.`;
      }
    } else if (exitStrategy === "rent") {
      p6 = "The planned exit strategy is to rent the completed property.";
      if (monthlyRent > 0) {
        p6 += ` Projected rental income of ${formatCurrency(monthlyRent)}/month yields a ${formatPercent(capRate)} cap rate.`;
      }
    } else if (exitStrategy === "rent-then-sell") {
      p6 = "The planned exit strategy is to rent the property initially, then sell after stabilization.";
      if (monthlyRent > 0) {
        p6 += ` Projected rental income of ${formatCurrency(monthlyRent)}/month will generate cash flow during the hold period.`;
      }
    }

    return [p1, pPurpose, p2, p3, p4, p5, p6].filter(Boolean).join("\n\n");
  }, [calcs, formData.packagePurpose]);

  // Fingerprint of the figures the narrative is built from.
  const narrativeFingerprint = useMemo(
    () =>
      buildOverviewFingerprint({
        address: calcs.fullAddress || calcs.address,
        projectType: calcs.projectType,
        tdc: calcs.tdc,
        arv: calcs.arv,
        netProfit: calcs.netProfit,
        roi: calcs.roi,
        noi: calcs.noi,
        units: calcs.units,
        sqftPlanned: calcs.sqftPlanned,
        exitStrategy: calcs.exitStrategy,
        fundingGap: calcs.fundingGap,
        packagePurpose: formData.packagePurpose,
      }),
    [calcs, formData.packagePurpose]
  );

  const overviewStale = isNarrativeStale(
    formData.projectOverview,
    formData.overviewFingerprint,
    narrativeFingerprint
  );
  const thesisStale = isNarrativeStale(
    formData.investmentThesis,
    formData.thesisFingerprint,
    narrativeFingerprint
  );

  useEffect(() => {
    if (!calcs.projectName) return;
    // Auto-regenerate untouched auto-text; leave user-edited text alone and flag it.
    if (!formData.overviewEdited) {
      const next = generateOverview();
      if (next !== formData.projectOverview || formData.overviewFingerprint !== narrativeFingerprint) {
        setFormData((prev) => ({
          ...prev,
          projectOverview: next,
          overviewFingerprint: narrativeFingerprint,
        }));
      }
    }
  }, [narrativeFingerprint, calcs.projectName]);

  const handleRegenerate = () => {
    setFormData((prev) => ({
      ...prev,
      projectOverview: generateOverview(),
      overviewEdited: false,
      overviewFingerprint: narrativeFingerprint,
    }));
  };

  const handleSaveDraft = async () => {
    await onSave(formData, false);
  };

  const canComplete = formData.projectOverview.length > 0 &&
    sectionsCompleted["budget-capital"] &&
    sectionsCompleted["feasibility"];

  const handleSaveAndComplete = async () => {
    if (!canComplete) return;
    await onSave(formData, true);
  };

  const activeWarnings = useMemo(() => {
    const warnings: string[] = [];
    PACKAGE_SECTIONS.forEach(({ key, label }) => {
      if (!sectionsCompleted[key]) warnings.push(`${label} is incomplete`);
    });
    return warnings;
  }, [sectionsCompleted]);


  // Financial highlights with market data
  const financialHighlights = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    items.push({ label: "Total Development Cost", value: formatCurrency(calcs.tdc) });
    items.push({ label: "Acquisition", value: formatCurrency(calcs.acqTotal) });
    items.push({ label: "Construction Costs", value: formatCurrency(calcs.hardTotal) });
    items.push({ label: "Pre-Development Costs", value: formatCurrency(calcs.softTotal) });
    items.push({ label: "Holding Costs", value: formatCurrency(calcs.holdingTotal) });
    items.push({ label: "Operating Reserves", value: formatCurrency(calcs.operatingReserves) });
    if (calcs.sqftPlanned > 0) {
      items.push({ label: "Construction $/SF", value: formatCurrency(Math.round(calcs.constructionPerSF)) });
      items.push({ label: "Total $/SF", value: formatCurrency(Math.round(calcs.totalPerSF)) });
      if (calcs.hasARV) items.push({ label: "Sale $/SF", value: formatCurrency(Math.round(calcs.salePerSF)) });
    }
    // Market data
    if (calcs.avgPricePerSqFt > 0) items.push({ label: "Comparable Avg $/SF", value: formatCurrency(Math.round(calcs.avgPricePerSqFt)) });
    if (calcs.vacancyRate > 0) items.push({ label: "Vacancy Rate", value: `${calcs.vacancyRate}%` });
    if (calcs.marketTrend) items.push({ label: "Market Trend", value: calcs.marketTrend });
    if (calcs.totalSubsidyValue > 0) items.push({ label: "Total Subsidy Value", value: formatCurrency(calcs.totalSubsidyValue) });
    if (calcs.capitalSummary) {
      items.push({ label: "Funding", value: calcs.capitalSummary });
    }
    if (calcs.hasARV) {
      items.push({ label: "Key Returns", value: `ROI ${formatPercent(calcs.roi)}, Profit Margin ${formatPercent(calcs.profitMargin)}` });
    }
    return items;
  }, [calcs]);

  // Risk items from feasibility + risk section
  const riskItems = useMemo(() => {
    const items: string[] = [];
    if (calcs.hasARV) {
      items.push(`Stress test scenario shows ${formatPercent(calcs.worstCaseRoi)} return`);
      if (calcs.marginOfSafety !== 0) {
        items.push(`Margin of Safety: ${formatCompact(calcs.marginOfSafety)} buffer (${formatPercent(calcs.marginOfSafetyPct)})`);
      }
    }
    if (calcs.fundingGap > 0) items.push(`Funding gap of ${formatCurrency(calcs.fundingGap)} needs to be addressed`);
    if (!calcs.allInBasisPassed && calcs.hasARV) items.push("All-in basis exceeds 85% of ARV");
    if (!calcs.seventyPassed && calcs.hasARV) items.push("Purchase price exceeds 70% rule max");
    return items;
  }, [calcs]);

  const EXIT_LABELS: Record<string, string> = {
    sell: "Sell",
    rent: "Rent",
    "rent-then-sell": "Rent → Sell",
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      "Engaged": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Under Contract": "bg-amber-100 text-amber-700 border-amber-200",
      "Identified": "bg-amber-100 text-amber-700 border-amber-200",
      "Not Yet Identified": "bg-red-100 text-red-700 border-red-200",
      "Not Required": "bg-muted text-muted-foreground border-border",
    };
    return config[status] || "bg-muted text-muted-foreground border-border";
  };

  const completedCount = countCompletedSections(sectionsCompleted);
  const packagePercent = Math.round((completedCount / PACKAGE_SECTIONS.length) * 100);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Side: Content */}
      <div className="flex-1 min-w-0 space-y-6 xl:basis-[65%] xl:grow-0">
        {/* Incomplete sections warning */}
        {activeWarnings.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {activeWarnings.length} of {PACKAGE_SECTIONS.length} sections incomplete
                </p>
                <ul className="text-sm text-amber-700 mt-1 space-y-0.5">
                  {activeWarnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 0: Package Purpose */}
        <div className="bg-white border-2 border-primary/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Package Purpose</h3>
                <p className="text-xs text-muted-foreground">Who is this package for? Your answer shapes the framing throughout.</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "loan-request", title: "Loan Request", desc: "I am presenting to a lender for construction financing." },
                { id: "grant-application", title: "Grant Application", desc: "I am presenting to a grant funder for gap financing." },
                { id: "investor-pitch", title: "Investor Pitch", desc: "I am presenting to a private investor or partner." },
                { id: "internal-planning", title: "Internal Planning", desc: "I am documenting a project for my own records." },
              ].map((opt) => {
                const selected = formData.packagePurpose === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, packagePurpose: opt.id }))}
                    className={cn(
                      "text-left p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-white hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                          selected ? "border-primary" : "border-muted-foreground/40"
                        )}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{opt.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!formData.packagePurpose && (
              <p className="text-xs text-amber-700 mt-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Select a purpose before exporting your package.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 1: Deal Snapshot */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Deal Snapshot</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SnapshotItem icon={Home} label="Project" value={calcs.projectName || "—"} />
              <SnapshotItem icon={MapPin} label="Address" value={calcs.fullAddress || calcs.address || "—"} className="col-span-2" />
              <SnapshotItem icon={Building2} label="Neighborhood" value={calcs.neighborhoodName || "—"} />
              <SnapshotItem icon={Target} label="Target Market" value={calcs.targetMarket || "—"} />
              <SnapshotItem icon={DollarSign} label="Total Investment" value={calcs.tdc > 0 ? formatCompact(calcs.tdc) : "—"} highlight={calcs.tdc > 0} />
              {calcs.exitStrategy === "rent" ? (
                <>
                  <SnapshotItem icon={TrendingUp} label="Annual NOI" value={calcs.hasRentalData ? formatCompact(calcs.noi) : "—"} highlight={calcs.hasRentalData && calcs.noi > 0} />
                  <SnapshotItem icon={DollarSign} label="Cap Rate" value={calcs.hasRentalData ? formatPercent(calcs.capRate) : "—"} highlight={calcs.hasRentalData && calcs.capRate >= 7} />
                  <SnapshotItem icon={TrendingUp} label="DSCR" value={calcs.hasRentalData && calcs.dscr > 0 ? calcs.dscr.toFixed(2) : "—"} highlight={calcs.hasRentalData && calcs.dscr >= 1.25} />
                </>
              ) : (
                <>
                  <SnapshotItem icon={TrendingUp} label="After Repair Value" value={calcs.hasARV ? formatCompact(calcs.arv) : "—"} highlight={calcs.hasARV} />
                  <SnapshotItem icon={DollarSign} label="Net Profit" value={calcs.hasARV ? formatCompact(calcs.netProfit) : "—"} highlight={calcs.hasARV && calcs.netProfit > 0} />
                  <SnapshotItem icon={TrendingUp} label="ROI (Cash)" value={calcs.hasARV ? formatPercent(calcs.roi) : "—"} highlight={calcs.hasARV && calcs.roi > 15} />
                </>
              )}
              <SnapshotItem icon={Target} label="Exit Strategy" value={EXIT_LABELS[calcs.exitStrategy] || "—"} />
              <SnapshotItem icon={Clock} label="Duration" value={calcs.totalDurationWeeks > 0 ? `${calcs.totalDurationWeeks}w (${calcs.totalMonths}mo)` : "—"} />
              {calcs.landEquity > 0 && (
                <SnapshotItem icon={Landmark} label="Developer Equity" value={`${formatCompact(calcs.cashEquity)} cash + ${formatCompact(calcs.landEquity)} land`} />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Project Overview */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Project Overview</h3>
                <p className="text-xs text-muted-foreground">Auto-generated from all sections • Editable</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AIGenerateButton
                section="executive-summary.projectOverview"
                context={{
                  projectName: calcs.projectName,
                  address: calcs.fullAddress || calcs.address,
                  projectType: calcs.projectType,
                  units: calcs.units,
                  sqftPlanned: calcs.sqftPlanned,
                  tdc: roundCurrency(calcs.tdc),
                  arv: roundCurrency(calcs.arv),
                  noi: roundCurrency(calcs.noi),
                  exitStrategy: calcs.exitStrategy,
                  capitalSummary: calcs.capitalSummary,
                  scopeOfWork: calcs.scopeOfWork,
                  packagePurpose: formData.packagePurpose,
                }}
                currentValue={formData.projectOverview || ""}
                onInsert={(t) =>
                  setFormData((prev) => ({ ...prev, projectOverview: t, overviewEdited: true, overviewFingerprint: narrativeFingerprint }))
                }
                prompt={`Write a professional project overview for a development package. Project: ${calcs.projectName} at ${calcs.fullAddress || calcs.address}. ${calcs.projectType} project with ${calcs.units} unit(s), ${calcs.sqftPlanned} sq ft planned. Total development cost: ${formatCurrency(calcs.tdc)}. ${calcs.arv ? `ARV: ${formatCurrency(calcs.arv)}.` : ""} ${calcs.noi ? `NOI: ${formatCurrency(calcs.noi)}.` : ""} Exit strategy: ${calcs.exitStrategy}. Capital sources: ${calcs.capitalSummary}. Write 3-4 sentences suitable for the opening page of a lender package.`}
                label="AI"
              />
              <Button variant="outline" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <StaleNarrativeNotice
              stale={overviewStale}
              message="Figures have changed since this overview was written. It will appear in the PDF as-is."
              onRegenerate={handleRegenerate}
            />
            <Textarea
              value={formData.projectOverview}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  projectOverview: e.target.value,
                  overviewEdited: true,
                  overviewFingerprint: narrativeFingerprint,
                }))
              }
              rows={12}
              className="border-border focus-visible:ring-primary/30 text-sm leading-relaxed"
              placeholder="Your project overview will be auto-generated from your section data..."
            />
          </div>
        </div>

        {/* SECTION 3: Financial Highlights */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Financial Highlights</h3>
                <p className="text-xs text-muted-foreground">From Budget, Feasibility & Market Analysis</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-2.5">
              {financialHighlights.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">{item.label}:</span>{" "}
                    <span className="text-muted-foreground">{item.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION 4: Team & Schedule Summary */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Team & Schedule Summary</h3>
                <p className="text-xs text-muted-foreground">From Project Team & Schedule sections</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Team */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Developer</span>
                    <span className="font-medium text-foreground">
                      {calcs.developerName ? `${calcs.developerName}${calcs.developerRole ? ` — ${calcs.developerRole}` : ""}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">General Contractor</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{calcs.gcCompany || "—"}</span>
                      {calcs.gcStatus && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", getStatusBadge(calcs.gcStatus))}>
                          {calcs.gcStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Architect</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{calcs.architectCompany || "—"}</span>
                      {calcs.architectStatus && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", getStatusBadge(calcs.architectStatus))}>
                          {calcs.architectStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  {calcs.additionalTeamCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Additional Members</span>
                      <span className="font-medium text-foreground">{calcs.additionalTeamCount}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Schedule */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">
                      {calcs.totalDurationWeeks > 0 ? `${calcs.totalDurationWeeks} weeks` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Start</span>
                    <span className="font-medium text-foreground">{calcs.scheduleStartDate || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium text-foreground">{calcs.scheduleEndDate || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Milestones</span>
                    <span className="font-medium text-foreground">
                      {calcs.milestones.length > 0
                        ? `${calcs.milestonesComplete} / ${calcs.milestones.length} complete`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Risk & Resilience Snapshot */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Risk & Resilience Snapshot</h3>
                <p className="text-xs text-muted-foreground">From Risk Assessment & Resilience Factors</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Risks */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Summary</p>
                {calcs.riskCount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risks Identified</span>
                      <span className="font-medium text-foreground">{calcs.riskCount}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {calcs.highRisks > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          <span className="text-muted-foreground">{calcs.highRisks} High</span>
                        </span>
                      )}
                      {calcs.mediumRisks > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">{calcs.mediumRisks} Medium</span>
                        </span>
                      )}
                      {calcs.lowRisks > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">{calcs.lowRisks} Low</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Insurance</span>
                      <span className={cn("font-medium", calcs.insuranceObtained === 4 ? "text-emerald-600" : calcs.insuranceObtained >= 2 ? "text-amber-600" : "text-destructive")}>
                        {calcs.insuranceObtained} of 4 obtained
                      </span>
                    </div>
                    {calcs.permitStatus && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Permits</span>
                        <span className="font-medium text-foreground">{calcs.permitStatus}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Complete Risk Assessment section</p>
                )}

                {/* Feasibility risk highlights */}
                {riskItems.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-1.5">
                    {riskItems.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{risk}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resilience */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resilience Score</p>
                {calcs.totalResilienceChecked > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-20 h-20 -rotate-90">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle
                            cx="40" cy="40" r="34" fill="none"
                            stroke={calcs.resiliencePercent >= 70 ? "hsl(var(--success))" : calcs.resiliencePercent >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                            strokeWidth="6"
                            strokeDasharray={`${(calcs.resiliencePercent / 100) * 213.6} 213.6`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-foreground">{calcs.resiliencePercent}%</span>
                      </div>
                      <p className={cn("text-xs font-semibold mt-1",
                        calcs.resiliencePercent >= 70 ? "text-emerald-600" :
                        calcs.resiliencePercent >= 40 ? "text-amber-600" : "text-destructive"
                      )}>
                        {calcs.resilienceLabel}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Financial</span>
                        <span className="font-medium">{calcs.financialScore}/7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Project</span>
                        <span className="font-medium">{calcs.projectScore}/7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Market</span>
                        <span className="font-medium">{calcs.marketScore}/6</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Complete Resilience Factors section</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5.5: Package Readiness Checklist */}
        <PackageReadinessChecklist
          calcs={calcs}
          sectionsCompleted={sectionsCompleted}
          formData={formData}
          budgetData={budgetData}
          visionData={visionData}
          riskData={riskData}
          scheduleData={scheduleData}
          teamData={teamData}
          siteData={siteData}
          feasibilityData={feasibilityData}
          resilienceData={resilienceData}
          developerProfileName={developerProfileName}
          onNavigate={(section) => {
            window.dispatchEvent(new CustomEvent("navigate-section", { detail: { section } }));
          }}
        />

        {/* SECTION 6: Case for Support */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Case for Support</h3>
                <p className="text-xs text-muted-foreground">What makes this deal compelling?</p>
              </div>
            </div>
            {(() => {
              const AI_PROMPTS: Record<string, string> = {
                "loan-request": `Write a compelling case for why a lender should provide construction financing for this project. Project: ${calcs.projectName} at ${calcs.fullAddress || calcs.address}. ${calcs.projectType} ${calcs.units}-unit project. Total cost: ${formatCurrency(calcs.tdc)}. ARV: ${formatCurrency(calcs.arv)}. Neighborhood: ${calcs.neighborhoodName || "n/a"}. Funding gap: ${formatCurrency(calcs.fundingGap)}. Focus on loan security, market support, developer qualifications, and CRA eligibility. Write 3-4 sentences.`,
                "grant-application": `Write a case for why this project deserves grant funding. Project: ${calcs.projectName} at ${calcs.fullAddress || calcs.address}. ${calcs.units} units serving ${calcs.targetMarket || "local residents"}. Community impact: ${calcs.communityImpact || "addresses local housing needs"}. Focus on community need, housing impact, and alignment with local housing goals. Write 3-4 sentences.`,
                "investor-pitch": `Write a case for why an investor should participate in this project. Project: ${calcs.projectName}. TDC: ${formatCurrency(calcs.tdc)}, ARV: ${formatCurrency(calcs.arv)}, exit strategy: ${calcs.exitStrategy}. Focus on returns, market opportunity, and exit strategy. Write 3-4 sentences.`,
                "internal-planning": `Write an internal investment thesis documenting why this project is worth pursuing. Project: ${calcs.projectName} at ${calcs.fullAddress || calcs.address}. ${calcs.projectType}, ${calcs.units} units, TDC ${formatCurrency(calcs.tdc)}. Write 3-4 sentences.`,
              };
              const aiPrompt = AI_PROMPTS[formData.packagePurpose] ||
                `Write a compelling case for support for this real estate development project. Project: ${calcs.projectName} at ${calcs.fullAddress || calcs.address}. ${calcs.projectType}, ${calcs.units} units, TDC ${formatCurrency(calcs.tdc)}. Write 3-4 sentences.`;
              return (
                <AIGenerateButton
                  section="executive-summary.investmentThesis"
                  context={{
                    projectName: calcs.projectName,
                    address: calcs.fullAddress || calcs.address,
                    projectType: calcs.projectType,
                    units: calcs.units,
                    tdc: roundCurrency(calcs.tdc),
                    arv: roundCurrency(calcs.arv),
                    noi: roundCurrency(calcs.noi),
                    exitStrategy: calcs.exitStrategy,
                    packagePurpose: formData.packagePurpose,
                    neighborhoodName: calcs.neighborhoodName,
                    targetMarket: calcs.targetMarket,
                    communityImpact: calcs.communityImpact,
                    fundingGap: roundCurrency(calcs.fundingGap),
                  }}
                  currentValue={formData.investmentThesis || ""}
                  onInsert={(t) => setFormData((prev) => ({ ...prev, investmentThesis: t, thesisFingerprint: narrativeFingerprint }))}
                  prompt={aiPrompt}
                  maxTokens={500}
                />
              );
            })()}
          </div>
          <div className="p-5">
            {(() => {
              const PROMPTS: Record<string, string> = {
                "loan-request": "Explain why a lender should fund this project. What makes it a safe, performing asset?",
                "grant-application": "Explain the community need this project addresses and how grant funds will be used.",
                "investor-pitch": "Explain why an investor should participate. What is the return structure and exit strategy?",
                "internal-planning": "Document your investment thesis and key assumptions for your own reference.",
              };
              const prompt = PROMPTS[formData.packagePurpose] || "Describe why this is a compelling investment opportunity...";
              return (
                <>
                  <div className="space-y-2">
                    <StaleNarrativeNotice
                      stale={thesisStale}
                      actionLabel="Mark as current"
                      message="Figures have changed since this was written — review the text, then confirm or regenerate it with AI."
                      onRegenerate={() =>
                        setFormData((prev) => ({ ...prev, thesisFingerprint: narrativeFingerprint }))
                      }
                    />
                    <Textarea
                      value={formData.investmentThesis || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          investmentThesis: e.target.value,
                          thesisFingerprint: narrativeFingerprint,
                        }))
                      }
                      rows={5}
                      className="border-border focus-visible:ring-primary/30 text-sm leading-relaxed"
                      placeholder={prompt}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{prompt}</p>
                </>

              );
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <Button
            variant="accent"
            size="lg"
            onClick={handleSaveAndComplete}
            disabled={saving || !canComplete}
          >
            {saving ? "Saving..." : "Mark Complete"}
          </Button>
          <Button variant="outline" size="lg" onClick={handleSaveDraft} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" disabled={!!exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {exporting}
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Package
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem
                onClick={() => requestExport("Full Development Package", () => generatePDF(projectId!))}
              >
                <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Full Development Package (PDF)</p>
                  <p className="text-xs text-muted-foreground">Complete 13-page lender document</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => requestExport("Lender Summary", () => generateLenderSummary(projectId!))}
              >
                <Building2 className="w-4 h-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Lender Summary (PDF)</p>
                  <p className="text-xs text-muted-foreground">Condensed 3-4 page financial overview</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => requestExport("Investor One-Pager", () => generateInvestorOnePager(projectId!))}
              >
                <Briefcase className="w-4 h-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Investor One-Pager (PDF)</p>
                  <p className="text-xs text-muted-foreground">Single-page landscape deal summary</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => requestExport("Excel Workbook", () => generateExcel(projectId!))}
              >
                <FileSpreadsheet className="w-4 h-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Excel Workbook</p>
                  <p className="text-xs text-muted-foreground">8-sheet financial data spreadsheet</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-auto">
            <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          </div>
        </div>
      </div>

      {/* Right Side: Dashboard */}
      <div className="w-full xl:basis-[35%] xl:grow-0 xl:shrink-0">
        <ExecutiveSummaryDashboard
          calcs={calcs}
          sectionsCompleted={sectionsCompleted}
        />
      </div>

      <PreExportValidationModal
        open={!!pendingExport}
        projectId={projectId || ""}
        exportLabel={pendingExport?.label || ""}
        onCancel={() => setPendingExport(null)}
        onProceed={proceedExport}
      />
    </div>
  );
};

// Small helper component for Deal Snapshot grid items
const SnapshotItem = ({
  icon: Icon,
  label,
  value,
  highlight,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) => (
  <div className={cn("bg-muted/30 rounded-lg p-3 min-w-0", className)}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={cn("text-xs font-semibold line-clamp-2", highlight ? "text-foreground" : "text-foreground")} title={value}>
      {value}
    </p>
  </div>
);
