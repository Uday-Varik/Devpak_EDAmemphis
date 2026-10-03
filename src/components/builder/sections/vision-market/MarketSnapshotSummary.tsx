import { TrendingUp, Home, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketSnapshotSummaryProps {
  formData: Record<string, any>;
  avgPricePerSqFt: number;
}

const formatCurrency = (num: number) =>
  num ? `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—";

const getVacancyColor = (rate: number) => {
  if (rate === 0) return "text-muted-foreground";
  if (rate < 5) return "text-green-600";
  if (rate <= 10) return "text-amber-600";
  return "text-red-600";
};

const getVacancyBg = (rate: number) => {
  if (rate === 0) return "bg-muted";
  if (rate < 5) return "bg-green-50";
  if (rate <= 10) return "bg-amber-50";
  return "bg-red-50";
};

const getTrendColor = (trend: string) => {
  if (["Appreciating", "Emerging"].includes(trend)) return "text-green-600";
  if (trend === "Stable") return "text-amber-600";
  if (trend === "Declining") return "text-red-600";
  return "text-muted-foreground";
};

const getTrendBg = (trend: string) => {
  if (["Appreciating", "Emerging"].includes(trend)) return "bg-green-50";
  if (trend === "Stable") return "bg-amber-50";
  if (trend === "Declining") return "bg-red-50";
  return "bg-muted";
};

export const MarketSnapshotSummary = ({ formData, avgPricePerSqFt }: MarketSnapshotSummaryProps) => {
  return (
    <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
      <div className="bg-primary px-5 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary-foreground" />
          <h3 className="text-sm font-semibold text-primary-foreground tracking-wide uppercase">
            Market Snapshot
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Neighborhood */}
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Neighborhood</span>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {formData.neighborhoodName || "Not specified"}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Median Home Price</span>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {formatCurrency(formData.medianHomePrice)}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Average Rent</span>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {formData.averageRent ? `${formatCurrency(formData.averageRent)}/mo` : "—"}
            </p>
          </div>
        </div>

        {/* Vacancy Rate */}
        <div className={`flex items-center justify-between rounded-lg p-3 ${getVacancyBg(formData.vacancyRate)}`}>
          <span className="text-xs font-medium text-muted-foreground">Vacancy Rate</span>
          <span className={`text-sm font-bold ${getVacancyColor(formData.vacancyRate)}`}>
            {formData.vacancyRate > 0 ? `${formData.vacancyRate}%` : "—"}
          </span>
        </div>

        {/* Market Trend */}
        {formData.marketTrend && (
          <div className={`flex items-center justify-between rounded-lg p-3 ${getTrendBg(formData.marketTrend)}`}>
            <span className="text-xs font-medium text-muted-foreground">Market Trend</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`w-3.5 h-3.5 ${getTrendColor(formData.marketTrend)}`} />
              <span className={`text-sm font-bold ${getTrendColor(formData.marketTrend)}`}>
                {formData.marketTrend}
              </span>
            </div>
          </div>
        )}

        {/* Comps Summary */}
        <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Comps Entered</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {formData.comparables?.length || 0}
          </span>
        </div>

        {avgPricePerSqFt > 0 && (
          <div className="flex items-center justify-between bg-secondary/5 border border-secondary/20 rounded-lg p-3">
            <span className="text-xs font-medium text-muted-foreground">Avg Comp $/SqFt</span>
            <span className="text-sm font-bold text-secondary">
              ${avgPricePerSqFt.toFixed(2)}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
