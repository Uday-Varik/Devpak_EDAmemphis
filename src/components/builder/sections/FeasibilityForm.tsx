import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  DollarSign,
  Home,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Check,
  X,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { CurrencyInput, PercentageInput } from "./budget/CurrencyInput";
import { FeasibilitySummaryDashboard } from "./feasibility/FeasibilitySummaryDashboard";
import {
  FeasibilityWarnings,
  FeasibilityCalculations,
  calculateFeasibilityWarnings,
} from "./feasibility/FeasibilityWarnings";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { computeBudgetTotals, computeProjectFinancials, computeSensitivityScenarios, NO_ARV_LABEL } from "@/utils/calculations";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { isNarrativeStale } from "@/utils/narrativeStaleness";
import { buildRationaleFingerprint, generateRationaleText } from "@/utils/narrativeFingerprints";
import { StaleNarrativeNotice } from "@/components/builder/StaleNarrativeNotice";

interface FeasibilityFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const DEFAULT_DATA = {
  exitStrategy: {
    strategy: "sell" as "sell" | "rent" | "rent-then-sell",
    holdPeriod: 12,
  },
  saleExit: {
    arv: 0,
    salesCostsPercent: 8,
  },
  rentalExit: {
    numberOfUnits: 1,
    monthlyRentPerUnit: 0,
    vacancyRate: 8,
    managementPercent: 10,
    propertyTaxes: 0,
    insurance: 0,
    maintenancePercent: 5,
    reservesPercent: 5,
    otherExpenses: 0,
    loanAmount: 0,
    interestRate: 7.5,
    loanTerm: 30,
  },
  sensitivity: {
    arvAdjustment: 0,
    costAdjustment: 0,
  },
  decision: {
    decision: "",
    rationale: "",
    reviewedBy: "",
    rationaleFingerprint: "",
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

const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

export const FeasibilityForm = ({
  data,
  onSave,
  saving,
}: FeasibilityFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => ({
    exitStrategy: { ...DEFAULT_DATA.exitStrategy, ...data.exitStrategy },
    saleExit: { ...DEFAULT_DATA.saleExit, ...data.saleExit },
    rentalExit: { ...DEFAULT_DATA.rentalExit, ...data.rentalExit },
    sensitivity: { ...DEFAULT_DATA.sensitivity, ...data.sensitivity },
    decision: { ...DEFAULT_DATA.decision, ...data.decision },
  }));
  const [budgetData, setBudgetData] = useState<any>(null);
  const [projectScopeData, setProjectScopeData] = useState<any>(null);
  const [visionMarketData, setVisionMarketData] = useState<any>(null);
  const initialStrategy = (data.exitStrategy?.strategy || DEFAULT_DATA.exitStrategy.strategy) as string;
  const initialOpen = ["exitStrategy"];
  if (initialStrategy === "sell" || initialStrategy === "rent-then-sell") initialOpen.push("saleExit");
  if (initialStrategy === "rent" || initialStrategy === "rent-then-sell") initialOpen.push("rentalExit");
  const [openSections, setOpenSections] = useState<string[]>(initialOpen);

  const handleAutoSave = useCallback(async (data: any) => {
    await onSave(data, false);
  }, [onSave]);

  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  // Fetch budget and project scope data
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!projectId) return;

      const { data: detailsData } = await supabase
        .from("project_details")
        .select("section, data")
        .eq("project_id", projectId)
        .in("section", ["budget-capital", "project-scope", "vision-market"]);

      if (detailsData) {
        detailsData.forEach((detail) => {
          if (detail.section === "budget-capital") {
            setBudgetData(detail.data);
            // Auto-populate loan amount if not set
            if (!formData.rentalExit.loanAmount && (detail.data as any)?.capitalStack?.bankLoan) {
              setFormData((prev) => ({
                ...prev,
                rentalExit: {
                  ...prev.rentalExit,
                  loanAmount: (detail.data as any).capitalStack.bankLoan,
                },
              }));
            }
          }
          if (detail.section === "project-scope") {
            setProjectScopeData(detail.data);
            const scopeUnits = parseInt(String((detail.data as any)?.numberOfUnits || ""), 10);
            // Auto-populate from scope if rental units is still at the default (1) or empty
            if (scopeUnits > 0 && (!formData.rentalExit.numberOfUnits || formData.rentalExit.numberOfUnits <= 1)) {
              setFormData((prev) => ({
                ...prev,
                rentalExit: {
                  ...prev.rentalExit,
                  numberOfUnits: scopeUnits,
                },
              }));
            }
          }
          if (detail.section === "vision-market") {
            setVisionMarketData(detail.data);
          }
        });
      }
    };

    fetchRelatedData();

    // Refetch when upstream sections auto-save.
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (["project-scope", "budget-capital", "vision-market"].includes(detail?.section)) {
        fetchRelatedData();
      }
    };
    window.addEventListener("section-data-updated", handler);
    return () => window.removeEventListener("section-data-updated", handler);
  }, [projectId]);

  const exitStrategy = formData.exitStrategy.strategy;
  const includesSale = exitStrategy === "sell" || exitStrategy === "rent-then-sell";
  const includesRental = exitStrategy === "rent" || exitStrategy === "rent-then-sell";

  // Check if ARV is entered for sale exit
  const hasARV = (formData.saleExit?.arv || 0) > 0;
  // Check if rental data is entered
  const hasRentalData = (formData.rentalExit?.monthlyRentPerUnit || 0) > 0;

  // Budget totals come from the shared engine (src/utils/calculations.ts) so that this
  // panel, the Executive Summary and the PDF export can never disagree on TDC.
  const budgetTotals = useMemo(() => {
    if (!budgetData) return { totalDevelopmentCost: 0, hardCostsTotal: 0, purchasePrice: 0 };
    const totals = computeBudgetTotals(budgetData, projectScopeData || {});
    return {
      totalDevelopmentCost: totals.tdc,
      hardCostsTotal: totals.hardTotal,
      purchasePrice: totals.purchasePrice,
    };
  }, [budgetData, projectScopeData]);


  const developerEquity = budgetData?.capitalStack?.developerEquity || 0;

  // Land equity / total equity: shared engine only.
  const equityFin = useMemo(
    () => computeProjectFinancials({ scope: projectScopeData || {}, budget: budgetData || {} }),
    [budgetData, projectScopeData]
  );
  const landEquity = equityFin.landEquity;
  const totalEquity = equityFin.totalEquity;

  // Vision comps mapped for calculations
  const visionComps = useMemo(() => {
    const comps = visionMarketData?.comparables || [];
    return comps.map((c: any) => ({
      address: c.address || "",
      salePrice: c.salePrice || 0,
      sqft: c.sqft || 0,
      bedrooms: c.bedrooms || 0,
      bathrooms: c.bathrooms || 0,
      condition: c.condition || "",
      saleDate: c.saleDate || "",
      pricePerSqft: c.sqft > 0 ? c.salePrice / c.sqft : 0,
    }));
  }, [visionMarketData]);

  const visionAvgPricePerSqft = useMemo(() => {
    const valid = visionComps.filter((c: any) => c.pricePerSqft > 0);
    return valid.length > 0 ? valid.reduce((s: number, c: any) => s + c.pricePerSqft, 0) / valid.length : 0;
  }, [visionComps]);

  // All calculations
  const calculations: FeasibilityCalculations = useMemo(() => {
    const { saleExit, rentalExit } = formData;
    const tdc = budgetTotals.totalDevelopmentCost;
    const plannedSqFt = (projectScopeData?.sqftPlanned as number) || 0;

    // ALL sale and rental math comes from the shared engine (src/utils/calculations.ts).
    const rentalFin = computeProjectFinancials({
      scope: projectScopeData || {},
      budget: budgetData || {},
      feasibility: formData,
    });
    // Net basis (TDC − grants) is used ONLY for netProfit / roi / profitMargin — see engine.
    const totalGrants = rentalFin.grants;
    const salesCostsAmount = rentalFin.salesCosts;
    const netSaleProceeds = rentalFin.netSaleProceeds;
    const netProfit = rentalFin.netProfit;
    const profitMargin = rentalFin.profitMargin;
    const roi = rentalFin.roi;
    const holdPeriod = formData.exitStrategy.holdPeriod || 12;
    const annualizedRoi = holdPeriod > 12 ? (roi / holdPeriod) * 12 : roi;
    const allInBasis = rentalFin.allInBasis;
    const seventyPercentMaxPurchase = rentalFin.seventyMaxPurchase;
    // ARV-dependent checks from the engine; "na" (no ARV) is not a pass.
    const seventyPercentPassed = rentalFin.seventyRuleCheck === "pass";
    const allInBasisPassed = rentalFin.allInBasisCheck === "pass";
    const grossAnnualRent = rentalFin.grossRent;
    const effectiveGrossIncome = rentalFin.egi;
    const managementAmount = (effectiveGrossIncome * (rentalExit.managementPercent ?? 10)) / 100;
    const maintenanceAmount = (effectiveGrossIncome * (rentalExit.maintenancePercent ?? 5)) / 100;
    const reservesAmount = (effectiveGrossIncome * (rentalExit.reservesPercent ?? 5)) / 100;
    const totalOperatingExpenses = rentalFin.opex;
    const opExRatio = effectiveGrossIncome > 0 ? (totalOperatingExpenses / effectiveGrossIncome) * 100 : 0;
    const noi = rentalFin.noi;

    const annualDebtService = rentalFin.annualDebtService;
    const monthlyDebtService = annualDebtService / 12;

    const cashFlowBeforeTaxes = rentalFin.cashFlow;
    const monthlyCashFlow = cashFlowBeforeTaxes / 12;
    const capRate = rentalFin.capRate;
    const cashOnCash = rentalFin.cashOnCash;
    const dscr = rentalFin.dscr;

    const monthlyRentTotal = grossAnnualRent / 12;
    const onePercentRule = rentalFin.onePercentRule;
    const onePercentPassed = onePercentRule >= 1;
    const grm = grossAnnualRent > 0 ? budgetTotals.purchasePrice / grossAnnualRent : 0;
    const grmPassed = grm > 0 && grm < 10;

    // Comps calculations
    const avgPricePerSqft = visionAvgPricePerSqft;
    const yourPricePerSqft = plannedSqFt > 0 ? saleExit.arv / plannedSqFt : 0;
    const compVariance = avgPricePerSqft > 0 ? ((yourPricePerSqft - avgPricePerSqft) / avgPricePerSqft) * 100 : 0;

    // Break-even and margin of safety use GROSS tdc per the basis rule.
    const breakEvenArv = rentalFin.breakEvenArv;
    const breakEvenCost = netSaleProceeds;
    const marginOfSafety = rentalFin.marginOfSafety;
    const marginOfSafetyPercent = rentalFin.marginOfSafetyPercent;

    return {
      grossTdc: tdc,
      totalGrants,
      netTdc: rentalFin.netTdc,
      salesCostsAmount,
      netSaleProceeds,
      netProfit,
      profitMargin,
      roi,
      annualizedRoi,
      allInBasis,
      seventyPercentMaxPurchase,
      seventyPercentPassed,
      allInBasisPassed,
      grossAnnualRent,
      effectiveGrossIncome,
      managementAmount,
      maintenanceAmount,
      reservesAmount,
      totalOperatingExpenses,
      opExRatio,
      noi,
      annualDebtService,
      monthlyDebtService,
      cashFlowBeforeTaxes,
      monthlyCashFlow,
      capRate,
      cashOnCash,
      dscr,
      onePercentRule,
      onePercentPassed,
      grm,
      grmPassed,
      avgPricePerSqft,
      yourPricePerSqft,
      compVariance,
      breakEvenArv,
      breakEvenCost,
      marginOfSafety,
      marginOfSafetyPercent,
    };
  }, [formData, budgetTotals, developerEquity, projectScopeData]);

  const warnings = useMemo(
    () => calculateFeasibilityWarnings(formData, calculations, budgetData),
    [formData, calculations, budgetData]
  );

  // Update nested state helper
  const updateSection = <T extends keyof typeof formData>(
    section: T,
    field: keyof (typeof formData)[T],
    value: (typeof formData)[T][keyof (typeof formData)[T]]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveDraft = async () => {
    await onSave(formData, false);
  };

  const handleSaveAndContinue = async () => {
    await onSave(formData, true);
  };

  // Feasibility checklist
  const checklistItems = useMemo(() => {
    const compsEntered = visionComps.length > 0;
    const budgetComplete = budgetTotals.totalDevelopmentCost > 0;
    const financingIdentified = developerEquity > 0 || (budgetData?.capitalStack?.bankLoan || 0) > 0;
    const pencilPassed = includesSale
      ? calculations.roi >= 15
      : calculations.cashOnCash >= 8;
    
    const worstCaseReturn = includesSale
      ? calculations.netProfit * 0.8
      : calculations.cashFlowBeforeTaxes * 0.8;
    const sensitivityOk = worstCaseReturn > 0;

    return [
      { label: "Market demand demonstrated", passed: !!compsEntered },
      { label: "Budget reasonable", passed: budgetComplete },
      { label: "Financing identified", passed: financingIdentified },
      { label: "Pencil test passed", passed: pencilPassed },
      { label: "Sensitivity acceptable", passed: sensitivityOk },
    ];
  }, [visionComps, budgetTotals, developerEquity, budgetData, calculations, includesSale]);

  const passedCount = checklistItems.filter((item) => item.passed).length;

  // ---- Go/No-Go rationale: keep the free text tied to the live figures ----
  const rationaleFingerprint = useMemo(
    () =>
      buildRationaleFingerprint({
        decision: formData.decision.decision,
        roi: calculations.roi,
        netProfit: calculations.netProfit,
        marginOfSafetyPercent: calculations.marginOfSafetyPercent,
        dscr: calculations.dscr,
        cashOnCash: calculations.cashOnCash,
        tdc: calculations.grossTdc,
      }),
    [formData.decision.decision, calculations]
  );

  const rationaleStale = isNarrativeStale(
    formData.decision.rationale,
    (formData.decision as any).rationaleFingerprint,
    rationaleFingerprint
  );

  const generateRationale = useCallback(
    () =>
      generateRationaleText(
        {
          includesSale,
          roi: calculations.roi,
          tdc: calculations.grossTdc,
          netProfit: calculations.netProfit,
          marginOfSafety: calculations.marginOfSafety,
          marginOfSafetyPercent: calculations.marginOfSafetyPercent,
          noi: calculations.noi,
          dscr: calculations.dscr,
          capRate: calculations.capRate,
          cashOnCash: calculations.cashOnCash,
        },
        { passed: passedCount, total: checklistItems.length }
      ),
    [calculations, includesSale, passedCount, checklistItems.length]
  );

  const handleRegenerateRationale = () => {
    setFormData((prev) => ({
      ...prev,
      decision: {
        ...prev.decision,
        rationale: generateRationale(),
        rationaleFingerprint,
      },
    }));
  };




  // Sensitivity scenarios
  const scenarios = useMemo(() => {
    // Scenarios run on the same netTdc basis as netProfit / roi, so the Base Case
    // row is identical to the headline ROI shown above.
    const { arvAdjustment, costAdjustment } = formData.sensitivity;
    const fin = {
      arv: formData.saleExit.arv,
      netTdc: calculations.netTdc,
      salesCostsPct: formData.saleExit.salesCostsPercent,
      cashEquity: developerEquity,
    };
    return computeSensitivityScenarios(fin, [
      { label: "Best (+10%)", arvMod: 10 + arvAdjustment, costMod: -10 + costAdjustment },
      { label: "Base Case", arvMod: arvAdjustment, costMod: costAdjustment },
      { label: "Conservative (-10%)", arvMod: -10 + arvAdjustment, costMod: 10 + costAdjustment },
      { label: "Stress Test (-20%)", arvMod: -20 + arvAdjustment, costMod: 20 + costAdjustment },
    ]);
  }, [formData.sensitivity, formData.saleExit, calculations, developerEquity]);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Side: Form */}
      <div className="flex-1 min-w-0 space-y-6 xl:basis-[65%] xl:grow-0">
        {/* Warnings */}
        <FeasibilityWarnings warnings={warnings} />

        {/* Budget Not Complete Warning */}
        {!budgetData && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              Complete the <strong>Budget & Capital Stack</strong> section first to unlock full calculations.
            </p>
          </div>
        )}

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* EXIT STRATEGY */}
          <AccordionItem
            value="exitStrategy"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Exit Strategy</span>
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  {exitStrategy.replace("-", " → ")}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Exit Strategy</Label>
                  <Select
                    value={formData.exitStrategy.strategy}
                    onValueChange={(v: any) => {
                      updateSection("exitStrategy", "strategy", v);
                      // Auto-open the relevant analysis section so the user sees the right fields immediately
                      setOpenSections((prev) => {
                        const next = new Set(prev);
                        if (v === "sell" || v === "rent-then-sell") next.add("saleExit");
                        if (v === "rent" || v === "rent-then-sell") next.add("rentalExit");
                        // Close the section that no longer applies
                        if (v === "rent") next.delete("saleExit");
                        if (v === "sell") next.delete("rentalExit");
                        return Array.from(next);
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="rent-then-sell">Rent then Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {includesRental && (
                  <div className="space-y-2">
                    <Label>Hold Period (months)</Label>
                    <Input
                      type="number"
                      value={formData.exitStrategy.holdPeriod || ""}
                      onChange={(e) =>
                        updateSection("exitStrategy", "holdPeriod", parseInt(e.target.value) || 0)
                      }
                      min={1}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SALE EXIT ANALYSIS */}
          {includesSale && (
            <AccordionItem
              value="saleExit"
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">Sale Exit Analysis</span>
                  </div>
                  <span className={cn(
                    "font-bold text-lg",
                    hasARV ? (calculations.netProfit >= 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"
                  )}>
                    {hasARV ? formatCompact(calculations.netProfit) : "—"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
                {/* Revenue */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Revenue</h4>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>After Repair Value (ARV)</Label>
                      <CurrencyInput
                        value={formData.saleExit.arv}
                        onChange={(v) => updateSection("saleExit", "arv", v)}
                        helpText="The After Repair Value (ARV) is what your property will be worth on the open market after all renovations are complete. Base this on recent comparable sales (comps) of similar properties in the same neighborhood — not on listing prices or Zillow estimates."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sales Costs (%)</Label>
                        <PercentageInput
                          value={formData.saleExit.salesCostsPercent}
                          onChange={(v) => updateSection("saleExit", "salesCostsPercent", v)}
                          helpText="Sales costs include real estate agent commissions (typically 5-6%), closing costs paid by the seller, staging, and any concessions to the buyer. Most developers budget 6-10% of the sale price for total sales costs."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sales Costs Amount</Label>
                        <CurrencyInput value={calculations.salesCostsAmount} onChange={() => {}} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Net Sale Proceeds</Label>
                      <CurrencyInput value={calculations.netSaleProceeds} onChange={() => {}} readOnly />
                    </div>
                  </div>
                </div>

                {/* Costs Reference */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Costs</h4>
                  <div className="space-y-2">
                    <Label>Total Development Cost</Label>
                    <CurrencyInput
                      value={budgetTotals.totalDevelopmentCost}
                      onChange={() => {}}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">From Budget section</p>
                  </div>
                </div>

                {/* Returns */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Net Profit</Label>
                      <CurrencyInput value={calculations.netProfit} onChange={() => {}} readOnly />
                      {calculations.totalGrants > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Net of {formatCurrency(calculations.totalGrants)} in grants and subsidies. Gross project cost: {formatCurrency(calculations.grossTdc)}.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Profit Margin</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.profitMargin.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          calculations.profitMargin >= 10 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          Target: &gt;10%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>ROI</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.roi.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          calculations.roi >= 15 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          Target: &gt;15%
                        </span>
                      </div>
                    </div>
                    {formData.exitStrategy.holdPeriod > 12 && (
                      <div className="space-y-2">
                        <Label>Annualized ROI</Label>
                        <Input
                          value={`${calculations.annualizedRoi.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Rule of Thumb Checks */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Rule of Thumb Checks</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>All-in Basis</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={hasARV ? `${calculations.allInBasis.toFixed(1)}%` : "—"}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded font-medium",
                          !hasARV ? "bg-gray-100 text-gray-500" :
                          calculations.allInBasisPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {hasARV ? (calculations.allInBasisPassed ? "Pass" : "Fail") : NO_ARV_LABEL} {hasARV && "(<85%)"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>70% Rule Max Purchase</Label>
                      <Input
                        value={hasARV ? formatCurrency(calculations.seventyPercentMaxPurchase) : "—"}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Purchase Price</Label>
                      <CurrencyInput value={budgetTotals.purchasePrice} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>70% Rule Status</Label>
                      <div className={cn(
                        "h-10 flex items-center justify-center rounded-md text-sm font-medium",
                        !hasARV ? "bg-gray-100 text-gray-500" :
                        calculations.seventyPercentPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {hasARV ? (calculations.seventyPercentPassed ? "✓ Pass" : "✗ Fail") : NO_ARV_LABEL}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* RENTAL EXIT ANALYSIS */}
          {includesRental && (
            <AccordionItem
              value="rentalExit"
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">Rental Exit Analysis</span>
                  </div>
                  <span className={cn(
                    "font-bold text-lg",
                    calculations.monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(calculations.monthlyCashFlow)}/mo
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
                {/* Income */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Income</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Units</Label>
                      <Input
                        type="number"
                        value={formData.rentalExit.numberOfUnits || ""}
                        onChange={(e) =>
                          updateSection("rentalExit", "numberOfUnits", parseInt(e.target.value) || 1)
                        }
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Rent per Unit</Label>
                      <CurrencyInput
                        value={formData.rentalExit.monthlyRentPerUnit}
                        onChange={(v) => updateSection("rentalExit", "monthlyRentPerUnit", v)}
                      />
                    </div>
                    {/* HUD FMR Link */}
                    <a
                      href="https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Compare with HUD Fair Market Rents
                    </a>
                    <div className="space-y-2">
                      <Label>Gross Annual Rent</Label>
                      <CurrencyInput value={calculations.grossAnnualRent} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Vacancy Rate (%)</Label>
                      <PercentageInput
                        value={formData.rentalExit.vacancyRate}
                        onChange={(v) => updateSection("rentalExit", "vacancyRate", v)}
                        helpText="Vacancy rate is the percentage of time your units will be empty (between tenants, during turnover, etc.). Memphis averages 8-10% vacancy for residential rentals. Always be conservative — underestimating vacancy is one of the most common mistakes new developers make."
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Effective Gross Income</Label>
                      <CurrencyInput value={calculations.effectiveGrossIncome} onChange={() => {}} readOnly />
                    </div>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Operating Expenses</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Property Management (%)</Label>
                      <PercentageInput
                        value={formData.rentalExit.managementPercent}
                        onChange={(v) => updateSection("rentalExit", "managementPercent", v)}
                        helpText="Property management companies handle tenant placement, rent collection, maintenance coordination, and evictions. In Memphis, management fees typically run 8-10% of collected rent. Enter 0% only if you plan to self-manage — but lenders may still underwrite at 8-10%."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Management Amount</Label>
                      <CurrencyInput value={calculations.managementAmount} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Property Taxes (Annual)</Label>
                      <CurrencyInput
                        value={formData.rentalExit.propertyTaxes}
                        onChange={(v) => updateSection("rentalExit", "propertyTaxes", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance (Annual)</Label>
                      <CurrencyInput
                        value={formData.rentalExit.insurance}
                        onChange={(v) => updateSection("rentalExit", "insurance", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maintenance (%)</Label>
                      <PercentageInput
                        value={formData.rentalExit.maintenancePercent}
                        onChange={(v) => updateSection("rentalExit", "maintenancePercent", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maintenance Amount</Label>
                      <CurrencyInput value={calculations.maintenanceAmount} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Reserves (%)</Label>
                      <PercentageInput
                        value={formData.rentalExit.reservesPercent}
                        onChange={(v) => updateSection("rentalExit", "reservesPercent", v)}
                        helpText="Capital reserves cover major future repairs like roof replacement, HVAC systems, water heaters, and appliances. Setting aside 5% of income helps avoid large out-of-pocket expenses and shows lenders you're planning for the long term."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reserves Amount</Label>
                      <CurrencyInput value={calculations.reservesAmount} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Expenses</Label>
                      <CurrencyInput
                        value={formData.rentalExit.otherExpenses}
                        onChange={(v) => updateSection("rentalExit", "otherExpenses", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Operating Expenses</Label>
                      <CurrencyInput value={calculations.totalOperatingExpenses} onChange={() => {}} readOnly />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>OpEx Ratio</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.opExRatio.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className="text-xs text-muted-foreground">Typical range: 40-50%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOI */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Net Operating Income</h4>
                  <div className="bg-primary/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Annual NOI</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculations.noi)}</p>
                  </div>
                </div>

                {/* Debt Service */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Debt Service</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loan Amount</Label>
                      <CurrencyInput
                        value={formData.rentalExit.loanAmount}
                        onChange={(v) => updateSection("rentalExit", "loanAmount", v)}
                        helpText="Enter the total amount of your permanent loan (or construction loan if refinancing). This is typically pulled from your Budget section's bank loan amount, but you can override it here if your takeout financing will be different."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <PercentageInput
                        value={formData.rentalExit.interestRate}
                        onChange={(v) => updateSection("rentalExit", "interestRate", v)}
                        helpText="The annual interest rate on your permanent loan. Current investment property rates in Memphis typically range from 7-9%. This is used to calculate your monthly mortgage payment and debt service coverage ratio (DSCR)."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loan Term (years)</Label>
                      <Input
                        type="number"
                        value={formData.rentalExit.loanTerm || ""}
                        onChange={(e) =>
                          updateSection("rentalExit", "loanTerm", parseInt(e.target.value) || 30)
                        }
                        min={1}
                        max={40}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Debt Service</Label>
                      <CurrencyInput value={calculations.annualDebtService} onChange={() => {}} readOnly />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Monthly Debt Service</Label>
                      <CurrencyInput value={calculations.monthlyDebtService} onChange={() => {}} readOnly />
                    </div>
                  </div>
                </div>

                {/* Cash Flow */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Cash Flow</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Annual Cash Flow</Label>
                      <CurrencyInput value={calculations.cashFlowBeforeTaxes} onChange={() => {}} readOnly />
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Cash Flow</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        calculations.monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(calculations.monthlyCashFlow)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Returns */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cap Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.capRate.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          calculations.capRate >= 6 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          Target: &gt;6%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cash-on-Cash Return</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.cashOnCash.toFixed(1)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          calculations.cashOnCash >= 8 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          Target: &gt;8%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>DSCR (Debt Service Coverage Ratio)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={calculations.dscr.toFixed(2)}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          calculations.dscr >= 1.25 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          Target: &gt;1.25
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule of Thumb Checks */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Rule of Thumb Checks</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>1% Rule</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${calculations.onePercentRule.toFixed(2)}%`}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded font-medium",
                          calculations.onePercentPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {calculations.onePercentPassed ? "Pass" : "Fail"} (≥1%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GRM (Gross Rent Multiplier)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={calculations.grm > 0 ? calculations.grm.toFixed(1) : "—"}
                          readOnly
                          className="bg-gray-50 border-gray-200 text-gray-700"
                        />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded font-medium",
                          calculations.grmPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {calculations.grmPassed ? "Pass" : "Fail"} (&lt;10)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* COMPARABLE SALES — Read-only from Vision & Market Case */}
          <AccordionItem
            value="comparables"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Comparable Sales</span>
                </div>
                <span className="text-primary font-bold">
                  {visionComps.length > 0 && visionAvgPricePerSqft > 0
                    ? `$${visionAvgPricePerSqft.toFixed(0)}/sqft`
                    : "—"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2 space-y-4">
              {visionComps.length > 0 ? (
                <>
                  {/* Comp cards */}
                  {visionComps.map((comp: any, i: number) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{comp.address || `Comp ${i + 1}`}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {comp.salePrice > 0 ? formatCurrency(comp.salePrice) : "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block">Sq Ft</span>
                          <span className="font-medium text-foreground">{comp.sqft > 0 ? comp.sqft.toLocaleString() : "—"}</span>
                        </div>
                        <div>
                          <span className="block">$/SqFt</span>
                          <span className="font-medium text-foreground">{comp.pricePerSqft > 0 ? `$${comp.pricePerSqft.toFixed(0)}` : "—"}</span>
                        </div>
                        <div>
                          <span className="block">Bed/Bath</span>
                          <span className="font-medium text-foreground">{comp.bedrooms || "—"}/{comp.bathrooms || "—"}</span>
                        </div>
                        <div>
                          <span className="block">Condition</span>
                          <span className="font-medium text-foreground capitalize">{comp.condition || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary metrics */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Avg Price/SqFt</Label>
                        <p className="font-bold text-foreground">
                          {visionAvgPricePerSqft > 0 ? `$${visionAvgPricePerSqft.toFixed(0)}` : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Your Projected $/SqFt</Label>
                        <p className="font-bold text-foreground">
                          {calculations.yourPricePerSqft > 0 ? `$${calculations.yourPricePerSqft.toFixed(0)}` : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Variance</Label>
                        <p className={cn(
                          "font-bold",
                          calculations.yourPricePerSqft > 0 && Math.abs(calculations.compVariance) > 20 ? "text-amber-600" : "text-foreground"
                        )}>
                          {calculations.yourPricePerSqft > 0
                            ? `${calculations.compVariance > 0 ? "+" : ""}${calculations.compVariance.toFixed(0)}%`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {calculations.yourPricePerSqft > 0 && Math.abs(calculations.compVariance) > 20 && visionAvgPricePerSqft > 0 && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                        <p className="text-sm text-amber-800">
                          Your projected value exceeds comp average by {calculations.compVariance.toFixed(0)}%. Verify with additional comps.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Source note */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Comparables are managed in the Vision & Market Case section.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        const event = new CustomEvent("navigate-section", { detail: "vision-market" });
                        window.dispatchEvent(event);
                      }}
                    >
                      Edit Comparables <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                /* Empty state */
                <div className="text-center py-8 space-y-3">
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-foreground">No comparable properties entered yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add comps in the Vision & Market Case section to support your ARV projections.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => {
                      const event = new CustomEvent("navigate-section", { detail: "vision-market" });
                      window.dispatchEvent(event);
                    }}
                  >
                    Go to Vision & Market Case <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* SENSITIVITY ANALYSIS */}
          <AccordionItem
            value="sensitivity"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Sensitivity Analysis</span>
                </div>
                <span className={cn(
                  "font-bold",
                  hasARV ? (calculations.marginOfSafety >= 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"
                )}>
                  {hasARV ? `${formatCompact(calculations.marginOfSafety)} margin` : "—"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
              {/* Adjustments */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>ARV/Value Adjustment</Label>
                    <span className="text-sm font-medium">
                      {formData.sensitivity.arvAdjustment > 0 ? "+" : ""}
                      {formData.sensitivity.arvAdjustment}%
                    </span>
                  </div>
                  <Slider
                    value={[formData.sensitivity.arvAdjustment]}
                    onValueChange={([v]) => updateSection("sensitivity", "arvAdjustment", v)}
                    min={-20}
                    max={20}
                    step={5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Cost Adjustment</Label>
                    <span className="text-sm font-medium">
                      {formData.sensitivity.costAdjustment > 0 ? "+" : ""}
                      {formData.sensitivity.costAdjustment}%
                    </span>
                  </div>
                  <Slider
                    value={[formData.sensitivity.costAdjustment]}
                    onValueChange={([v]) => updateSection("sensitivity", "costAdjustment", v)}
                    min={-20}
                    max={20}
                    step={5}
                  />
                </div>
              </div>

              {/* Scenario Table */}
              {hasARV ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-muted-foreground">Scenario</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">ARV</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Cost</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Profit</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((scenario, idx) => (
                          <tr
                            key={scenario.label}
                            className={cn(
                              "border-b border-gray-100",
                              idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                            )}
                          >
                            <td className="py-2 font-medium">{scenario.label}</td>
                            <td className="text-right py-2">{formatCompact(scenario.arv)}</td>
                            <td className="text-right py-2">{formatCompact(scenario.cost)}</td>
                            <td className={cn(
                              "text-right py-2 font-medium",
                              scenario.profit >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCompact(scenario.profit)}
                            </td>
                            <td className={cn(
                              "text-right py-2 font-medium",
                              scenario.return >= 15 ? "text-green-600" : scenario.return >= 0 ? "text-amber-600" : "text-red-600"
                            )}>
                              {scenario.return.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Break-even */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Break-even ARV</Label>
                      <CurrencyInput value={calculations.breakEvenArv} onChange={() => {}} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Margin of Safety</Label>
                      <div className="flex items-center gap-2">
                        <CurrencyInput value={calculations.marginOfSafety} onChange={() => {}} readOnly />
                        <span className={cn(
                          "text-xs px-2 py-1 rounded font-medium",
                          calculations.marginOfSafety >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {calculations.marginOfSafetyPercent.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Measured against break-even ARV on the gross cost basis (grants not deducted).
                      </p>
                    </div>

                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">Enter ARV in Sale Exit Analysis to see sensitivity scenarios</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* GO / NO-GO DECISION */}
          <AccordionItem
            value="decision"
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Go / No-Go Decision</span>
                </div>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  formData.decision.decision === "go" && "bg-green-100 text-green-700",
                  formData.decision.decision === "conditional" && "bg-amber-100 text-amber-700",
                  formData.decision.decision === "hold" && "bg-blue-100 text-blue-700",
                  formData.decision.decision === "no-go" && "bg-red-100 text-red-700",
                  !formData.decision.decision && "bg-gray-100 text-gray-500"
                )}>
                  {formData.decision.decision
                    ? formData.decision.decision.replace("-", " ").toUpperCase()
                    : "Pending"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
              {/* Overall Status Banner */}
              <div className={cn(
                "rounded-lg p-4 text-center",
                passedCount >= 4 ? "bg-green-50 border border-green-200" :
                passedCount >= 2 ? "bg-amber-50 border border-amber-200" :
                "bg-red-50 border border-red-200"
              )}>
                <p className={cn(
                  "font-semibold",
                  passedCount >= 4 ? "text-green-700" :
                  passedCount >= 2 ? "text-amber-700" :
                  "text-red-700"
                )}>
                  {passedCount} of 5 criteria met — {
                    passedCount >= 4 ? "Ready to proceed" :
                    passedCount >= 2 ? "Review flagged items" :
                    "Significant concerns"
                  }
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      item.passed ? "bg-green-50" : "bg-gray-50"
                    )}
                  >
                    {item.passed ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={cn(
                      "text-sm",
                      item.passed ? "text-green-700" : "text-gray-600"
                    )}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Decision */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select
                    value={formData.decision.decision}
                    onValueChange={(v) => updateSection("decision", "decision", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="go">GO — Proceed to next phase</SelectItem>
                      <SelectItem value="conditional">CONDITIONAL GO — Proceed with modifications</SelectItem>
                      <SelectItem value="hold">HOLD — Additional information needed</SelectItem>
                      <SelectItem value="no-go">NO GO — Do not proceed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Rationale</Label>
                    {!formData.decision.rationale && (
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleRegenerateRationale}>
                        Generate from figures
                      </Button>
                    )}
                  </div>
                  <StaleNarrativeNotice
                    stale={rationaleStale}
                    onRegenerate={handleRegenerateRationale}
                    message="The figures behind this rationale have changed. Regenerate it so the numbers match the analysis above."
                  />
                  <Textarea
                    value={formData.decision.rationale}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        decision: { ...prev.decision, rationale: e.target.value, rationaleFingerprint },
                      }));
                    }}
                    placeholder="Explain your decision and any conditions or concerns..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Date</Label>
                    <Input value={new Date().toLocaleDateString()} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reviewed By</Label>
                    <Input
                      value={formData.decision.reviewedBy}
                      onChange={(e) => updateSection("decision", "reviewedBy", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="border-[#1B4F72] text-[#1B4F72]"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side: Dashboard */}
      <div className="w-full flex-shrink-0 xl:basis-[35%] xl:grow-0">
        <FeasibilitySummaryDashboard
          data={formData}
          budgetData={budgetData}
          calculations={calculations}
        />
      </div>
    </div>
  );
};
