import { cleanAddressPart } from "@/utils/address";
import { MapPin, Ruler, Scale, Droplets, DollarSign, AlertTriangle, Plug } from "lucide-react";

interface SiteLocationSummaryProps {
  formData: Record<string, any>;
  totalSubsidyValue: number;
}

const getFloodZoneColor = (zone: string) => {
  if (!zone) return "bg-muted text-muted-foreground";
  if (zone.includes("Zone X")) return "bg-green-100 text-green-700";
  if (zone === "Unknown") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

export const SiteLocationSummary = ({ formData, totalSubsidyValue }: SiteLocationSummaryProps) => {
  const environmentalCount = (formData.environmentalConcerns || []).filter(
    (c: string) => c !== "None Known"
  ).length;

  const utilitiesCount = (formData.utilitiesAvailable || []).length;

  const address = [formData.streetAddress, formData.city, formData.state, formData.zipCode].map(cleanAddressPart)
    .filter(Boolean)
    .join(", ");

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="sticky top-28">
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Site Summary
        </h3>

        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-sm font-medium text-foreground">
              {address || "Not entered"}
            </p>
          </div>
        </div>

        {/* Lot Size */}
        <div className="flex items-start gap-2.5">
          <Ruler className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Lot Size</p>
            <p className="text-sm font-medium text-foreground">
              {formData.lotSize
                ? `${Number(formData.lotSize).toLocaleString()} ${formData.lotSizeUnit === "acres" ? "acres" : "sq ft"}`
                : "Not entered"}
            </p>
          </div>
        </div>

        {/* Zoning */}
        <div className="flex items-start gap-2.5">
          <Scale className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Zoning</p>
            <p className="text-sm font-medium text-foreground">
              {formData.currentZoning || "Not entered"}
            </p>
          </div>
        </div>

        {/* Flood Zone */}
        <div className="flex items-start gap-2.5">
          <Droplets className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Flood Zone</p>
            {formData.floodZone ? (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${getFloodZoneColor(formData.floodZone)}`}>
                {formData.floodZone}
              </span>
            ) : (
              <p className="text-sm font-medium text-foreground">Not selected</p>
            )}
          </div>
        </div>

        {/* Utilities */}
        <div className="flex items-start gap-2.5">
          <Plug className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Utilities</p>
            <p className={`text-sm font-medium ${utilitiesCount >= 3 ? "text-green-600" : utilitiesCount > 0 ? "text-amber-600" : "text-foreground"}`}>
              {utilitiesCount > 0 ? `${utilitiesCount} of 5 available` : "None selected"}
            </p>
          </div>
        </div>

        {/* Subsidy Value */}
        <div className="flex items-start gap-2.5">
          <DollarSign className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Subsidies</p>
            <p className={`text-sm font-medium ${totalSubsidyValue > 0 ? "text-green-600" : "text-foreground"}`}>
              {totalSubsidyValue > 0 ? formatCurrency(totalSubsidyValue) : "$0"}
            </p>
          </div>
        </div>

        {/* Environmental */}
        <div className="flex items-start gap-2.5">
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${environmentalCount > 0 ? "text-amber-500" : "text-secondary"}`} />
          <div>
            <p className="text-xs text-muted-foreground">Environmental Concerns</p>
            <p className={`text-sm font-medium ${environmentalCount > 0 ? "text-amber-600" : "text-green-600"}`}>
              {environmentalCount > 0 ? `${environmentalCount} flagged` : "None flagged"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};