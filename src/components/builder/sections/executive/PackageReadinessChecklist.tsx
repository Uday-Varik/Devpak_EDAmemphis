import { useMemo } from "react";
import { CheckCircle, XCircle, ClipboardCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanAddressPart } from "@/utils/address";
import { computeResilience } from "@/utils/resilience";
import { countCompletedSections, PACKAGE_SECTIONS } from "@/utils/narrativeStaleness";
import { countObtainedInsurance } from "@/utils/riskInsurance";
import type {
  BudgetData, ComparableSale, ExecutiveData, FeasibilityData, ResilienceData, RiskData,
  ScheduleData, SiteData, TeamData, VisionData,
} from "@/types/sectionData";

interface CheckItem {
  label: string;
  passed: boolean;
  section: string;
}

/** Figures computed by the Executive Summary form (see its calcs memo). */
export interface ReadinessCalcs {
  developerName?: string;
  tdc: number;
  [key: string]: unknown;
}

interface PackageReadinessChecklistProps {
  calcs: ReadinessCalcs;
  sectionsCompleted: Record<string, boolean>;
  formData: ExecutiveData;
  budgetData: BudgetData | null;
  visionData: VisionData | null;
  riskData: RiskData | null;
  scheduleData: ScheduleData | null;
  teamData: TeamData | null;
  siteData: SiteData | null;
  feasibilityData: FeasibilityData | null;
  resilienceData: ResilienceData | null;
  developerProfileName?: string;
  onNavigate: (section: string) => void;
}

export const PackageReadinessChecklist = ({
  calcs,
  sectionsCompleted,
  formData,
  budgetData,
  visionData,
  riskData,
  scheduleData,
  teamData,
  siteData,
  feasibilityData,
  resilienceData,
  developerProfileName = "",
  onNavigate,
}: PackageReadinessChecklistProps) => {
  const budget: BudgetData = budgetData || {};
  const vision: VisionData = visionData || {};
  const risk: RiskData = riskData || {};
  const schedule: ScheduleData = scheduleData || {};
  const team: TeamData = teamData || {};
  const site: SiteData = siteData || {};
  const feas: FeasibilityData = feasibilityData || {};
  const resilience: ResilienceData = resilienceData || {};
  const cap = budget.capitalStack || {};

  // Resolve developer name: team.developerName first, then profile fallback
  const resolvedDeveloperName = ((calcs.developerName || "").trim() || (developerProfileName || "").trim());

  // Resilience — shared engine (same source as the snapshot & category breakdown)
  const resilienceScores = computeResilience(resilience);
  const resiliencePercentComputed = resilienceScores.percent;

  const critical: CheckItem[] = useMemo(() => [
    {
      label: "Project address is entered",
      passed: !!cleanAddressPart(site.streetAddress),
      section: "site-location",
    },
    {
      label: "After Repair Value (ARV) is set",
      passed: (feas.saleExit?.arv || 0) > 0,
      section: "feasibility",
    },
    {
      label: "Total Development Cost is calculated",
      passed: calcs.tdc > 0,
      section: "budget-capital",
    },
    {
      label: "At least one funding source identified",
      passed: (cap.developerEquity || 0) > 0 || (cap.bankLoan || 0) > 0 || (cap.privateLender || 0) > 0 || (cap.grant1Amount || 0) > 0,
      section: "budget-capital",
    },
    {
      label: "Developer name is set",
      passed: !!resolvedDeveloperName,
      section: "project-team",
    },
  ], [site, feas, calcs, cap, resolvedDeveloperName]);

  const important: CheckItem[] = useMemo(() => [
    {
      label: "At least 2 comparable properties",
      passed: (vision.comparables || []).filter((c: ComparableSale) => c.address || c.salePrice || c.price).length >= 2,
      section: "vision-market",
    },
    {
      label: "Construction contingency ≥ 10%",
      passed: (budget.hardCosts?.contingencyPercent || 0) >= 10,
      section: "budget-capital",
    },
    {
      label: "At least 3 risks identified",
      passed: (risk.risks || []).length >= 3,
      section: "risk-assessment",
    },
    {
      label: "At least 1 insurance type obtained",
      passed: countObtainedInsurance(risk) > 0,
      section: "risk-assessment",
    },
    {
      label: "Schedule has start date and milestones",
      passed: !!schedule.startDate && (schedule.milestones || []).length > 0,
      section: "project-schedule",
    },
    {
      label: "Exit strategy is defined",
      passed: !!(feas.exitStrategy?.strategy),
      section: "feasibility",
    },
  ], [vision, budget, risk, schedule, feas]);

  const recommended: CheckItem[] = useMemo(() => [
    {
      label: "Project vision statement is written",
      passed: !!(vision.visionStatement || vision.projectVision || "").trim(),
      section: "vision-market",
    },
    {
      label: "Community impact statement is written",
      passed: !!(vision.communityImpact || "").trim(),
      section: "vision-market",
    },
    {
      label: "General contractor is identified",
      passed: !!(team.gc?.companyName || "").trim(),
      section: "project-team",
    },
    {
      label: "Resilience score above 40%",
      passed: resiliencePercentComputed >= 40,
      section: "resilience-factors",
    },
    {
      label: "All sections marked complete",
      passed: countCompletedSections(sectionsCompleted) >= PACKAGE_SECTIONS.length,
      section: "executive-summary",
    },
    {
      label: "Case for Support is written",
      passed: !!(formData.investmentThesis || "").trim(),
      section: "executive-summary",
    },
  ], [vision, team, calcs, sectionsCompleted, formData]);

  const allChecks = [...critical, ...important, ...recommended];
  const passedCount = allChecks.filter(c => c.passed).length;
  const totalCount = allChecks.length;
  const percent = Math.round((passedCount / totalCount) * 100);
  const hasCriticalFailure = critical.some(c => !c.passed);

  const progressColor = percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-destructive";

  const handleClick = (section: string) => {
    if (section === "executive-summary") return;
    onNavigate(section);
  };

  const renderGroup = (title: string, items: CheckItem[], colorClass: string) => (
    <div className="space-y-1.5">
      <p className={cn("text-xs font-semibold uppercase tracking-wider", colorClass)}>{title}</p>
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !item.passed && handleClick(item.section)}
          disabled={item.passed}
          className={cn(
            "w-full flex items-center gap-2 text-xs text-left py-1 rounded transition-colors",
            !item.passed && item.section !== "executive-summary" && "hover:bg-muted/50 cursor-pointer",
            item.passed && "cursor-default"
          )}
        >
          {item.passed ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
          )}
          <span className={cn(item.passed ? "text-muted-foreground" : "text-foreground")}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Package Readiness Check</h3>
            <p className="text-xs text-muted-foreground">Verify your package before sending to a lender</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{passedCount} of {totalCount} checks passed</span>
            <span className={cn("font-semibold", percent >= 80 ? "text-emerald-600" : percent >= 50 ? "text-amber-600" : "text-destructive")}>
              {percent}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-muted">
            <div className={cn("h-full rounded-full transition-all duration-500", progressColor)} style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Critical warning */}
        {hasCriticalFailure && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">Address critical items before sending to a lender</p>
          </div>
        )}

        {/* Checklist groups */}
        {renderGroup("Critical", critical, "text-destructive")}
        {renderGroup("Important", important, "text-amber-600")}
        {renderGroup("Recommended", recommended, "text-muted-foreground")}
      </div>
    </div>
  );
};
