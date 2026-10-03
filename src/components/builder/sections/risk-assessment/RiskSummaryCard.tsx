import { useMemo } from "react";
import { ShieldAlert, Shield, FileCheck } from "lucide-react";

interface RiskSummaryCardProps {
  formData: Record<string, any>;
}

export const RiskSummaryCard = ({ formData }: RiskSummaryCardProps) => {
  const risks = formData.risks || [];

  const riskBreakdown = useMemo(() => {
    const high = risks.filter((r: any) => r.likelihood === "High").length;
    const medium = risks.filter((r: any) => r.likelihood === "Medium").length;
    const low = risks.filter((r: any) => r.likelihood === "Low").length;
    return { high, medium, low };
  }, [risks]);

  const insuranceFields = [
    formData.buildersRiskInsurance,
    formData.generalLiabilityInsurance,
    formData.titleInsurance,
    formData.propertyInsurance,
  ];
  const obtainedCount = insuranceFields.filter((v) => v === "Obtained").length;

  const insuranceColor =
    obtainedCount === 4 ? "text-green-600" : obtainedCount > 0 ? "text-amber-600" : "text-red-500";

  const permitColor =
    formData.permitStatus === "All Obtained"
      ? "bg-green-100 text-green-700"
      : formData.permitStatus === "In Progress"
      ? "bg-amber-100 text-amber-700"
      : formData.permitStatus === "Not Started"
      ? "bg-red-100 text-red-700"
      : "bg-muted text-muted-foreground";

  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          Risk Summary
        </h3>

        {/* Total Risks */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="text-2xl font-bold text-foreground">{risks.length}</div>
          <div className="text-xs text-muted-foreground">Risks Identified</div>
        </div>

        {/* Likelihood Breakdown */}
        <div className="mb-4 pb-4 border-b border-border space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">By Likelihood</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">High</span>
            <span className={`text-sm font-semibold ${riskBreakdown.high > 0 ? "text-red-500" : "text-muted-foreground"}`}>
              {riskBreakdown.high}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Medium</span>
            <span className={`text-sm font-semibold ${riskBreakdown.medium > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {riskBreakdown.medium}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Low</span>
            <span className={`text-sm font-semibold ${riskBreakdown.low > 0 ? "text-green-600" : "text-muted-foreground"}`}>
              {riskBreakdown.low}
            </span>
          </div>
        </div>

        {/* Insurance Status */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insurance</span>
          </div>
          <span className={`text-sm font-semibold ${insuranceColor}`}>
            {obtainedCount} of 4 obtained
          </span>
        </div>

        {/* Permit Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Permits</span>
          </div>
          {formData.permitStatus ? (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${permitColor}`}>
              {formData.permitStatus}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not set</span>
          )}
        </div>
      </div>
    </div>
  );
};
