import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Home, Hammer, FileText, Shield, Layers, Clock, Timer, Landmark, Info, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CurrencyInput, PercentageInput } from "./budget/CurrencyInput";
import { CustomLineItems } from "./budget/CustomLineItems";
import { computeProjectFinancials } from "@/utils/calculations";
import { BudgetSummaryDashboard } from "./budget/BudgetSummaryDashboard";
import { BudgetWarnings, calculateWarnings } from "./budget/BudgetWarnings";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";

interface BudgetCapitalFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const DEFAULT_DATA = {
  acquisition: {
    purchasePrice: 0,
    closingCosts: 0,
    titleRecording: 0,
    contingencyPercent: 5,
    ownsProperty: false,
    appraisedLandValue: 0,
    acquisitionDate: "",
    originalPurchasePrice: 0,
  },
  hardCosts: {
    foundation: 0,
    roofing: 0,
    hvac: 0,
    electrical: 0,
    plumbing: 0,
    interiorFinishes: 0,
    exteriorLandscaping: 0,
    otherHard: 0,
    contingencyPercent: 15,
    customItems: [] as { label: string; amount: number }[],
    usePerSqftEstimate: false,
    costPerSqft: 0,
  },
  softCosts: {
    architectureEngineering: 0,
    permitsFees: 0,
    legalAccounting: 0,
    insurance: 0,
    loanInterestPoints: 0,
    marketingLeasing: 0,
    otherSoft: 0,
    contingencyPercent: 10,
    customItems: [] as { label: string; amount: number }[],
  },
  holdingCosts: {
    propertyTaxes: 0,
    insurance: 0,
    loanPayments: 0,
    utilities: 0,
    otherHolding: 0,
    contingencyPercent: 10,
    customItems: [] as { label: string; amount: number }[],
  },
  operatingReserves: 0,
  capitalStack: {
    developerEquity: 0,
    privateLender: 0,
    bankLoan: 0,
    grant1Name: "",
    grant1Amount: 0,
    grant2Name: "",
    grant2Amount: 0,
    grant3Name: "",
    grant3Amount: 0,
    otherSources: 0,
  },
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Helper to calculate category subtotal (excluding contingencyPercent and customItems)

export const BudgetCapitalForm = ({
  data,
  onSave,
  saving,
}: BudgetCapitalFormProps) => {
  const [formData, setFormData] = useState(() => {
    // Strip legacy softCosts.propertyTaxes (moved to holdingCosts only)
    const { propertyTaxes: _legacyPropTax, ...softCostsClean } = data.softCosts || {};
    return {
      acquisition: { ...DEFAULT_DATA.acquisition, ...data.acquisition },
      hardCosts: { ...DEFAULT_DATA.hardCosts, ...data.hardCosts },
      softCosts: { ...DEFAULT_DATA.softCosts, ...softCostsClean },
      holdingCosts: { ...DEFAULT_DATA.holdingCosts, ...data.holdingCosts },
      operatingReserves: data.operatingReserves ?? (data.contingency?.operatingReserves ?? DEFAULT_DATA.operatingReserves),
      capitalStack: { ...DEFAULT_DATA.capitalStack, ...data.capitalStack },
    };
  });
  const [openSections, setOpenSections] = useState<string[]>(["acquisition"]);

  const { id: projectId } = useParams<{ id: string }>();
  const [siteSubsidyTotal, setSiteSubsidyTotal] = useState(0);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [scopeData, setScopeData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const fetchSiteSubsidies = async () => {
      if (!projectId) return;
      const { data: details } = await supabase
        .from("project_details")
        .select("data")
        .eq("project_id", projectId)
        .eq("section", "site-location")
        .single();
      if (details?.data) {
        const d = details.data as Record<string, any>;
        const total = (d.subsidyPrograms || []).reduce((sum: number, p: any) => sum + (Number(p.estimatedValue) || 0), 0);
        setSiteSubsidyTotal(total);
      }
    };
    const fetchProjectScope = async () => {
      if (!projectId) return;
      const { data: details } = await supabase
        .from("project_details")
        .select("data")
        .eq("project_id", projectId)
        .eq("section", "project-scope")
        .maybeSingle();
      if (details?.data) {
        const d = details.data as Record<string, any>;
        setScopeData(d);
        setProjectType(d.projectType || null);
      }
    };
    fetchSiteSubsidies();
    fetchProjectScope();

    // Re-fetch scope when ProjectScopeForm auto-saves.
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.section === "project-scope") fetchProjectScope();
      if (detail?.section === "site-location") fetchSiteSubsidies();
    };
    window.addEventListener("section-data-updated", handler);
    return () => window.removeEventListener("section-data-updated", handler);
  }, [projectId]);

  const showLandEquity = projectType === "new-construction";

  // Debug: track project type / land equity gating
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[BudgetCapitalForm] projectType:", projectType, "showLandEquity:", showLandEquity);
  }, [projectType, showLandEquity]);

  const handleAutoSave = useCallback(async (data: any) => {
    await onSave(data, false);
    window.dispatchEvent(new CustomEvent("section-data-updated", { detail: { section: "budget-capital" } }));
  }, [onSave]);

  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  // All totals come from the shared engine (src/utils/calculations.ts) — no local arithmetic.
  // The scope is overlaid with the detected project type so land-equity gating matches the form.
  const engineScope = useMemo(
    () => ({ ...(scopeData || {}), projectType: projectType || scopeData?.projectType }),
    [scopeData, projectType]
  );
  const fin = useMemo(
    () => computeProjectFinancials({ scope: engineScope, budget: formData }),
    [formData, engineScope]
  );
  const landEquity = fin.landEquity;
  const totals = {
    acqBase: fin.acqBase, acqContingency: fin.acqContingency, acquisitionTotal: fin.acqTotal,
    hardBase: fin.hardBase, hardContingency: fin.hardContingency, hardCostsTotal: fin.hardTotal,
    softBase: fin.softBase, softContingency: fin.softContingency, softCostsTotal: fin.softTotal,
    holdingBase: fin.holdingBase, holdingContingency: fin.holdingContingency, holdingCostsTotal: fin.holdingTotal,
    operatingReserves: fin.operatingReserves,
    totalDevelopmentCost: fin.tdc,
    landEquity,
  };

  // Calculate warnings
  const warnings = useMemo(
    () =>
      calculateWarnings({
        hardCostsTotal: totals.hardBase,
        softCostsTotal: totals.softBase,
        constructionContingency: formData.hardCosts.contingencyPercent,
        operatingReserves: formData.operatingReserves,
      }),
    [totals, formData.hardCosts.contingencyPercent, formData.operatingReserves]
  );

  // Update nested state helper
  const updateSection = <T extends keyof typeof formData>(
    section: T,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: typeof prev[section] === "object" ? {
        ...(prev[section] as any),
        [field]: value,
      } : value,
    }));
  };

  const addCustomItem = (section: "hardCosts" | "softCosts" | "holdingCosts") => {
    setFormData((prev) => {
      const current = (prev[section] as any).customItems || [];
      if (current.length >= 10) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          customItems: [...current, { label: "", amount: 0 }],
        },
      };
    });
  };

  const updateCustomItem = (section: "hardCosts" | "softCosts" | "holdingCosts", index: number, field: "label" | "amount", value: any) => {
    setFormData((prev) => {
      const items = [...((prev[section] as any).customItems || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [section]: { ...(prev[section] as any), customItems: items } };
    });
  };

  const removeCustomItem = (section: "hardCosts" | "softCosts" | "holdingCosts", index: number) => {
    setFormData((prev) => {
      const items = [...((prev[section] as any).customItems || [])];
      items.splice(index, 1);
      return { ...prev, [section]: { ...(prev[section] as any), customItems: items } };
    });
  };

  const handleSaveDraft = async () => {
    await onSave(formData, false);
  };

  const handleSaveAndContinue = async () => {
    await onSave(formData, true);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Side: Form */}
      <div className="flex-1 min-w-0 space-y-6 xl:basis-[65%] xl:grow-0">
        {/* Warnings */}
        <BudgetWarnings warnings={warnings} />

        {/* Accordion Sections */}
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* ACQUISITION COSTS */}
          <AccordionItem
            value="acquisition"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">
                    Acquisition Costs
                  </span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(totals.acquisitionTotal)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Purchase Price / Land Value</Label>
                  <CurrencyInput
                    value={formData.acquisition.purchasePrice}
                    onChange={(v) => updateSection("acquisition", "purchasePrice", v)}
                    helpText="Enter the agreed-upon purchase price from your purchase agreement, or the appraised value of land you already own. If you already own the property, enter its current market value so lenders can see the full cost basis of the project."
                  />
                </div>

                {/* Land Equity Toggle - only for new construction */}
                {showLandEquity && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="owns-property" className="text-sm font-medium cursor-pointer">
                        Do you already own this property?
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">If you already own the land, the difference between appraised value and what you paid counts as equity for lender purposes.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      id="owns-property"
                      checked={formData.acquisition.ownsProperty || false}
                      onCheckedChange={(checked) => updateSection("acquisition", "ownsProperty", checked)}
                    />
                  </div>

                  {formData.acquisition.ownsProperty && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Appraised Land Value</Label>
                          <CurrencyInput
                            value={formData.acquisition.appraisedLandValue || 0}
                            onChange={(v) => updateSection("acquisition", "appraisedLandValue", v)}
                            helpText="Current appraised or assessed value of the property. Get a formal appraisal or BPO (Broker's Price Opinion) to document this for lenders."
                            placeholder="Current appraised or assessed value"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Original Purchase Price</Label>
                          <CurrencyInput
                            value={formData.acquisition.originalPurchasePrice || 0}
                            onChange={(v) => updateSection("acquisition", "originalPurchasePrice", v)}
                            helpText="What you originally paid for the property, if different from the current purchase price above."
                            placeholder="What you paid for the property"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Acquisition Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.acquisition.acquisitionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.acquisition.acquisitionDate
                                ? format(new Date(formData.acquisition.acquisitionDate), "PPP")
                                : "When did you acquire this property?"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.acquisition.acquisitionDate ? new Date(formData.acquisition.acquisitionDate) : undefined}
                              onSelect={(date) => updateSection("acquisition", "acquisitionDate", date ? date.toISOString().split("T")[0] : "")}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Land Equity Card */}
                      <div className={cn(
                        "rounded-xl p-4 border-l-4 transition-all duration-300",
                        landEquity > 0
                          ? "bg-emerald-50 border-l-emerald-500"
                          : "bg-muted/50 border-l-border"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">Land Equity</span>
                              {landEquity > 0 && totals.totalDevelopmentCost > 0 && (
                                <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                  {((landEquity / totals.totalDevelopmentCost) * 100).toFixed(1)}% of TDC
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-emerald-700 mt-0.5">
                              {formatCurrency(landEquity)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {landEquity > 0
                            ? "This counts as developer equity for lender purposes, reducing your cash requirement."
                            : "No land equity — purchase price meets or exceeds appraised value."}
                        </p>
                        {landEquity > 0 && (
                          <p className="text-xs text-emerald-700 mt-1 italic">
                            Land equity strengthens your position with lenders by reducing the cash equity required. Many Memphis developers leverage existing property ownership to access financing.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}
                {!(showLandEquity && formData.acquisition.ownsProperty) && (
                  <>
                    <div className="space-y-2">
                      <Label>Closing Costs</Label>
                      <CurrencyInput
                        value={formData.acquisition.closingCosts}
                        onChange={(v) => updateSection("acquisition", "closingCosts", v)}
                        helpText="Closing costs are the fees you pay when the property purchase is finalized. They typically run 2-5% of the purchase price and include lender fees, attorney fees, inspections, appraisals, and escrow charges. Ask your lender for a Good Faith Estimate to get accurate numbers."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title & Recording Fees</Label>
                      <CurrencyInput
                        value={formData.acquisition.titleRecording}
                        onChange={(v) => updateSection("acquisition", "titleRecording", v)}
                        helpText="Title insurance protects you and your lender against ownership disputes. Recording fees are what the county charges to officially register the deed. Together these usually run $1,000-$3,000 for residential properties in the Memphis area."
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label>Contingency (%)</Label>
                    <PercentageInput
                      value={formData.acquisition.contingencyPercent}
                      onChange={(v) => updateSection("acquisition", "contingencyPercent", v)}
                      helpText="Buffer for unexpected closing costs, title issues, or purchase price adjustments. 5% is typical."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contingency Amount</Label>
                    <CurrencyInput value={totals.acqContingency} onChange={() => {}} readOnly />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">
                      Acquisition Total (incl. contingency)
                    </Label>
                    <CurrencyInput value={totals.acquisitionTotal} onChange={() => {}} readOnly />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* CONSTRUCTION COSTS */}
          <AccordionItem
            value="hardCosts"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Hammer className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Construction Costs</span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(totals.hardCostsTotal)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                {/* Estimation mode toggle */}
                <div className="flex items-start justify-between gap-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="space-y-0.5">
                    <Label className="font-medium text-foreground">Estimate by cost per square foot</Label>
                    <p className="text-xs text-muted-foreground">
                      Use a single $/SF estimate instead of itemizing categories. Common for early-stage budgets.
                      {(() => {
                        const sf = Number(scopeData?.sqftPlanned) || 0;
                        return sf > 0
                          ? ` Planned SF: ${sf.toLocaleString()}.`
                          : " Set Planned Square Footage in Project Scope to enable calculation.";
                      })()}
                    </p>
                  </div>
                  <Switch
                    checked={!!formData.hardCosts.usePerSqftEstimate}
                    onCheckedChange={(v) => updateSection("hardCosts", "usePerSqftEstimate", v)}
                  />
                </div>

                {formData.hardCosts.usePerSqftEstimate ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cost per Square Foot</Label>
                      <CurrencyInput
                        value={formData.hardCosts.costPerSqft}
                        onChange={(v) => updateSection("hardCosts", "costPerSqft", v)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Memphis benchmarks: $80–$120/SF rehab, $150–$220/SF new construction.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Estimated Construction Base</Label>
                      <CurrencyInput value={totals.hardBase} onChange={() => {}} readOnly />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Foundation/Structural</Label>
                        <CurrencyInput value={formData.hardCosts.foundation} onChange={(v) => updateSection("hardCosts", "foundation", v)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Roofing</Label>
                        <CurrencyInput value={formData.hardCosts.roofing} onChange={(v) => updateSection("hardCosts", "roofing", v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>HVAC</Label>
                        <CurrencyInput value={formData.hardCosts.hvac} onChange={(v) => updateSection("hardCosts", "hvac", v)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Electrical</Label>
                        <CurrencyInput value={formData.hardCosts.electrical} onChange={(v) => updateSection("hardCosts", "electrical", v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plumbing</Label>
                        <CurrencyInput value={formData.hardCosts.plumbing} onChange={(v) => updateSection("hardCosts", "plumbing", v)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Interior Finishes</Label>
                        <CurrencyInput value={formData.hardCosts.interiorFinishes} onChange={(v) => updateSection("hardCosts", "interiorFinishes", v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Exterior/Landscaping</Label>
                        <CurrencyInput value={formData.hardCosts.exteriorLandscaping} onChange={(v) => updateSection("hardCosts", "exteriorLandscaping", v)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Construction Costs</Label>
                        <CurrencyInput value={formData.hardCosts.otherHard} onChange={(v) => updateSection("hardCosts", "otherHard", v)} />
                      </div>
                    </div>
                    {/* Custom Line Items */}
                    <CustomLineItems
                      items={formData.hardCosts.customItems || []}
                      onAdd={() => addCustomItem("hardCosts")}
                      onUpdate={(i, f, v) => updateCustomItem("hardCosts", i, f, v)}
                      onRemove={(i) => removeCustomItem("hardCosts", i)}
                    />
                  </>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label>Contingency (%)</Label>
                    <PercentageInput
                      value={formData.hardCosts.contingencyPercent}
                      onChange={(v) => updateSection("hardCosts", "contingencyPercent", v)}
                      helpText="Buffer for unexpected construction issues — hidden damage, code requirements, material price changes. 15-20% recommended for renovations, 10-15% for new construction."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contingency Amount</Label>
                    <CurrencyInput value={totals.hardContingency} onChange={() => {}} readOnly />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">
                      Construction Total (incl. contingency)
                    </Label>
                    <CurrencyInput value={totals.hardCostsTotal} onChange={() => {}} readOnly />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* PRE-DEVELOPMENT COSTS */}
          <AccordionItem
            value="softCosts"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Pre-Development Costs</span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(totals.softCostsTotal)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Architecture/Engineering</Label>
                    <CurrencyInput value={formData.softCosts.architectureEngineering} onChange={(v) => updateSection("softCosts", "architectureEngineering", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Permits & Fees</Label>
                    <CurrencyInput
                      value={formData.softCosts.permitsFees}
                      onChange={(v) => updateSection("softCosts", "permitsFees", v)}
                      helpText="Permits are required by the city before you can begin construction. In Memphis and Shelby County, permit fees typically run 1-2% of the construction value. Contact the Memphis Division of Planning & Development for exact fee schedules."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Legal & Accounting</Label>
                    <CurrencyInput value={formData.softCosts.legalAccounting} onChange={(v) => updateSection("softCosts", "legalAccounting", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance</Label>
                    <CurrencyInput
                      value={formData.softCosts.insurance}
                      onChange={(v) => updateSection("softCosts", "insurance", v)}
                      helpText="General liability and professional liability insurance for the pre-development phase. This is separate from builder's risk insurance during construction."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loan Interest/Points</Label>
                    <CurrencyInput
                      value={formData.softCosts.loanInterestPoints}
                      onChange={(v) => updateSection("softCosts", "loanInterestPoints", v)}
                      helpText="Points are upfront fees charged by your lender (1 point = 1% of the loan amount). Include origination fees, points, and the total interest you'll pay during the construction period. Hard money lenders typically charge 2-4 points plus monthly interest of 10-14%."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marketing/Leasing</Label>
                    <CurrencyInput value={formData.softCosts.marketingLeasing} onChange={(v) => updateSection("softCosts", "marketingLeasing", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Pre-Development Costs</Label>
                    <CurrencyInput value={formData.softCosts.otherSoft} onChange={(v) => updateSection("softCosts", "otherSoft", v)} />
                  </div>
                </div>
                {/* Custom Line Items */}
                <CustomLineItems
                  items={formData.softCosts.customItems || []}
                  onAdd={() => addCustomItem("softCosts")}
                  onUpdate={(i, f, v) => updateCustomItem("softCosts", i, f, v)}
                  onRemove={(i) => removeCustomItem("softCosts", i)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label>Contingency (%)</Label>
                    <PercentageInput
                      value={formData.softCosts.contingencyPercent}
                      onChange={(v) => updateSection("softCosts", "contingencyPercent", v)}
                      helpText="Buffer for permit delays, additional professional fees, or design changes. 10% is typical."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contingency Amount</Label>
                    <CurrencyInput value={totals.softContingency} onChange={() => {}} readOnly />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">
                      Pre-Development Total (incl. contingency)
                    </Label>
                    <CurrencyInput value={totals.softCostsTotal} onChange={() => {}} readOnly />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* HOLDING COSTS */}
          <AccordionItem
            value="holdingCosts"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Holding Costs</span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(totals.holdingCostsTotal)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Taxes</Label>
                    <CurrencyInput
                      value={formData.holdingCosts.propertyTaxes}
                      onChange={(v) => updateSection("holdingCosts", "propertyTaxes", v)}
                      helpText="Estimate property taxes you'll owe during the construction period. In Shelby County, check your assessed value at the Assessor's website and prorate for your expected construction timeline (typically 6-12 months)."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Builder's Risk Insurance</Label>
                    <CurrencyInput
                      value={formData.holdingCosts.insurance}
                      onChange={(v) => updateSection("holdingCosts", "insurance", v)}
                      helpText="Builder's risk insurance premium for the construction period. This is separate from the permanent insurance policy you'll need after completion."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loan Payments</Label>
                    <CurrencyInput
                      value={formData.holdingCosts.loanPayments}
                      onChange={(v) => updateSection("holdingCosts", "loanPayments", v)}
                      helpText="Monthly interest payments on your construction loan during the build period. For a 6-month project at 12% annual interest on a $100,000 loan, budget around $6,000."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilities</Label>
                    <CurrencyInput
                      value={formData.holdingCosts.utilities}
                      onChange={(v) => updateSection("holdingCosts", "utilities", v)}
                      helpText="Electric, water, and gas service needed during construction. Budget $200-400/month depending on the scope of work."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Other Holding Costs</Label>
                  <CurrencyInput
                    value={formData.holdingCosts.otherHolding}
                    onChange={(v) => updateSection("holdingCosts", "otherHolding", v)}
                    helpText="Any other carrying costs during construction — security, lawn maintenance, HOA fees if applicable."
                  />
                </div>
                {/* Custom Line Items */}
                <CustomLineItems
                  items={formData.holdingCosts.customItems || []}
                  onAdd={() => addCustomItem("holdingCosts")}
                  onUpdate={(i, f, v) => updateCustomItem("holdingCosts", i, f, v)}
                  onRemove={(i) => removeCustomItem("holdingCosts", i)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label>Contingency (%)</Label>
                    <PercentageInput
                      value={formData.holdingCosts.contingencyPercent}
                      onChange={(v) => updateSection("holdingCosts", "contingencyPercent", v)}
                      helpText="Buffer for construction delays extending your holding period. If your project runs 2 months longer than planned, you'll need extra funds for loan payments, taxes, and insurance."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contingency Amount</Label>
                    <CurrencyInput value={totals.holdingContingency} onChange={() => {}} readOnly />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">
                      Holding Total (incl. contingency)
                    </Label>
                    <CurrencyInput value={totals.holdingCostsTotal} onChange={() => {}} readOnly />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* OPERATING RESERVES */}
          <AccordionItem
            value="reserves"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">
                    Operating Reserves
                  </span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(formData.operatingReserves)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Operating Reserves</Label>
                  <CurrencyInput
                    value={formData.operatingReserves}
                    onChange={(v) => setFormData(prev => ({ ...prev, operatingReserves: v }))}
                    helpText="Operating reserves are cash you set aside to cover expenses after construction is complete — things like mortgage payments, property taxes, insurance, and vacancy periods while you find tenants or buyers. Most lenders require 6 months of reserves to approve your loan."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SOURCES AND USES */}
          <AccordionItem
            value="capitalStack"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-foreground">
                      Sources and Uses
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Sources of Funds
                    </span>
                  </div>
                </div>
                <span className="text-primary font-bold text-lg">
                  {formatCurrency(
                    landEquity +
                      formData.capitalStack.developerEquity +
                      formData.capitalStack.privateLender +
                      formData.capitalStack.bankLoan +
                      formData.capitalStack.grant1Amount +
                      formData.capitalStack.grant2Amount +
                      formData.capitalStack.grant3Amount +
                      formData.capitalStack.otherSources
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                {/* Land Equity (read-only, from acquisition) */}
                {landEquity > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-700" />
                        <Label className="text-emerald-700 font-medium">Land Equity</Label>
                      </div>
                      <span className="text-emerald-700 font-bold">{formatCurrency(landEquity)}</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">From property ownership — counts toward developer equity</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Developer Equity (Cash)</Label>
                  <CurrencyInput
                    value={formData.capitalStack.developerEquity}
                    onChange={(v) => updateSection("capitalStack", "developerEquity", v)}
                    helpText="Cash you are investing in the project. This is separate from any land equity above. Local lenders typically require 15-20% total developer equity (cash + land) to show you have 'skin in the game'."
                  />
                </div>
                {/* Total Developer Equity summary */}
                {landEquity > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Total Developer Equity (Cash + Land)</Label>
                    <span className="font-bold text-foreground">{formatCurrency(fin.totalEquity)}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Private Lender</Label>
                    <CurrencyInput
                      value={formData.capitalStack.privateLender}
                      onChange={(v) => updateSection("capitalStack", "privateLender", v)}
                      helpText="Private lending includes hard money loans, private investor capital, or family loans. These sources are often faster to close than banks but come with higher interest rates (typically 10-14%). Make sure any private loan terms are documented in writing."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank/Construction Loan</Label>
                    <CurrencyInput
                      value={formData.capitalStack.bankLoan}
                      onChange={(v) => updateSection("capitalStack", "bankLoan", v)}
                      helpText="Traditional bank financing or CDFI (Community Development Financial Institution) loans. CDFIs like Community LIFT or Pathway Lending often offer better terms for emerging developers in Memphis. Construction loans typically cover 70-80% of total costs."
                    />
                  </div>
                </div>

                {/* Grants/Subsidies */}
                <div className="pt-2 border-t border-gray-100">
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Grants & Subsidies
                  </Label>
                  {siteSubsidyTotal > 0 && (
                    <div className="flex items-start gap-2 p-3 mb-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        Site & Location lists <span className="font-semibold">{formatCurrency(siteSubsidyTotal)}</span> in subsidies/incentives. Make sure your grants below reflect these amounts.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Grant/Subsidy Name"
                          value={formData.capitalStack.grant1Name}
                          onChange={(e) => updateSection("capitalStack", "grant1Name", e.target.value)}
                        />
                      </div>
                      <div className="w-40">
                        <CurrencyInput
                          value={formData.capitalStack.grant1Amount}
                          onChange={(v) => updateSection("capitalStack", "grant1Amount", v)}
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Grant/Subsidy Name"
                          value={formData.capitalStack.grant2Name}
                          onChange={(e) => updateSection("capitalStack", "grant2Name", e.target.value)}
                        />
                      </div>
                      <div className="w-40">
                        <CurrencyInput
                          value={formData.capitalStack.grant2Amount}
                          onChange={(v) => updateSection("capitalStack", "grant2Amount", v)}
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Grant/Subsidy Name"
                          value={formData.capitalStack.grant3Name}
                          onChange={(e) => updateSection("capitalStack", "grant3Name", e.target.value)}
                        />
                      </div>
                      <div className="w-40">
                        <CurrencyInput
                          value={formData.capitalStack.grant3Amount}
                          onChange={(v) => updateSection("capitalStack", "grant3Amount", v)}
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Other Sources</Label>
                  <CurrencyInput
                    value={formData.capitalStack.otherSources}
                    onChange={(v) => updateSection("capitalStack", "otherSources", v)}
                  />
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">Total Sources</Label>
                    <CurrencyInput
                      value={
                        landEquity +
                        formData.capitalStack.developerEquity +
                        formData.capitalStack.privateLender +
                        formData.capitalStack.bankLoan +
                        formData.capitalStack.grant1Amount +
                        formData.capitalStack.grant2Amount +
                        formData.capitalStack.grant3Amount +
                        formData.capitalStack.otherSources
                      }
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
            >
              {saving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side: Live Summary Dashboard */}
      <div className="hidden lg:block w-full xl:basis-[35%] xl:grow-0 xl:shrink-0">
        <BudgetSummaryDashboard data={formData} scope={engineScope} />
      </div>
    </div>
  );
};
