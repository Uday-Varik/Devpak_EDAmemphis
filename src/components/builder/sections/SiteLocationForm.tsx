import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { MapPin, Map, Landmark, Gift, Plus, Trash2, HelpCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { CurrencyInput } from "./budget/CurrencyInput";
import { SiteLocationSummary } from "./site-location/SiteLocationSummary";
import { SitePhotoUpload } from "./site-location/SitePhotoUpload";
import { cleanAddressPart } from "@/utils/address";

interface SiteLocationFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const DEFAULT_DATA = {
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  county: "",
  parcelNumber: "",
  legalDescription: "",
  lotSize: "",
  lotSizeUnit: "sqft",
  lotDimensions: "",
  topography: "",
  currentCondition: "",
  currentConditionOther: "",
  environmentalConcerns: [] as string[],
  environmentalConcernsOther: "",
  floodZone: "",
  utilitiesAvailable: [] as string[],
  currentZoning: "",
  zoningDescription: "",
  permittedUse: "",
  maxDensity: "",
  setbackRequirements: "",
  heightLimit: "",
  parkingRequirements: "",
  entitlementStatus: "",
  subsidyPrograms: [] as any[],
  photos: [] as any[],
};

const TOPOGRAPHY_OPTIONS = ["Flat", "Gentle Slope", "Moderate Slope", "Steep", "Irregular"];
const CONDITION_OPTIONS = ["Vacant Parcel / Land", "Existing Structure", "Other"];
const FLOOD_ZONE_OPTIONS = ["Zone X (Minimal Risk)", "Zone A", "Zone AE", "Zone V", "Unknown"];
const PERMITTED_USE_OPTIONS = ["By Right", "Conditional Use Permit Required", "Variance Required", "Rezoning Required"];
const ENTITLEMENT_OPTIONS = ["Not Started", "In Progress", "Approved", "Not Required"];
const MEMPHIS_PROGRAM_TYPES = [
  "CDBG (Community Development Block Grant)",
  "HOME Investment Partnership",
  "Opportunity Zone Tax Benefits",
  "Land Bank Property Tax Freeze",
  "THDA Down Payment Assistance",
  "Neighborhood Revitalization Grant",
  "Low-Interest Rehabilitation Loan",
  "Tax Increment Financing (TIF)",
];
const GENERAL_PROGRAM_TYPES = [
  "Tax Abatement",
  "Grant",
  "Low-Interest Loan",
  "Tax Credits",
  "Infrastructure Support",
  "Other",
];

const QUICK_SELECT_PROGRAMS = [
  { name: "Memphis CDBG", type: "CDBG (Community Development Block Grant)", notes: "HCD division, up to $25K for eligible rehab projects" },
  { name: "HOME Program", type: "HOME Investment Partnership", notes: "Federal funds for affordable housing, income restrictions apply" },
  { name: "Shelby County Land Bank", type: "Land Bank Property Tax Freeze", notes: "Property tax freeze on Land Bank acquisitions for up to 5 years" },
  { name: "Opportunity Zone", type: "Opportunity Zone Tax Benefits", notes: "Capital gains tax deferral and reduction for investments in designated zones" },
  { name: "THDA Great Choice", type: "THDA Down Payment Assistance", notes: "Up to $15K in down payment assistance for eligible buyers" },
];
const PROGRAM_STATUS_OPTIONS = ["Researching", "Applied", "Approved", "Received"];

const ENVIRONMENTAL_OPTIONS = [
  "Unknown", "Phase I Required", "Phase II Required", "Asbestos",
  "Lead Paint", "Underground Storage Tanks", "Wetlands", "Other",
];

const UTILITY_OPTIONS = ["Water", "Sewer", "Electric", "Gas", "Fiber/Internet"];

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

export const SiteLocationForm = ({ data, onSave, saving }: SiteLocationFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [formData, setFormData] = useState(() => {
    const merged = { ...DEFAULT_DATA, ...data };
    // Legacy data migrations
    const LEGACY_CONDITION_MAP: Record<string, string> = {
      "Vacant Land": "Vacant Parcel / Land",
      "Occupied Structure": "Existing Structure",
      "Vacant Structure": "Existing Structure",
      "Partially Demolished": "Existing Structure",
    };
    if (merged.currentCondition && LEGACY_CONDITION_MAP[merged.currentCondition]) {
      merged.currentCondition = LEGACY_CONDITION_MAP[merged.currentCondition];
    }
    if (Array.isArray(merged.environmentalConcerns)) {
      merged.environmentalConcerns = merged.environmentalConcerns
        .map((v: string) => (v === "None Known" ? "Unknown" : v))
        .filter((v: string) => v !== "Flood Zone");
    }
    return merged;
  });
  const [openSections, setOpenSections] = useState<string[]>(["address"]);
  const [matchedZip, setMatchedZip] = useState<string | null>(null);

  // Geocode the address (without the entered ZIP, so a wrong ZIP can't bias the match) and compare ZIPs
  useEffect(() => {
    const street = (formData.streetAddress || "").trim();
    if (!street || (!formData.city && !formData.state)) { setMatchedZip(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke("attom-comps", {
          body: { mode: "geocode", street, city: formData.city || "", state: formData.state || "", zip: "" },
        });
        if (!cancelled) setMatchedZip(data?.match?.zip || null);
      } catch { if (!cancelled) setMatchedZip(null); }
    }, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [formData.streetAddress, formData.city, formData.state]);
  const enteredZip = (formData.zipCode || "").trim().slice(0, 5);
  const zipMismatch = !!matchedZip && !!enteredZip && matchedZip !== enteredZip;

  const handleAutoSave = useCallback(
    async (d: any) => {
      await onSave({
        ...d,
        streetAddress: cleanAddressPart(d.streetAddress),
        city: cleanAddressPart(d.city),
        state: cleanAddressPart(d.state),
        zipCode: cleanAddressPart(d.zipCode),
      }, false);
      window.dispatchEvent(new CustomEvent("section-data-updated", { detail: { section: "site-location" } }));
    },
    [onSave]
  );
  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const ADDRESS_FIELDS = ["streetAddress", "city", "state", "zipCode"];
  const update = (field: string, value: any) => {
    const next = ADDRESS_FIELDS.includes(field) && typeof value === "string"
      ? cleanAddressPart(value)
      : value;
    setFormData((prev: any) => ({ ...prev, [field]: next }));
  };

  const toggleMultiSelect = (field: string, value: string) => {
    setFormData((prev: any) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value],
      };
    });
  };

  const addSubsidyProgram = (preset?: { name: string; type: string; notes: string }) => {
    setFormData((prev: any) => ({
      ...prev,
      subsidyPrograms: [
        ...prev.subsidyPrograms,
        { name: preset?.name || "", type: preset?.type || "", estimatedValue: 0, status: "Researching", notes: preset?.notes || "" },
      ],
    }));
  };

  const updateSubsidyProgram = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const programs = [...prev.subsidyPrograms];
      programs[index] = { ...programs[index], [field]: value };
      return { ...prev, subsidyPrograms: programs };
    });
  };

  const removeSubsidyProgram = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      subsidyPrograms: prev.subsidyPrograms.filter((_: any, i: number) => i !== index),
    }));
  };

  const totalSubsidyValue = useMemo(
    () => (formData.subsidyPrograms || []).reduce((sum: number, p: any) => sum + (Number(p.estimatedValue) || 0), 0),
    [formData.subsidyPrograms]
  );

  const sanitize = (d: any) => ({
    ...d,
    streetAddress: cleanAddressPart(d.streetAddress),
    city: cleanAddressPart(d.city),
    state: cleanAddressPart(d.state),
    zipCode: cleanAddressPart(d.zipCode),
  });
  const handleSaveDraft = () => onSave(sanitize(formData), false);
  const handleSaveAndContinue = () => onSave(sanitize(formData), true);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Left: Form */}
      <div className="flex-1 min-w-0">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* ACCORDION 1: Property Address */}
          <AccordionItem value="address" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Property Address</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    Street Address
                    <FieldHelp text="Start typing to search for an address. City, state, and ZIP will auto-fill when available." />
                  </Label>
                  <Input
                    placeholder="Enter property address..."
                    value={formData.streetAddress}
                    onChange={(e) => update("streetAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-1.5 block">City</Label>
                    <Input value={formData.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">State</Label>
                    <Input value={formData.state} onChange={(e) => update("state", e.target.value)} placeholder="State" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">ZIP Code</Label>
                    <Input value={formData.zipCode} onChange={(e) => update("zipCode", e.target.value)} placeholder="ZIP" className={zipMismatch ? "border-warning" : undefined} />
                    {zipMismatch && (
                      <div className="mt-2 rounded-md border-l-4 border-amber-500 bg-amber-50 p-2 text-xs text-amber-900">
                        <p>This address matches ZIP {matchedZip}, but {enteredZip} was entered. Comparable sales and census data depend on the correct ZIP.</p>
                        <Button type="button" size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => update("zipCode", matchedZip)}>
                          Use {matchedZip}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">County</Label>
                    <Input value={formData.county} onChange={(e) => update("county", e.target.value)} placeholder="County name" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1.5">
                      Parcel Number / APN
                      <FieldHelp text="Found on the county assessor website or your property tax statement." />
                    </Label>
                    <Input value={formData.parcelNumber} onChange={(e) => update("parcelNumber", e.target.value)} placeholder="Found on county assessor website" />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    Legal Description
                    <FieldHelp text="The legal description as shown on the deed or title report." />
                  </Label>
                  <Textarea
                    value={formData.legalDescription}
                    onChange={(e) => update("legalDescription", e.target.value)}
                    placeholder="As shown on deed or title report"
                    rows={3}
                  />
                </div>
              {/* Site Photos */}
              {projectId && (
                <div className="pt-4 border-t border-border">
                  <SitePhotoUpload
                    photos={formData.photos || []}
                    onChange={(photos) => update("photos", photos)}
                    projectId={projectId}
                  />
                </div>
              )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 2: Lot & Site Details */}
          <AccordionItem value="lot-details" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Map className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Lot & Site Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Lot Size</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.lotSize}
                        onChange={(e) => update("lotSize", e.target.value)}
                        placeholder="e.g., 6000"
                        className="flex-1"
                      />
                      <Select value={formData.lotSizeUnit} onValueChange={(v) => update("lotSizeUnit", v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sqft">sq ft</SelectItem>
                          <SelectItem value="acres">acres</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Lot Dimensions</Label>
                    <Input value={formData.lotDimensions} onChange={(e) => update("lotDimensions", e.target.value)} placeholder="e.g., 50' x 120'" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Topography</Label>
                    <Select value={formData.topography} onValueChange={(v) => update("topography", v)}>
                      <SelectTrigger><SelectValue placeholder="Select topography" /></SelectTrigger>
                      <SelectContent>
                        {TOPOGRAPHY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Current Condition</Label>
                    <Select value={formData.currentCondition} onValueChange={(v) => update("currentCondition", v)}>
                      <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formData.currentCondition === "Other" && (
                      <Input
                        value={formData.currentConditionOther || ""}
                        onChange={(e) => update("currentConditionOther", e.target.value)}
                        placeholder="Please describe the current condition"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Flood Zone</Label>
                  <Select value={formData.floodZone} onValueChange={(v) => update("floodZone", v)}>
                    <SelectTrigger><SelectValue placeholder="Select flood zone" /></SelectTrigger>
                    <SelectContent>
                      {FLOOD_ZONE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Environmental Concerns */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    Environmental Concerns
                    <FieldHelp text="Select all that apply. Environmental issues can significantly impact project timeline and costs." />
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ENVIRONMENTAL_OPTIONS.map((option) => {
                      const selected = (formData.environmentalConcerns || []).includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleMultiSelect("environmentalConcerns", option)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-all duration-200 hover:border-secondary ${
                            selected
                              ? "border-secondary bg-secondary/5 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            selected ? "bg-secondary border-secondary" : "border-muted-foreground/30"
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-secondary-foreground" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {(formData.environmentalConcerns || []).includes("Other") && (
                    <Input
                      value={formData.environmentalConcernsOther || ""}
                      onChange={(e) => update("environmentalConcernsOther", e.target.value)}
                      placeholder="Please describe the environmental concern"
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Utilities Available */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    Utilities Available
                    <FieldHelp text="Confirm availability with local utility providers before purchase." />
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {UTILITY_OPTIONS.map((option) => {
                      const selected = (formData.utilitiesAvailable || []).includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleMultiSelect("utilitiesAvailable", option)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-all duration-200 hover:border-secondary ${
                            selected
                              ? "border-secondary bg-secondary/5 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            selected ? "bg-secondary border-secondary" : "border-muted-foreground/30"
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-secondary-foreground" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 3: Zoning & Entitlements */}
          <AccordionItem value="zoning" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Zoning & Entitlements</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1.5">
                      Current Zoning
                      <FieldHelp text="Check with your local planning department or assessor website." />
                    </Label>
                    <Input value={formData.currentZoning} onChange={(e) => update("currentZoning", e.target.value)} placeholder="e.g., R-2, RM-20, C-3" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Zoning Description</Label>
                    <Input value={formData.zoningDescription} onChange={(e) => update("zoningDescription", e.target.value)} placeholder="e.g., Residential Multi-Family" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Permitted Use</Label>
                    <Select value={formData.permittedUse} onValueChange={(v) => update("permittedUse", v)}>
                      <SelectTrigger><SelectValue placeholder="Select permitted use" /></SelectTrigger>
                      <SelectContent>
                        {PERMITTED_USE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Maximum Density Allowed</Label>
                    <Input value={formData.maxDensity} onChange={(e) => update("maxDensity", e.target.value)} placeholder="e.g., 4 units per acre" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Setback Requirements</Label>
                    <Input value={formData.setbackRequirements} onChange={(e) => update("setbackRequirements", e.target.value)} placeholder="e.g., Front: 25', Side: 5', Rear: 20'" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Height Limit</Label>
                    <div className="flex gap-2">
                      <Input value={formData.heightLimit} onChange={(e) => update("heightLimit", e.target.value)} placeholder="e.g., 35" className="flex-1" />
                      <span className="flex items-center justify-center px-3 bg-muted border border-border rounded-md text-sm text-muted-foreground font-medium">ft</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Parking Requirements</Label>
                    <Input value={formData.parkingRequirements} onChange={(e) => update("parkingRequirements", e.target.value)} placeholder="e.g., 1 space per unit" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Entitlement Status</Label>
                    <Select value={formData.entitlementStatus} onValueChange={(v) => update("entitlementStatus", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {ENTITLEMENT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 4: Subsidies & Incentives */}
          <AccordionItem value="subsidies" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors duration-300">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Subsidies & Incentives</span>
                {totalSubsidyValue > 0 && (
                  <span className="ml-auto mr-2 text-sm font-medium text-green-600">
                    {formatCurrency(totalSubsidyValue)}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-2">
                {totalSubsidyValue > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      You have <span className="font-semibold">{formatCurrency(totalSubsidyValue)}</span> in incentives listed here. Make sure to include these in your Sources and Uses (Budget &amp; Sources/Uses section) as grant funding.
                    </p>
                  </div>
                )}
                {(formData.subsidyPrograms || []).map((program: any, index: number) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Program {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubsidyProgram(index)}
                        className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block text-xs">Program Name</Label>
                        <Input
                          value={program.name}
                          onChange={(e) => updateSubsidyProgram(index, "name", e.target.value)}
                          placeholder="e.g., Memphis PILOT, TIF, CDBG"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs">Program Type</Label>
                        <Select value={program.type} onValueChange={(v) => updateSubsidyProgram(index, "type", v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel className="text-xs font-semibold text-muted-foreground">Memphis Programs</SelectLabel>
                              {MEMPHIS_PROGRAM_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel className="text-xs font-semibold text-muted-foreground">General</SelectLabel>
                              {GENERAL_PROGRAM_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block text-xs">Estimated Value</Label>
                        <CurrencyInput
                          value={program.estimatedValue || 0}
                          onChange={(v) => updateSubsidyProgram(index, "estimatedValue", v)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs">Status</Label>
                        <Select value={program.status} onValueChange={(v) => updateSubsidyProgram(index, "status", v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            {PROGRAM_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Notes</Label>
                      <Input
                        value={program.notes}
                        onChange={(e) => updateSubsidyProgram(index, "notes", e.target.value)}
                        placeholder="Additional details..."
                        className="h-9"
                      />
                    </div>
                  </div>
                ))}

                {/* Quick-select panel */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick Add — Common Memphis Programs</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {QUICK_SELECT_PROGRAMS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => addSubsidyProgram(preset)}
                        className="text-left p-3 rounded-lg border border-dashed border-border hover:border-secondary hover:bg-secondary/5 transition-all duration-200 group"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-secondary">{preset.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{preset.notes}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSubsidyProgram()}
                      className="text-left p-3 rounded-lg border border-dashed border-border hover:border-secondary hover:bg-secondary/5 transition-all duration-200 group"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-secondary">Custom Program</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Add a program not listed above</p>
                    </button>
                  </div>
                </div>

                {totalSubsidyValue > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-800">Total Estimated Incentive Value</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(totalSubsidyValue)}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Buttons */}
        <div className="flex items-center justify-between mt-8">
          <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="transition-all duration-300">
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="btn-accent px-6 transition-all duration-300"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Live Summary */}
      <div className="w-full xl:w-[300px] flex-shrink-0">
        <SiteLocationSummary formData={formData} totalSubsidyValue={totalSubsidyValue} />
      </div>
    </div>
  );
};
