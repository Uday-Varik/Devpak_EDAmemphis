import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Eye, BarChart3, Home, TrendingUp, Plus, Trash2, HelpCircle, Search, ExternalLink, Loader2, AlertCircle, CheckCircle2, Database, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { searchNearbySales, type PropertySale } from "@/services/dataMidsouthAPI";
import { fetchAttomComps, logFallbackLookup, validateCompInput } from "@/services/attomAPI";
import { fetchCensusData, type CensusData } from "@/services/censusAPI";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { CurrencyInput, PercentageInput } from "./budget/CurrencyInput";
import { MarketSnapshotSummary } from "./vision-market/MarketSnapshotSummary";
import { Badge } from "@/components/ui/badge";
import { AIGenerateButton } from "@/components/ai/AIGenerateButton";
import { MultiSelectCheckbox, toArrayValue } from "@/components/ui/multi-select-checkbox";
import { formatCurrency } from "@/components/pdf/pdfUtils";
import { roundCurrency } from "@/utils/calculations";
import { composeAddress } from "@/utils/address";

interface VisionMarketFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const DEFAULT_DATA = {
  visionStatement: "",
  targetMarket: [] as string[],
  targetIncomeLevel: [] as string[],
  communityImpact: "",
  neighborhoodName: "",
  neighborhoodDescription: "",
  populationTrend: "",
  medianHouseholdIncome: 0,
  medianHomePrice: 0,
  averageRent: 0,
  vacancyRate: 0,
  marketTrend: "",
  comparables: [] as any[],
  projectedSalePriceOrRent: 0,
  daysOnMarketEstimate: "",
  censusPopulatedFields: [] as string[],
};

const TARGET_MARKET_OPTIONS = [
  "First-Time Homebuyers", "Move-Up Buyers", "Rental Tenants",
  "Voucher Program Tenants", "Mixed Income", "Investors", "Other",
];

const TARGET_INCOME_OPTIONS = [
  "Low Income (<50% AMI)", "Voucher Program Tenants",
  "Moderate Income (50-80% AMI)", "Workforce (80-120% AMI)",
  "Market Rate", "Mixed Income",
];

// Legacy values that may exist in saved data — map to current label
const LEGACY_INCOME_VALUE_MAP: Record<string, string> = {
  "section-8": "Voucher Program Tenants",
  "Section 8": "Voucher Program Tenants",
};

const normalizeIncomeArray = (v: unknown): string[] =>
  toArrayValue(v).map((x) => LEGACY_INCOME_VALUE_MAP[x] ?? x);

const POPULATION_TREND_OPTIONS = ["Growing", "Stable", "Declining"];
const MARKET_TREND_OPTIONS = ["Appreciating", "Stable", "Declining", "Emerging"];
const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];


const FieldHelp = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const VisionMarketForm = ({ data, onSave, saving }: VisionMarketFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_DATA,
    ...data,
    neighborhoodName: (data.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "").trim(),
    targetMarket: toArrayValue(data.targetMarket),
    targetIncomeLevel: normalizeIncomeArray(data.targetIncomeLevel),
  }));
  const [openSections, setOpenSections] = useState<string[]>(["vision"]);

  // Comp search state
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PropertySale[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [showSalesOnly, setShowSalesOnly] = useState(true);
  const [siteAddress, setSiteAddress] = useState<{ street: string; city: string; state: string; zip: string; lat?: number; lng?: number } | null>(null);
  const [compMeta, setCompMeta] = useState<{
    source: "attom" | "datamidsouth";
    excluded: number;
    estimate: number | null;
    estimateLow: number | null;
    estimateHigh: number | null;
    estimateSource?: "attom_avm" | "median_comp";
  } | null>(null);

  // Census data state
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [censusError, setCensusError] = useState<string | null>(null);
  const [censusFields, setCensusFields] = useState<Set<string>>(new Set(formData.censusPopulatedFields || []));

  // Fetch site-location data for address, fall back to project address
  useEffect(() => {
    if (!projectId) return;
    const fetchSite = async () => {
      // Try site-location section first
      const { data: siteData } = await supabase
        .from("project_details")
        .select("data")
        .eq("project_id", projectId)
        .eq("section", "site-location")
        .maybeSingle();
      if (siteData?.data) {
        const d = siteData.data as Record<string, any>;
        const cleanStreet = (d.streetAddress || "").replace(/^Street Address:\s*/i, "").trim();
        if (cleanStreet) {
          setSiteAddress({
            street: cleanStreet,
            city: d.city || "Memphis",
            state: d.state || "TN",
            zip: d.zipCode || "",
            lat: d.latitude,
            lng: d.longitude,
          });
          return;
        }
      }
      // Fallback: read project's address field
      const { data: proj } = await supabase
        .from("projects")
        .select("address")
        .eq("id", projectId)
        .maybeSingle();
      if (proj?.address) {
        setSiteAddress({
          street: proj.address,
          city: "Memphis",
          state: "TN",
          zip: "",
        });
      }
    };
    fetchSite();
  }, [projectId]);

  const hasAddress = siteAddress && siteAddress.street;
  const hasZip = siteAddress && siteAddress.zip && siteAddress.zip.length === 5;

  const handleLoadCensus = async () => {
    if (!hasZip) return;
    setCensusLoading(true);
    setCensusError(null);
    try {
      const { data: result, error } = await fetchCensusData(siteAddress!.zip);
      if (!result) {
        setCensusError(
          error ||
            "Census data could not be loaded for this ZIP code. Please check the ZIP and try again."
        );
        return;
      }
      setCensusData(result);
      const populated = new Set<string>();
      setFormData((prev: any) => {
        const updates: Record<string, any> = {};
        if (result.medianHouseholdIncome > 0) { updates.medianHouseholdIncome = result.medianHouseholdIncome; populated.add("medianHouseholdIncome"); }
        if (result.medianHomeValue > 0) { updates.medianHomePrice = result.medianHomeValue; populated.add("medianHomePrice"); }
        if (result.medianGrossRent > 0) { updates.averageRent = result.medianGrossRent; populated.add("averageRent"); }
        return { ...prev, ...updates, censusPopulatedFields: Array.from(populated) };
      });
      setCensusFields(populated);
    } catch {
      setCensusError(
        "Census data could not be loaded for this ZIP code. Please check the ZIP and try again."
      );
    } finally {
      setCensusLoading(false);
    }
  };

  const clearCensusBadge = (field: string) => {
    setCensusFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };


  const handleSearchComps = async () => {
    if (!hasAddress) return;
    setSearchError(null);
    setSearchResults([]);
    setSearchDone(false);
    setSearchNote(null);
    setCompMeta(null);
    // Validate before spending an ATTOM trial call
    const inputError = validateCompInput({ street: siteAddress!.street, state: siteAddress!.state, zip: siteAddress!.zip });
    if (inputError) {
      setSearchError(inputError);
      setSearchDone(true);
      return;
    }
    setSearchLoading(true);
    try {
      // Subject sqft from Project Scope (planned, else existing) for the ±25% filter
      let subjectSqft = 0;
      if (projectId) {
        const { data: scope } = await supabase
          .from("project_details").select("data").eq("project_id", projectId).eq("section", "project-scope").maybeSingle();
        const sd = (scope?.data || {}) as Record<string, any>;
        subjectSqft = Number(sd.sqftPlanned) || Number(sd.sqftExisting) || 0;
      }

      const attom = await fetchAttomComps({
        street: siteAddress!.street,
        city: siteAddress!.city,
        state: siteAddress!.state,
        zip: siteAddress!.zip,
        lat: siteAddress!.lat,
        lng: siteAddress!.lng,
        subjectSqft,
      });
      if (attom) {
        setSearchResults(attom.sales);
        setSearchNote([attom.searchNote, attom.distanceUnavailable ? "distance unavailable (address could not be located)" : null].filter(Boolean).join(" · ") || null);
        setCompMeta({
          source: "attom",
          excluded: attom.excluded,
          estimate: attom.estimate,
          estimateLow: attom.estimateLow,
          estimateHigh: attom.estimateHigh,
          estimateSource: attom.estimateSource,
        });
        setSearchDone(true);
        return;
      }

      // Silent fallback to Data Midsouth
      const result = await searchNearbySales({
        address: `${siteAddress!.street}, ${siteAddress!.city || "Memphis"}`,
        latitude: siteAddress!.lat,
        longitude: siteAddress!.lng,
        zipCode: siteAddress!.zip,
        radiusMiles: 1,
        monthsBack: 24,
        limit: 10,
        sortBy: siteAddress!.lat && siteAddress!.lng ? "distance" : "date",
      });
      setSearchResults(result.sales);
      setCompMeta({ source: "datamidsouth", excluded: 0, estimate: null, estimateLow: null, estimateHigh: null });
      if (result.searchNote) setSearchNote(result.searchNote);
      await logFallbackLookup({
        street: siteAddress!.street, state: siteAddress!.state, zip: siteAddress!.zip,
        found: result.sales.length > 0, compsReturned: result.sales.length, compsAfterFiltering: result.sales.length,
      });
      setSearchDone(true);
    } catch (err: any) {
      setSearchError("Could not load comparable sales. Use the manual research links below.");
      setSearchDone(true);
    } finally {
      setSearchLoading(false);
    }
  };

  // Selected comps are copied into this section's saved data (snapshot), so re-running
  // the search later never changes a saved package.
  const addFromSearch = (sale: PropertySale) => {
    if (formData.comparables.length >= 5) return;
    setFormData((prev: any) => ({
      ...prev,
      comparables: [
        ...prev.comparables,
        {
          address: sale.address,
          salePrice: sale.salePrice,
          sqft: sale.sqft || 0,
          bedrooms: sale.bedrooms || 0,
          bathrooms: sale.bathrooms || 0,
          condition: "",
          saleDate: sale.recordDate,
          distance: typeof sale.distanceMiles === "number" ? Number(sale.distanceMiles.toFixed(2)) : undefined,
          source: compMeta?.source || "datamidsouth",
          notes: `${sale.transactionType} — ${sale.propertyType || ""}${sale.yearBuilt ? `, Built ${sale.yearBuilt}` : ""}`,
        },
      ],
    }));
  };

  const isAlreadyAdded = (sale: PropertySale) =>
    formData.comparables.some((c: any) =>
      c.address && sale.address && c.address.toLowerCase() === sale.address.toLowerCase()
    );

  const handleAutoSave = useCallback(
    async (d: any) => {
      await onSave(d, false);
      window.dispatchEvent(new CustomEvent("section-data-updated", { detail: { section: "vision-market" } }));
    },
    [onSave]
  );
  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const update = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };


  const addComparable = () => {
    if (formData.comparables.length >= 5) return;
    setFormData((prev: any) => ({
      ...prev,
      comparables: [
        ...prev.comparables,
        { address: "", salePrice: 0, sqft: 0, bedrooms: 0, bathrooms: 0, condition: "", saleDate: "", notes: "" },
      ],
    }));
  };

  const updateComparable = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const comps = [...prev.comparables];
      comps[index] = { ...comps[index], [field]: value };
      return { ...prev, comparables: comps };
    });
  };

  const removeComparable = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      comparables: prev.comparables.filter((_: any, i: number) => i !== index),
    }));
  };

  const avgPricePerSqFt = useMemo(() => {
    const valid = formData.comparables.filter((c: any) => c.salePrice > 0 && c.sqft > 0);
    if (valid.length === 0) return 0;
    const total = valid.reduce((sum: number, c: any) => sum + c.salePrice / c.sqft, 0);
    return total / valid.length;
  }, [formData.comparables]);

  const formatCurrency = (num: number) =>
    num ? `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "$0";

  const handleSaveDraft = () => onSave(formData, false);
  const handleSaveAndContinue = () => onSave(formData, true);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* LEFT: Form */}
      <div className="flex-1 min-w-0">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* ACCORDION 1: Project Vision */}
          <AccordionItem value="vision" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-foreground">Project Vision</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Label>Project Vision Statement</Label>
                    <FieldHelp text="A compelling 2-3 sentence description of what this project will become." />
                  </div>
                  <Textarea
                    value={formData.visionStatement}
                    onChange={(e) => update("visionStatement", e.target.value.slice(0, 500))}
                    placeholder="Describe your vision for this project. What will it become? Who will it serve?"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.visionStatement.length}/500
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Market</Label>
                    <div className="mt-1.5">
                      <MultiSelectCheckbox
                        options={TARGET_MARKET_OPTIONS}
                        value={toArrayValue(formData.targetMarket)}
                        onChange={(v) => update("targetMarket", v)}
                        placeholder="Select target market(s)"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Target Income Level</Label>
                    <div className="mt-1.5">
                      <MultiSelectCheckbox
                        options={TARGET_INCOME_OPTIONS}
                        value={normalizeIncomeArray(formData.targetIncomeLevel)}
                        onChange={(v) => update("targetIncomeLevel", v)}
                        placeholder="Select income level(s)"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Label>Community Impact Statement</Label>
                      <FieldHelp text="Describe how this project benefits the surrounding community." />
                    </div>
                    <AIGenerateButton
                      section="vision-market.communityImpact"
                      context={{
                        address: composeAddress(siteAddress?.street, siteAddress?.city, siteAddress?.state, siteAddress?.zip),
                        neighborhoodName: formData.neighborhoodName,
                        targetMarket: formData.targetMarket,
                        targetIncomeLevel: formData.targetIncomeLevel,
                      }}
                      currentValue={formData.communityImpact || ""}
                      onInsert={(t) => update("communityImpact", t)}
                      prompt={`Write a community impact statement for a real estate development project in ${formData.neighborhoodName || "the neighborhood"}${siteAddress?.street ? ` at ${composeAddress(siteAddress?.street, siteAddress?.city, siteAddress?.state, siteAddress?.zip)}` : ""}. The project targets ${toArrayValue(formData.targetMarket).join(" / ") || "tenants/buyers"} at ${toArrayValue(formData.targetIncomeLevel).join(" / ") || "market rate"}. Describe how this project addresses housing needs and benefits the community. Write 2-3 sentences.`}
                    />
                  </div>
                  <Textarea
                    value={formData.communityImpact}
                    onChange={(e) => update("communityImpact", e.target.value)}
                    placeholder="How does this project benefit the surrounding community? Job creation, blight removal, housing supply, etc."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 2: Market Analysis */}
          <AccordionItem value="market" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-foreground">Market Analysis</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-5">
                {/* Census Data Button */}
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLoadCensus}
                            disabled={!hasZip || censusLoading}
                            className="gap-2"
                          >
                            {censusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            {censusLoading ? "Loading Census Data..." : "Load Census Data"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasZip && (
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Enter a ZIP code in Site &amp; Location to load Census data
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {censusError && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {censusError}
                    </span>
                  )}
                </div>

                {/* Census Info Card */}
                {censusData && (
                  <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <CheckCircle2 className="w-4 h-4" />
                      Census data loaded for ZIP {censusData.zipCode} (ACS 2022 5-Year Estimates)
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Population</span>
                        <p className="font-semibold text-foreground">{censusData.population.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Median Age</span>
                        <p className="font-semibold text-foreground">{censusData.medianAge}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ownership Rate</span>
                        <p className="font-semibold text-foreground">{censusData.ownershipRate}%</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-secondary/20">
                      Source: U.S. Census ACS 5-Year Estimates (ZIP code level data)
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Neighborhood Name</Label>
                    <Input
                      value={formData.neighborhoodName}
                      onChange={(e) => update("neighborhoodName", e.target.value)}
                      placeholder="e.g., Binghampton, Crosstown, Orange Mound"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Population Trend</Label>
                    <Select value={formData.populationTrend} onValueChange={(v) => update("populationTrend", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select trend" /></SelectTrigger>
                      <SelectContent>
                        {POPULATION_TREND_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Neighborhood Description</Label>
                    <AIGenerateButton
                      section="vision-market.neighborhoodDescription"
                      context={{
                        address: composeAddress(siteAddress?.street, siteAddress?.city, siteAddress?.state, siteAddress?.zip),
                        neighborhoodName: formData.neighborhoodName,
                        medianHouseholdIncome: roundCurrency(Number(formData.medianHouseholdIncome) || 0),
                        medianHomePrice: roundCurrency(Number(formData.medianHomePrice) || 0),
                        averageRent: roundCurrency(Number(formData.averageRent) || 0),
                        vacancyRate: formData.vacancyRate,
                        populationTrend: formData.populationTrend,
                        marketTrend: formData.marketTrend,
                        city: siteAddress?.city || "Memphis",
                        state: siteAddress?.state || "TN",
                        zipCode: siteAddress?.zip || "",
                      }}
                      currentValue={formData.neighborhoodDescription || ""}
                      onInsert={(t) => update("neighborhoodDescription", t)}
                      prompt={`Write a professional neighborhood description for the ${formData.neighborhoodName || "subject"} neighborhood in ${siteAddress?.city || "Memphis"}, ${siteAddress?.state || "TN"}${siteAddress?.zip ? ` (ZIP ${siteAddress?.zip})` : ""}. Median household income is ${formData.medianHouseholdIncome ? formatCurrency(Number(formData.medianHouseholdIncome)) : "n/a"}, median home price is ${formData.medianHomePrice ? formatCurrency(Number(formData.medianHomePrice)) : "n/a"}, average rent is ${formData.averageRent ? formatCurrency(Number(formData.averageRent)) : "n/a"}/mo, vacancy rate is ${formData.vacancyRate || "n/a"}%. Population trend is ${formData.populationTrend || "stable"}. Write 2-3 sentences suitable for a real estate development package. Frame the neighborhood positively or neutrally. Focus on opportunity, growth trajectory, community assets, and development momentum. Do not emphasize poverty, crime, vacancy, or decline. Even in challenged neighborhoods, highlight the investment thesis: affordability, upside potential, community need, and municipal support. A development package is a pitch document — the neighborhood description should support the project, not undermine it.`}
                    />
                  </div>
                  <Textarea
                    value={formData.neighborhoodDescription}
                    onChange={(e) => update("neighborhoodDescription", e.target.value)}
                    placeholder="Describe the neighborhood character, recent trends, and development activity"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Median Household Income (Annual)</Label>
                      {censusFields.has("medianHouseholdIncome") && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Census</Badge>}
                    </div>
                    <div className="mt-1.5">
                      <CurrencyInput value={formData.medianHouseholdIncome} onChange={(v) => { update("medianHouseholdIncome", v); clearCensusBadge("medianHouseholdIncome"); }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Typical household earnings per year in this ZIP</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Median Home Price</Label>
                      {censusFields.has("medianHomePrice") && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Census</Badge>}
                    </div>
                    <div className="mt-1.5">
                      <CurrencyInput value={formData.medianHomePrice} onChange={(v) => { update("medianHomePrice", v); clearCensusBadge("medianHomePrice"); }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Average Rent (Monthly)</Label>
                      {censusFields.has("averageRent") && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Census</Badge>}
                    </div>
                    <div className="mt-1.5">
                      <CurrencyInput value={formData.averageRent} onChange={(v) => { update("averageRent", v); clearCensusBadge("averageRent"); }} />
                    </div>
                    {/* HUD FMR Link */}
                    <a
                      href="https://www.huduser.gov/portal/datasets/fmr.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      HUD Fair Market Rents{hasZip ? ` (look up ZIP ${siteAddress!.zip})` : ""}
                    </a>
                  </div>
                  <div>
                    <Label>Vacancy Rate</Label>
                    <div className="mt-1.5">
                      <PercentageInput value={formData.vacancyRate} onChange={(v) => update("vacancyRate", v)} />
                    </div>
                  </div>
                  <div>
                    <Label>Market Trend</Label>
                    <Select value={formData.marketTrend} onValueChange={(v) => update("marketTrend", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select trend" /></SelectTrigger>
                      <SelectContent>
                        {MARKET_TREND_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 3: Comparable Properties */}
          <AccordionItem value="comps" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Home className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-foreground">Comparable Properties</span>
                {formData.comparables.length > 0 && (
                  <span className="ml-auto mr-4 text-sm text-muted-foreground">
                    {formData.comparables.length} comp{formData.comparables.length !== 1 ? "s" : ""} •
                    Avg {formatCurrency(Math.round(avgPricePerSqFt))}/sqft
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Find Nearby Sales */}
                <div className="border border-border rounded-lg p-4 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Find Comparable Sales</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Search recent property sales near this address
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSearchComps}
                            disabled={!hasAddress || searchLoading || formData.comparables.length >= 5}
                            className="gap-2"
                          >
                            {searchLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                            {searchLoading ? "Searching..." : "Find Nearby Sales"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasAddress && (
                        <TooltipContent>Enter a project address in Site & Location first.</TooltipContent>
                      )}
                    </Tooltip>
                  </div>

                  {hasAddress && (
                    <p className="text-xs text-muted-foreground">
                      Searching near: <span className="font-medium text-foreground">{siteAddress!.street}, {siteAddress!.city || "Memphis"}</span>
                    </p>
                  )}

                  {/* Search Results */}
                  {searchError && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-sm text-destructive">{searchError}</p>
                    </div>
                  )}

                  {searchDone && !searchError && searchResults.length === 0 && (
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No recent sales found near this address. Try the Shelby County Assessor's Neighborhood Sales tool for more results.
                      </p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          {searchResults.length} transactions found near {siteAddress?.street}
                          {compMeta && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                              Source: {compMeta.source === "attom" ? "ATTOM" : "Shelby County (Data Midsouth)"}
                            </Badge>
                          )}
                          {compMeta && compMeta.excluded > 0 && (
                            <span className="ml-2">{compMeta.excluded} excluded by filters</span>
                          )}
                          {compMeta?.estimate ? (
                            <span className="block mt-1 text-foreground">
                              {compMeta.estimateSource === "median_comp" ? "Median comp price" : "Estimated value"}: {formatCurrency(compMeta.estimate)}
                              {compMeta.estimateLow && compMeta.estimateHigh
                                ? ` (range ${formatCurrency(compMeta.estimateLow)} – ${formatCurrency(compMeta.estimateHigh)})`
                                : ""}
                            </span>
                          ) : null}
                          {searchNote && <span className="block mt-1">{searchNote}</span>}
                        </p>
                        <button
                          onClick={() => setShowSalesOnly((v) => !v)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Filter className="w-3 h-3" />
                          {showSalesOnly ? "Show all transactions" : "Show sales only"}
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {(() => {
                          const SALE_TYPES = ["WARRANTY DEED", "QUIT CLAIM DEED", "DEED"];
                          const FINANCING_TYPES = ["DEED OF TRUST", "MORTGAGE"];
                          const getCategory = (type: string) => {
                            const upper = (type || "").toUpperCase();
                            if (SALE_TYPES.some((s) => upper.includes(s) && !upper.includes("TRUST"))) return "sale";
                            if (FINANCING_TYPES.some((f) => upper.includes(f))) return "financing";
                            return "other";
                          };
                          const sorted = [...searchResults].sort((a, b) => {
                            const catOrder = { sale: 0, other: 1, financing: 2 };
                            return (catOrder[getCategory(a.transactionType)] || 1) - (catOrder[getCategory(b.transactionType)] || 1);
                          });
                          const filtered = showSalesOnly ? sorted.filter((s) => getCategory(s.transactionType) !== "financing") : sorted;
                          return filtered.map((sale) => {
                            const added = isAlreadyAdded(sale);
                            const cat = getCategory(sale.transactionType);
                            return (
                              <div
                                key={sale.transactionId}
                                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-secondary/40 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{sale.address}</p>
                                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 items-center">
                                    <span className="font-semibold text-foreground">
                                      ${sale.salePrice.toLocaleString()}
                                    </span>
                                    <span>
                                      {new Date(sale.recordDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                    </span>
                                    <span>{sale.sqft > 0 ? `${sale.sqft.toLocaleString()} SF` : "— SF"}</span>
                                    <span>{sale.bedrooms > 0 ? `${sale.bedrooms} bd` : "— bd"}</span>
                                    <span>{sale.bathrooms > 0 ? `${sale.bathrooms} ba` : "— ba"}</span>
                                    {(typeof sale.distanceMiles === "number" || !searchNote?.includes("distance unavailable")) && <span className="text-muted-foreground">
                                      {typeof sale.distanceMiles === "number"
                                        ? sale.distanceMiles < 0.1
                                          ? "<0.1 mi"
                                          : `${sale.distanceMiles.toFixed(2)} mi`
                                        : "— mi"}
                                    </span>}
                                    <span>{sale.transactionType}</span>
                                    {cat === "sale" && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">Sale</Badge>
                                    )}
                                    {cat === "financing" && (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">Financing</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={added || formData.comparables.length >= 5}
                                  onClick={() => addFromSearch(sale)}
                                  className={added ? "text-green-600 gap-1.5" : "text-secondary gap-1.5 hover:text-secondary hover:bg-secondary/10"}
                                >
                                  {added ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        {compMeta?.source === "attom"
                          ? "Sale prices, square footage and bed/bath counts from ATTOM. Verify details before relying on them."
                          : "Sale prices from Shelby County Register of Deeds. Add square footage and property details manually for complete comparables."}
                      </p>
                    </div>
                  )}

                  {/* External research links */}
                  <div className="flex gap-4 pt-1">
                    <a
                      href="https://assessormelvinburgess.com/neighborhoodSales"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      Shelby County Assessor — Neighborhood Sales
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://gis.register.shelby.tn.us"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      Register GIS Map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {formData.comparables.map((comp: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">Comp #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComparable(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Input
                        value={comp.address}
                        onChange={(e) => updateComparable(index, "address", e.target.value)}
                        placeholder="Property address"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Sale Price / Rent</Label>
                        <div className="mt-1.5">
                          <CurrencyInput value={comp.salePrice} onChange={(v) => updateComparable(index, "salePrice", v)} />
                        </div>
                      </div>
                      <div>
                        <Label>Square Footage</Label>
                        <Input
                          type="number"
                          value={comp.sqft || ""}
                          onChange={(e) => updateComparable(index, "sqft", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Price / Sq Ft</Label>
                        <Input
                          readOnly
                          value={comp.sqft > 0 && comp.salePrice > 0 ? `$${(comp.salePrice / comp.sqft).toFixed(2)}` : "—"}
                          className="mt-1.5 bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>Bedrooms</Label>
                        <Input
                          type="number"
                          value={comp.bedrooms || ""}
                          onChange={(e) => updateComparable(index, "bedrooms", parseInt(e.target.value) || 0)}
                          className="mt-1.5"
                          min={0}
                        />
                      </div>
                      <div>
                        <Label>Bathrooms</Label>
                        <Input
                          type="number"
                          value={comp.bathrooms || ""}
                          onChange={(e) => updateComparable(index, "bathrooms", parseFloat(e.target.value) || 0)}
                          className="mt-1.5"
                          min={0}
                          step={0.5}
                        />
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select value={comp.condition} onValueChange={(v) => updateComparable(index, "condition", v)}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sale / Lease Date</Label>
                        <Input
                          type="date"
                          value={comp.saleDate}
                          onChange={(e) => updateComparable(index, "saleDate", e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={comp.notes}
                        onChange={(e) => updateComparable(index, "notes", e.target.value)}
                        placeholder="How does this compare to your project?"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                ))}

                {formData.comparables.length < 5 && (
                  <Button variant="outline" onClick={addComparable} className="w-full border-dashed hover:border-secondary hover:text-secondary transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Comparable ({formData.comparables.length}/5)
                  </Button>
                )}

                {avgPricePerSqFt > 0 && (
                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Average Price per Sq Ft</span>
                      <span className="text-lg font-bold text-secondary">${avgPricePerSqFt.toFixed(2)}</span>
                    </div>
                  </div>
                )}

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 4: Disposition / Exit Strategy Support */}
          <AccordionItem value="exit" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-foreground">Disposition / Exit Strategy Support</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Label>Projected Sale Price or Monthly Rent</Label>
                    <FieldHelp text="Your projected exit value. If available, this pulls from the Feasibility section." />
                  </div>
                  <CurrencyInput value={formData.projectedSalePriceOrRent} onChange={(v) => update("projectedSalePriceOrRent", v)} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Label>Days on Market Estimate</Label>
                    <FieldHelp text="Average days similar properties take to sell or lease." />
                  </div>
                  <Input
                    type="number"
                    value={formData.daysOnMarketEstimate}
                    onChange={(e) => update("daysOnMarketEstimate", e.target.value)}
                    placeholder="Average days similar properties take to sell/lease"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="transition-all duration-300">
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all duration-300"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT: Market Snapshot Summary */}
      <div className="w-full xl:w-[320px] xl:min-w-[280px] flex-shrink-0">
        <div className="sticky top-24">
          <MarketSnapshotSummary formData={formData} avgPricePerSqFt={avgPricePerSqFt} />
        </div>
      </div>
    </div>
  );
};
