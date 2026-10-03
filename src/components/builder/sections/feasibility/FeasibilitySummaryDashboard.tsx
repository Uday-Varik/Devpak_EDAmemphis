import { useMemo, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FeasibilityCalculations } from "./FeasibilityWarnings";
import { computeSensitivityScenarios } from "@/utils/calculations";

interface FeasibilitySummaryDashboardProps {
  data: any;
  budgetData: any;
  calculations: FeasibilityCalculations;
}

type DealStrength = "strong" | "moderate" | "weak";

export const FeasibilitySummaryDashboard = ({
  data,
  budgetData,
  calculations,
}: FeasibilitySummaryDashboardProps) => {
  const [showSubsidyImpact, setShowSubsidyImpact] = useState(false);

  const exitStrategy = data.exitStrategy?.strategy || "sell";
  const includesSale = exitStrategy === "sell" || exitStrategy === "rent-then-sell";
  const includesRental = exitStrategy === "rent" || exitStrategy === "rent-then-sell";
  
  // Check if ARV is entered for sale exit
  const arv = data.saleExit?.arv || 0;
  const hasARV = arv > 0;

  // Gross TDC comes from the shared engine via the calculations prop — never
  // recompute locally (this panel previously understated TDC and diverged from
  // the Executive Summary and PDF export).
  const totalDevelopmentCost = calculations.grossTdc;

  const developerEquity = budgetData?.capitalStack?.developerEquity || 0;
  // Grants total from the shared engine (passed through calculations).
  const totalSubsidies = calculations.totalGrants;

  // Determine deal strength - returns null if no valid data
  const dealStrength: DealStrength | null = useMemo(() => {
    if (includesSale) {
      if (!hasARV) return null; // No ARV entered
      if (calculations.roi > 20) return "strong";
      if (calculations.roi >= 10) return "moderate";
      return "weak";
    }
    if (includesRental) {
      // The rental form stores per-unit rent; once the engine has produced a
      // positive NOI, the rental path has genuine inputs and deal health can
      // be judged on the resulting cap rate.
      if (calculations.noi <= 0) return null;
      if (calculations.capRate > 8) return "strong";
      if (calculations.capRate >= 6) return "moderate";
      return "weak";
    }
    return null;
  }, [calculations, includesSale, includesRental, hasARV]);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatCompact = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getDealHealthConfig = () => {
    if (dealStrength === null) {
      return {
        bgClass: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
        icon: <TrendingDown className="w-8 h-8 text-gray-400" />,
        title: includesSale ? "Enter ARV" : "Enter Rent",
        titleClass: "text-gray-500",
        subtitle: "Add values to see deal health",
      };
    }
    switch (dealStrength) {
      case "strong":
        return {
          bgClass: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: "Strong Deal",
          titleClass: "text-green-700",
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

  const PassFailBadge = ({ passed, label, showDash }: { passed: boolean; label: string; showDash?: boolean }) => {
    if (showDash) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {label}: N/A — no ARV entered
        </span>
      );
    }
    return (
      <span
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          passed
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-100 text-red-700 border border-red-200"
        )}
      >
        {label} {passed ? "✓" : "✗"}
      </span>
    );
  };

  const MetricCard = ({
    label,
    value,
    target,
    isGood,
    large,
    sublabel,
  }: {
    label: string;
    value: string;
    target?: string;
    isGood?: boolean;
    large?: boolean;
    sublabel?: string;
  }) => (
    <div className="bg-gray-50 rounded-lg p-3 min-w-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={cn(
          "font-bold text-foreground transition-all duration-300",
          large ? "text-base" : "text-sm",
          isGood === true && "text-green-600",
          isGood === false && "text-red-600"
        )}
      >
        {value}
      </p>
      {target && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Target: {target}
        </p>
      )}
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  );

  // Sensitivity visualization. For sale exits the worst case comes from the shared
  // engine's Stress Test scenario (netTdc basis, same as the headline ROI).
  const baseReturn = includesSale ? calculations.roi : calculations.capRate;
  const worstCaseReturn = includesSale
    ? computeSensitivityScenarios({
        arv,
        netTdc: calculations.netTdc,
        salesCostsPct: data.saleExit?.salesCostsPercent ?? 8,
        cashEquity: developerEquity,
      }).find((sc) => sc.label.startsWith("Stress"))?.return ?? 0
    : baseReturn * 0.8;
  const maxBar = Math.max(baseReturn, 1);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24 space-y-5">
      {/* Deal Health Indicator */}
      <div className={cn("rounded-xl p-4 border text-center", dealHealth.bgClass)}>
        <div className="flex justify-center mb-2">{dealHealth.icon}</div>
        <p className={cn("font-bold text-xl", dealHealth.titleClass)}>
          {dealHealth.title}
        </p>
        <p className="text-sm text-muted-foreground">{dealHealth.subtitle}</p>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Key Metrics</p>
        
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Total Investment"
            value={formatCompact(totalDevelopmentCost)}
            sublabel={
              totalSubsidies > 0
                ? `Gross basis — ${formatCompact(totalSubsidies)} in grants not deducted`
                : undefined
            }
          />
          
          {includesSale && (
            <>
              <MetricCard
                label="After Repair Value"
                value={hasARV ? formatCompact(arv) : "—"}
              />
              <MetricCard
                label="Net Profit"
                value={hasARV ? formatCompact(calculations.netProfit) : "—"}
                isGood={hasARV ? calculations.netProfit > 0 : undefined}
                large
              />
              <MetricCard
                label="ROI"
                value={hasARV ? formatPercent(calculations.roi) : "—"}
                target=">15%"
                isGood={hasARV ? calculations.roi >= 15 : undefined}
              />
              <MetricCard
                label="Profit Margin"
                value={hasARV ? formatPercent(calculations.profitMargin) : "—"}
                target=">10%"
                isGood={hasARV ? calculations.profitMargin >= 10 : undefined}
              />
              <MetricCard
                label="All-in Basis"
                value={hasARV ? formatPercent(calculations.allInBasis) : "—"}
                isGood={hasARV ? calculations.allInBasisPassed : undefined}
              />
            </>
          )}

          {includesRental && (
            <>
              <MetricCard
                label="Annual NOI"
                value={formatCompact(calculations.noi)}
              />
              <MetricCard
                label="Monthly Cash Flow"
                value={formatCompact(calculations.monthlyCashFlow)}
                isGood={calculations.monthlyCashFlow > 0}
                large
              />
              <MetricCard
                label="Cap Rate"
                value={formatPercent(calculations.capRate)}
                target=">6%"
                isGood={calculations.capRate >= 6}
              />
              <MetricCard
                label="Cash-on-Cash"
                value={formatPercent(calculations.cashOnCash)}
                target=">8%"
                isGood={calculations.cashOnCash >= 8}
              />
              <MetricCard
                label="DSCR"
                value={calculations.dscr.toFixed(2)}
                target=">1.25"
                isGood={calculations.dscr >= 1.25}
              />
            </>
          )}
        </div>
      </div>

      {/* Rule of Thumb Badges */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Quick Checks</p>
        <div className="flex flex-wrap gap-2">
          {includesSale && (
            <>
              <PassFailBadge passed={calculations.allInBasisPassed} label="85% Rule" showDash={!hasARV} />
              <PassFailBadge passed={calculations.seventyPercentPassed} label="70% Rule" showDash={!hasARV} />
            </>
          )}
          {includesRental && (
            <>
              <PassFailBadge passed={calculations.onePercentPassed} label="1% Rule" />
              <PassFailBadge passed={calculations.grmPassed} label="GRM <10" />
            </>
          )}
        </div>
      </div>

      {/* Sensitivity Mini-Visualization */}
      {(calculations.roi > 0 || calculations.capRate > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Return Range</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs w-16">Base</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B4F72] rounded-full transition-all duration-500"
                  style={{ width: `${(baseReturn / maxBar) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-12 text-right">
                {formatPercent(baseReturn)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-16">Worst</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E86AB] rounded-full transition-all duration-500"
                  style={{ width: `${(worstCaseReturn / maxBar) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-12 text-right">
                {formatPercent(worstCaseReturn)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subsidy Impact */}
      {totalSubsidies > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="feasibility-subsidy-toggle" className="text-sm font-medium cursor-pointer">
              Show Subsidy Impact
            </Label>
            <Switch
              id="feasibility-subsidy-toggle"
              checked={showSubsidyImpact}
              onCheckedChange={setShowSubsidyImpact}
            />
          </div>

          {showSubsidyImpact && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground mb-1">Without Subsidies</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCompact(developerEquity + totalSubsidies)}
                </p>
                <p className="text-xs text-muted-foreground">equity needed</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-200">
                <p className="text-xs text-muted-foreground mb-1">With Subsidies</p>
                <p className="text-sm font-semibold text-green-700">
                  {formatCompact(developerEquity)}
                </p>
                <p className="text-xs text-muted-foreground">equity needed</p>
              </div>
              <div className="col-span-2 bg-green-100 rounded-lg p-2.5 text-center border border-green-300">
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-bold text-green-700">
                    Savings: {formatCompact(totalSubsidies)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Margin of Safety - only show when ARV is entered */}
      {includesSale && hasARV && calculations.marginOfSafety !== 0 && (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Margin of Safety</p>
          <p
            className={cn(
              "text-lg font-bold transition-all duration-300",
              calculations.marginOfSafety > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {formatCompact(calculations.marginOfSafety)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercent(calculations.marginOfSafetyPercent)} buffer vs. break-even ARV (gross cost basis)
          </p>
        </div>
      )}
    </div>
  );
};
