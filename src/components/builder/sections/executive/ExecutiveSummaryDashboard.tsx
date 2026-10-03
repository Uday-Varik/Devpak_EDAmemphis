import { CheckCircle, AlertTriangle, XCircle, TrendingDown, Check, Calendar, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { countCompletedSections, PACKAGE_SECTIONS } from "@/utils/narrativeStaleness";

interface ExecutiveSummaryDashboardProps {
  calcs: {
    tdc: number;
    arv: number;
    hasARV: boolean;
    netProfit: number;
    roi: number;
    profitMargin: number;
    equity: number;
    bankLoan: number;
    privateLender: number;
    totalSubsidies: number;
    totalSources: number;
    fundingGap: number;
    allInBasisPassed: boolean;
    seventyPassed: boolean;
    exitStrategy: string;
    sqftPlanned: number;
    constructionPerSF: number;
    totalPerSF: number;
    salePerSF: number;
    // Rental metrics (for "rent" exit strategy)
    noi?: number;
    capRate?: number;
    dscr?: number;
    cashOnCash?: number;
    hasRentalData?: boolean;
    // Schedule
    totalDurationWeeks: number;
    milestonesComplete: number;
    milestonesInProgress: number;
    milestonesDelayed: number;
    milestones: any[];
    // Risk
    riskCount: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    insuranceObtained: number;
    // Resilience
    resiliencePercent: number;
    resilienceLabel: string;
  };
  sectionsCompleted: Record<string, boolean>;
}

type DealStrength = "strong" | "moderate" | "weak";

const formatCompact = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
const formatCurrency = (value: number): string =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const ExecutiveSummaryDashboard = ({
  calcs,
  sectionsCompleted,
}: ExecutiveSummaryDashboardProps) => {
  const dealStrength: DealStrength | null = (() => {
    if (calcs.exitStrategy === "rent") {
      if (!calcs.hasRentalData) return null;
      const cr = calcs.capRate || 0;
      const ds = calcs.dscr || 0;
      if (cr >= 8 && ds >= 1.25) return "strong";
      if (cr >= 6 && ds >= 1.0) return "moderate";
      return "weak";
    }
    if (!calcs.hasARV) return null;
    if (calcs.roi > 20) return "strong";
    if (calcs.roi >= 10) return "moderate";
    return "weak";
  })();

  const getDealHealthConfig = () => {
    if (dealStrength === null) {
      return {
        bgClass: "bg-gradient-to-br from-muted to-muted/80 border-border",
        icon: <TrendingDown className="w-8 h-8 text-muted-foreground" />,
        title: "Complete Sections",
        titleClass: "text-muted-foreground",
        subtitle: "Finish Budget & Feasibility for deal health",
      };
    }
    switch (dealStrength) {
      case "strong":
        return {
          bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
          icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
          title: "Strong Deal",
          titleClass: "text-emerald-700",
          subtitle: "Returns exceed targets",
        };
      case "moderate":
        return {
          bgClass: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          title: "Moderate Deal",
          titleClass: "text-amber-700",
          subtitle: "Returns meet minimum thresholds",
        };
      case "weak":
        return {
          bgClass: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: "Weak Deal",
          titleClass: "text-red-700",
          subtitle: "Returns below targets",
        };
    }
  };

  const dealHealth = getDealHealthConfig();
  const isFullyFunded = calcs.fundingGap <= 0;

  // Funding breakdown percentages
  const equityPct = calcs.tdc > 0 ? (calcs.equity / calcs.tdc) * 100 : 0;
  const debtPct = calcs.tdc > 0 ? ((calcs.bankLoan + calcs.privateLender) / calcs.tdc) * 100 : 0;
  const subsidyPct = calcs.tdc > 0 ? (calcs.totalSubsidies / calcs.tdc) * 100 : 0;

  // Package completion
  const completedCount = countCompletedSections(sectionsCompleted);
  const packagePercent = Math.round((completedCount / PACKAGE_SECTIONS.length) * 100);

  // Schedule progress
  const scheduleProgress = calcs.milestones.length > 0
    ? Math.round((calcs.milestonesComplete / calcs.milestones.length) * 100)
    : 0;

  const PassFailBadge = ({ passed, label, showDash }: { passed: boolean; label: string; showDash?: boolean }) => {
    if (showDash) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
          {label} —
        </span>
      );
    }
    return (
      <span
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          passed
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-red-100 text-red-700 border border-red-200"
        )}
      >
        {label} {passed ? "✓" : "✗"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border p-6 sticky top-24 space-y-5">
      {/* Deal Health */}
      <div className={cn("rounded-xl p-4 border text-center min-w-0", dealHealth.bgClass)}>
        <div className="flex justify-center mb-2">{dealHealth.icon}</div>
        <p className={cn("font-bold text-lg break-words", dealHealth.titleClass)}>{dealHealth.title}</p>
        <p className="text-xs text-muted-foreground break-words">{dealHealth.subtitle}</p>
      </div>

      {/* Key Numbers */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Key Numbers</p>
        <div className="space-y-2">
          <MetricRow label="Total Investment" value={calcs.tdc > 0 ? formatCompact(calcs.tdc) : "—"} />
          {calcs.exitStrategy === "rent" ? (
            <>
              <MetricRow
                label="Annual NOI"
                value={calcs.hasRentalData ? formatCompact(calcs.noi || 0) : "—"}
                highlight={calcs.hasRentalData ? ((calcs.noi || 0) > 0 ? "green" : "red") : undefined}
              />
              <MetricRow
                label="Cap Rate"
                value={calcs.hasRentalData ? formatPercent(calcs.capRate || 0) : "—"}
                highlight={calcs.hasRentalData ? ((calcs.capRate || 0) >= 7 ? "green" : (calcs.capRate || 0) >= 5 ? undefined : "red") : undefined}
              />
              <MetricRow
                label="DSCR"
                value={calcs.hasRentalData && (calcs.dscr || 0) > 0 ? (calcs.dscr || 0).toFixed(2) : "—"}
                highlight={calcs.hasRentalData ? ((calcs.dscr || 0) >= 1.25 ? "green" : (calcs.dscr || 0) >= 1.0 ? undefined : "red") : undefined}
              />
              <MetricRow
                label="Cash-on-Cash"
                value={calcs.hasRentalData ? formatPercent(calcs.cashOnCash || 0) : "—"}
                highlight={calcs.hasRentalData ? ((calcs.cashOnCash || 0) >= 8 ? "green" : (calcs.cashOnCash || 0) >= 5 ? undefined : "red") : undefined}
              />
            </>
          ) : (
            <>
              <MetricRow label="ARV" value={calcs.hasARV ? formatCompact(calcs.arv) : "—"} />
              <MetricRow
                label="Net Profit"
                value={calcs.hasARV ? formatCompact(calcs.netProfit) : "—"}
                highlight={calcs.hasARV ? (calcs.netProfit > 0 ? "green" : "red") : undefined}
              />
              <MetricRow
                label="ROI"
                value={calcs.hasARV ? formatPercent(calcs.roi) : "—"}
                highlight={calcs.hasARV ? (calcs.roi >= 15 ? "green" : calcs.roi >= 10 ? undefined : "red") : undefined}
              />
              <MetricRow
                label="Profit Margin"
                value={calcs.hasARV ? formatPercent(calcs.profitMargin) : "—"}
              />
            </>
          )}
        </div>
      </div>

      {/* Resilience Score */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Resilience</p>
        </div>
        {calcs.resiliencePercent > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("font-semibold",
                calcs.resiliencePercent >= 70 ? "text-emerald-600" :
                calcs.resiliencePercent >= 40 ? "text-amber-600" : "text-destructive"
              )}>
                {calcs.resiliencePercent}% — {calcs.resilienceLabel}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  calcs.resiliencePercent >= 70 ? "bg-emerald-500" :
                  calcs.resiliencePercent >= 40 ? "bg-amber-500" : "bg-destructive"
                )}
                style={{ width: `${calcs.resiliencePercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Complete Resilience section</p>
        )}
      </div>

      {/* Risk Summary */}
      {calcs.riskCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Risks</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {calcs.highRisks > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                {calcs.highRisks} High
              </span>
            )}
            {calcs.mediumRisks > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {calcs.mediumRisks} Med
              </span>
            )}
            {calcs.lowRisks > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {calcs.lowRisks} Low
              </span>
            )}
          </div>
          <MetricRow
            label="Insurance"
            value={`${calcs.insuranceObtained}/4`}
            highlight={calcs.insuranceObtained >= 3 ? "green" : calcs.insuranceObtained >= 2 ? undefined : "red"}
          />
        </div>
      )}

      {/* Schedule Progress */}
      {calcs.milestones.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Schedule</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{calcs.totalDurationWeeks} weeks</span>
              <span className="font-medium">{scheduleProgress}% complete</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${scheduleProgress}%` }}
              />
            </div>
            {calcs.milestonesDelayed > 0 && (
              <p className="text-xs text-destructive font-medium">{calcs.milestonesDelayed} milestone{calcs.milestonesDelayed > 1 ? "s" : ""} delayed</p>
            )}
          </div>
        </div>
      )}

      {/* Funding Status */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Funding Status</p>
        {calcs.tdc > 0 ? (
          <>
            <div className="h-3 rounded-full overflow-hidden bg-muted flex">
              {equityPct > 0 && (
                <div className="bg-primary transition-all duration-500" style={{ width: `${equityPct}%` }} />
              )}
              {debtPct > 0 && (
                <div className="bg-secondary transition-all duration-500" style={{ width: `${debtPct}%` }} />
              )}
              {subsidyPct > 0 && (
                <div className="bg-warning transition-all duration-500" style={{ width: `${subsidyPct}%` }} />
              )}
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                  <span className="text-muted-foreground">Equity</span>
                </div>
                <span className="font-medium">{formatCompact(calcs.equity)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
                  <span className="text-muted-foreground">Debt</span>
                </div>
                <span className="font-medium">{formatCompact(calcs.bankLoan + calcs.privateLender)}</span>
              </div>
              {calcs.totalSubsidies > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-warning" />
                    <span className="text-muted-foreground">Subsidies</span>
                  </div>
                  <span className="font-medium">{formatCompact(calcs.totalSubsidies)}</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                "rounded-lg p-2 text-center text-xs font-medium",
                isFullyFunded
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}
            >
              {isFullyFunded ? (
                <span className="flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Fully Funded
                </span>
              ) : (
                `Gap: ${formatCurrency(calcs.fundingGap)}`
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Complete Budget to see funding</p>
        )}
      </div>

      {/* Quick Checks */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Quick Checks</p>
        <div className="flex flex-wrap gap-2">
          <PassFailBadge passed={calcs.allInBasisPassed} label="85% Rule" showDash={!calcs.hasARV} />
          <PassFailBadge passed={calcs.seventyPassed} label="70% Rule" showDash={!calcs.hasARV} />
        </div>
      </div>

      {/* Package Completion */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Package Completion</p>
          <span className="text-xs font-semibold text-foreground">{packagePercent}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-500",
              packagePercent === 100 ? "bg-emerald-500" : "bg-secondary"
            )}
            style={{ width: `${packagePercent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{completedCount} of {PACKAGE_SECTIONS.length} sections complete</p>
      </div>
    </div>
  );
};

const MetricRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "red";
}) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span
      className={cn(
        "text-sm font-semibold",
        highlight === "green" && "text-emerald-600",
        highlight === "red" && "text-destructive",
        !highlight && "text-foreground"
      )}
    >
      {value}
    </span>
  </div>
);
