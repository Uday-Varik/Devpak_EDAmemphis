import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeasibilityWarning {
  id: string;
  message: string;
  severity: "warning" | "error";
}

interface FeasibilityWarningsProps {
  warnings: FeasibilityWarning[];
}

export const FeasibilityWarnings = ({ warnings }: FeasibilityWarningsProps) => {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-r-lg border-l-4",
            warning.severity === "error"
              ? "bg-red-50 border-red-400"
              : "bg-amber-50 border-amber-400"
          )}
        >
          <AlertTriangle
            className={cn(
              "w-5 h-5 flex-shrink-0 mt-0.5",
              warning.severity === "error" ? "text-red-600" : "text-amber-600"
            )}
          />
          <p
            className={cn(
              "text-sm",
              warning.severity === "error" ? "text-red-800" : "text-amber-800"
            )}
          >
            {warning.message}
          </p>
        </div>
      ))}
    </div>
  );
};

export interface FeasibilityCalculations {
  grossTdc: number;
  totalGrants: number;
  /** TDC − grants, from the shared engine. Used ONLY for netProfit / roi / profitMargin. */
  netTdc: number;
  // Sale calculations
  salesCostsAmount: number;
  netSaleProceeds: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  annualizedRoi: number;
  allInBasis: number;
  seventyPercentMaxPurchase: number;
  seventyPercentPassed: boolean;
  allInBasisPassed: boolean;
  
  // Rental calculations
  grossAnnualRent: number;
  effectiveGrossIncome: number;
  managementAmount: number;
  maintenanceAmount: number;
  reservesAmount: number;
  totalOperatingExpenses: number;
  opExRatio: number;
  noi: number;
  annualDebtService: number;
  monthlyDebtService: number;
  cashFlowBeforeTaxes: number;
  monthlyCashFlow: number;
  capRate: number;
  cashOnCash: number;
  dscr: number;
  onePercentRule: number;
  onePercentPassed: boolean;
  grm: number;
  grmPassed: boolean;
  
  // Comps
  avgPricePerSqft: number;
  yourPricePerSqft: number;
  compVariance: number;
  
  // Sensitivity
  breakEvenArv: number;
  breakEvenCost: number;
  marginOfSafety: number;
  marginOfSafetyPercent: number;
}

export const calculateFeasibilityWarnings = (
  data: any,
  calculations: FeasibilityCalculations,
  budgetData: any
): FeasibilityWarning[] => {
  const warnings: FeasibilityWarning[] = [];

  const exitStrategy = data.exitStrategy?.strategy || "sell";
  const includesSale = exitStrategy === "sell" || exitStrategy === "rent-then-sell";
  const includesRental = exitStrategy === "rent" || exitStrategy === "rent-then-sell";

  // Check if ARV is entered for sale exit
  const hasARV = (data.saleExit?.arv || 0) > 0;

  // Sale warnings - only show when ARV is entered
  if (includesSale && hasARV) {
    if (!calculations.allInBasisPassed && calculations.allInBasis > 0) {
      warnings.push({
        id: "all-in-basis",
        message: `All-in basis of ${calculations.allInBasis.toFixed(1)}% exceeds 85% threshold - limited margin for error`,
        severity: "warning",
      });
    }

    if (!calculations.seventyPercentPassed && calculations.seventyPercentMaxPurchase > 0) {
      const purchasePrice = budgetData?.acquisition?.purchasePrice || 0;
      warnings.push({
        id: "seventy-percent",
        message: `70% rule check failed - purchase price $${purchasePrice.toLocaleString()} above maximum $${calculations.seventyPercentMaxPurchase.toLocaleString()}`,
        severity: "warning",
      });
    }
  }

  // Rental warnings
  if (includesRental) {
    if (calculations.dscr > 0 && calculations.dscr < 1.25) {
      warnings.push({
        id: "dscr-low",
        message: `DSCR of ${calculations.dscr.toFixed(2)} is below typical lender minimum of 1.25`,
        severity: "warning",
      });
    }

    if (calculations.capRate > 0 && calculations.capRate < 6) {
      warnings.push({
        id: "cap-rate-low",
        message: `Cap rate of ${calculations.capRate.toFixed(1)}% is below typical investor threshold of 6%`,
        severity: "warning",
      });
    }
  }

  // Comp variance warning - only show when yourPricePerSqft is valid
  const hasYourPricePerSqft = calculations.yourPricePerSqft > 0;
  if (hasYourPricePerSqft && Math.abs(calculations.compVariance) > 20 && calculations.avgPricePerSqft > 0) {
    warnings.push({
      id: "comp-variance",
      message: `ARV may be optimistic - exceeds comp average by ${calculations.compVariance.toFixed(0)}%`,
      severity: "warning",
    });
  }

  // Sensitivity warnings - only show when ARV > 0
  if (hasARV && calculations.marginOfSafety < 0) {
    warnings.push({
      id: "negative-margin",
      message: `Negative margin of safety - deal is at risk if ARV doesn't meet projections`,
      severity: "error",
    });
  }

  return warnings;
};
