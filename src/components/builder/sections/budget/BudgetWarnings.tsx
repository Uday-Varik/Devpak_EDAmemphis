import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Warning {
  id: string;
  message: string;
}

interface BudgetWarningsProps {
  warnings: Warning[];
}

export const BudgetWarnings = ({ warnings }: BudgetWarningsProps) => {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={cn(
            "bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg",
            "flex items-start gap-3",
            "animate-in fade-in slide-in-from-top-2 duration-300"
          )}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{warning.message}</p>
        </div>
      ))}
    </div>
  );
};

export const calculateWarnings = (data: {
  hardCostsTotal: number;
  softCostsTotal: number;
  constructionContingency: number;
  operatingReserves: number;
}): Warning[] => {
  const warnings: Warning[] = [];

  // Construction contingency too low
  if (data.constructionContingency > 0 && data.constructionContingency < 10) {
    warnings.push({
      id: "low-contingency",
      message:
        "Construction contingency below 10% — consider increasing for unexpected costs. Most lenders expect 15-20% for renovation projects.",
    });
  }

  // Pre-development costs too low relative to construction costs
  if (data.hardCostsTotal > 0 && data.softCostsTotal > 0) {
    const softCostsRatio = data.softCostsTotal / data.hardCostsTotal;
    if (softCostsRatio < 0.15) {
      warnings.push({
        id: "low-soft-costs",
        message:
          "Pre-development costs are below 15% of construction costs. Make sure you've included all professional fees (architect, engineer, attorney), permit costs, insurance, property taxes during construction, and loan interest/points.",
      });
    }
  }

  // No operating reserves
  if (data.hardCostsTotal > 0 && data.operatingReserves === 0) {
    warnings.push({
      id: "no-reserves",
      message:
        "No operating reserves budgeted — lenders typically require 6 months of operating expenses as reserves.",
    });
  }

  return warnings;
};
