import { useMemo, useState } from "react";
import { Check, AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { computeProjectFinancials } from "@/utils/calculations";

interface BudgetData {
  acquisition: {
    purchasePrice: number;
    closingCosts: number;
    titleRecording: number;
    contingencyPercent: number;
    ownsProperty?: boolean;
    appraisedLandValue?: number;
    originalPurchasePrice?: number;
  };
  hardCosts: {
    foundation: number;
    roofing: number;
    hvac: number;
    electrical: number;
    plumbing: number;
    interiorFinishes: number;
    exteriorLandscaping: number;
    otherHard: number;
    contingencyPercent: number;
  };
  softCosts: {
    architectureEngineering: number;
    permitsFees: number;
    legalAccounting: number;
    insurance: number;
    propertyTaxes: number;
    loanInterestPoints: number;
    marketingLeasing: number;
    otherSoft: number;
    contingencyPercent: number;
  };
  holdingCosts: {
    propertyTaxes: number;
    insurance: number;
    loanPayments: number;
    utilities: number;
    otherHolding: number;
    contingencyPercent: number;
  };
  operatingReserves: number;
  capitalStack: {
    developerEquity: number;
    privateLender: number;
    bankLoan: number;
    grant1Name: string;
    grant1Amount: number;
    grant2Name: string;
    grant2Amount: number;
    grant3Name: string;
    grant3Amount: number;
    otherSources: number;
  };
}

interface BudgetSummaryDashboardProps {
  data: BudgetData;
  /** Project Scope data — needed for per-SF construction mode and land equity rules. */
  scope?: Record<string, any>;
}

/**
 * Budget panel figures. Pure mapping of the shared engine's output — no local
 * arithmetic, so this panel always matches Feasibility, Executive Summary, risks and export.
 */
export const computeBudgetDashboard = (data: Record<string, any>, scope?: Record<string, any>) => {
  const fin = computeProjectFinancials({ scope, budget: data });
  return {
    acquisitionTotal: fin.acqTotal, acqContingencyPct: fin.acqContPct,
    hardCostsTotal: fin.hardTotal, hardContingencyPct: fin.hardContPct,
    softCostsTotal: fin.softTotal, softContingencyPct: fin.softContPct,
    holdingCostsTotal: fin.holdingTotal, holdingContingencyPct: fin.holdingContPct,
    operatingReserves: fin.operatingReserves,
    totalDevelopmentCost: fin.tdc,
    landEquity: fin.landEquity, cashEquity: fin.cashEquity, totalEquity: fin.totalEquity,
    totalSubsidies: fin.grants, totalDebt: fin.totalDebt, totalSources: fin.totalSources,
    fundingGap: fin.fundingGap, percentFunded: fin.percentFunded,
    equityPercent: fin.equityPercent, debtPercent: fin.debtPercent, subsidyPercent: fin.subsidyPercent,
    equityWithoutSubsidies: fin.equityWithoutSubsidies, equityWithSubsidies: fin.equityWithSubsidies,
    subsidySavings: fin.grants,
  };
};

export const BudgetSummaryDashboard = ({ data, scope }: BudgetSummaryDashboardProps) => {
  const [showSubsidyImpact, setShowSubsidyImpact] = useState(false);

  const calculations = useMemo(() => {
    return computeBudgetDashboard(data, scope);
  }, [data, scope]);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatCompact = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  };

  const total = calculations.totalDevelopmentCost || 1;
  const barData = [
    {
      label: "Acquisition",
      detail: `incl. ${calculations.acqContingencyPct}% contingency`,
      value: calculations.acquisitionTotal,
      percent: (calculations.acquisitionTotal / total) * 100,
      color: "bg-[#2E86AB]",
    },
    {
      label: "Construction",
      detail: `incl. ${calculations.hardContingencyPct}% contingency`,
      value: calculations.hardCostsTotal,
      percent: (calculations.hardCostsTotal / total) * 100,
      color: "bg-[#1B4F72]",
    },
    {
      label: "Pre-Development",
      detail: `incl. ${calculations.softContingencyPct}% contingency`,
      value: calculations.softCostsTotal,
      percent: (calculations.softCostsTotal / total) * 100,
      color: "bg-teal-500",
    },
    {
      label: "Holding Costs",
      detail: `incl. ${calculations.holdingContingencyPct}% contingency`,
      value: calculations.holdingCostsTotal,
      percent: (calculations.holdingCostsTotal / total) * 100,
      color: "bg-orange-500",
    },
    ...(calculations.operatingReserves > 0 ? [{
      label: "Reserves",
      detail: "",
      value: calculations.operatingReserves,
      percent: (calculations.operatingReserves / total) * 100,
      color: "bg-amber-500",
    }] : []),
  ];

  const isFullyFunded = calculations.fundingGap <= 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24 space-y-6">
      {/* Total Development Cost */}
      <div className="text-center pb-4 border-b border-gray-100">
        <p className="text-sm text-muted-foreground mb-1">Total Development Cost</p>
        <p className="text-3xl font-bold text-foreground tracking-tight transition-all duration-300">
          {formatCurrency(calculations.totalDevelopmentCost)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Total Project Investment</p>
      </div>

      {/* Cost Breakdown Visualization */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Cost Breakdown</p>
        
        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden bg-gray-100 flex">
          {barData.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                item.color,
                "transition-all duration-500 ease-out",
                index === 0 && "rounded-l-full",
                index === barData.length - 1 && "rounded-r-full"
              )}
              style={{ width: `${item.percent}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 text-xs">
          {barData.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded-sm shrink-0", item.color)} />
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{item.label}</span>
                  {item.detail && (
                    <span className="text-[10px] text-muted-foreground/70">{item.detail}</span>
                  )}
                </div>
              </div>
              <span className="font-medium text-foreground">
                {item.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Funding Status Card */}
      {calculations.totalDevelopmentCost === 0 ? (
        <div className="rounded-xl p-4 bg-gray-100 border border-gray-200">
          <p className="text-sm text-muted-foreground text-center">
            Enter costs to see funding status
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl p-4 transition-all duration-300",
            isFullyFunded
              ? "bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
              : "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {isFullyFunded ? "Funding Status" : "Funding Gap"}
            </span>
            {isFullyFunded ? (
              <div className="flex items-center gap-1 text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">Fully Funded</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {formatCurrency(calculations.fundingGap)}
                </span>
              </div>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/50 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isFullyFunded
                  ? "bg-gradient-to-r from-green-500 to-green-400"
                  : "bg-gradient-to-r from-amber-500 to-amber-400"
              )}
              style={{ width: `${calculations.percentFunded}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {calculations.percentFunded.toFixed(0)}% funded
          </p>
        </div>
      )}

      {/* Subsidy Impact Analysis */}
      {calculations.totalSubsidies > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="subsidy-toggle" className="text-sm font-medium cursor-pointer">
              Show Subsidy Impact
            </Label>
            <Switch
              id="subsidy-toggle"
              checked={showSubsidyImpact}
              onCheckedChange={setShowSubsidyImpact}
            />
          </div>

          {showSubsidyImpact && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Without Subsidies</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(calculations.equityWithoutSubsidies)}
                </p>
                <p className="text-xs text-muted-foreground">equity needed</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <p className="text-xs text-muted-foreground mb-1">With Subsidies</p>
                <p className="text-sm font-semibold text-green-700">
                  {formatCurrency(Math.max(0, calculations.equityWithSubsidies))}
                </p>
                <p className="text-xs text-muted-foreground">equity needed</p>
              </div>
              <div className="col-span-2 bg-green-100 rounded-lg p-3 text-center border border-green-300">
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-bold text-green-700">
                    Subsidy Savings: {formatCurrency(calculations.subsidySavings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">Equity</p>
          <p className="text-xs font-bold text-foreground truncate" title={formatCurrency(calculations.totalEquity)}>
            {formatCompact(calculations.totalEquity)}
          </p>
          {calculations.landEquity > 0 && (
            <p className="text-[10px] text-emerald-600 font-medium">
              {formatCompact(calculations.cashEquity)} cash + {formatCompact(calculations.landEquity)} land
            </p>
          )}
          <p className="text-xs text-primary font-medium">
            {calculations.equityPercent.toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">Debt</p>
          <p className="text-xs font-bold text-foreground truncate" title={formatCurrency(calculations.totalDebt)}>
            {formatCompact(calculations.totalDebt)}
          </p>
          <p className="text-xs text-primary font-medium">
            {calculations.debtPercent.toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">Subsidies</p>
          <p className="text-xs font-bold text-foreground truncate" title={formatCurrency(calculations.totalSubsidies)}>
            {formatCompact(calculations.totalSubsidies)}
          </p>
          <p className="text-xs text-primary font-medium">
            {calculations.subsidyPercent.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};
