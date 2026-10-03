import { useState, useCallback, useMemo } from "react";
import { ShieldAlert, Shield, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { RiskSummaryCard } from "./risk-assessment/RiskSummaryCard";
import { fetchProjectSections, generateAutoRisks } from "@/utils/autoAssess";
import { AIGenerateButton } from "@/components/ai/AIGenerateButton";

interface RiskAssessmentFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
  projectId: string;
}

interface Risk {
  id: string;
  category: string;
  description: string;
  likelihood: string;
  impact: string;
  mitigation: string;
  status: string;
}

const RISK_CATEGORIES = [
  "Construction", "Financial", "Market", "Regulatory",
  "Environmental", "Title/Legal", "Timeline", "Management",
];

const LIKELIHOOD_OPTIONS = ["Low", "Medium", "High"];
const IMPACT_OPTIONS = ["Low", "Medium", "High"];
const RISK_STATUS_OPTIONS = ["Identified", "Mitigated", "Accepted", "Monitoring"];

const INSURANCE_OPTIONS = ["Obtained", "Pending", "Not Yet", "Not Required"];
const INSURANCE_OPTIONS_NO_NA = ["Obtained", "Pending", "Not Yet"];
const PERMIT_OPTIONS = ["All Obtained", "In Progress", "Not Started"];

const DEFAULT_RISKS: Risk[] = [
  {
    id: crypto.randomUUID(),
    category: "Construction",
    description: "Construction costs exceed budget",
    likelihood: "Medium",
    impact: "High",
    mitigation: "15% contingency included, fixed-price contract with GC",
    status: "Mitigated",
  },
  {
    id: crypto.randomUUID(),
    category: "Market",
    description: "Property values decline before sale/lease",
    likelihood: "Low",
    impact: "Medium",
    mitigation: "Conservative ARV based on recent comps, rental fallback strategy",
    status: "Mitigated",
  },
  {
    id: crypto.randomUUID(),
    category: "Timeline",
    description: "Project completion delayed",
    likelihood: "Medium",
    impact: "Medium",
    mitigation: "Buffer built into schedule, penalty clause in GC contract",
    status: "Monitoring",
  },
];

const DEFAULT_DATA = {
  risks: DEFAULT_RISKS,
  buildersRiskInsurance: "",
  generalLiabilityInsurance: "",
  titleInsurance: "",
  propertyInsurance: "",
  permitStatus: "",
  codeComplianceNotes: "",
};

export const RiskAssessmentForm = ({ data, onSave, saving, projectId }: RiskAssessmentFormProps) => {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_DATA,
    ...data,
    risks: data.risks?.length ? data.risks : DEFAULT_RISKS,
  }));
  const [openSections, setOpenSections] = useState<string[]>(["project-risks"]);
  const [autoLoading, setAutoLoading] = useState(false);

  const handleAutoAssess = async () => {
    if (!projectId) return;
    if (formData.risks?.length && !window.confirm("This will replace your current risks with auto-assessed ones. Continue?")) return;
    setAutoLoading(true);
    try {
      const sections = await fetchProjectSections(projectId);
      // Include the form's current insurance data so the assessor sees latest state
      sections.riskAssessment = { ...sections.riskAssessment, ...formData };
      const risks = generateAutoRisks(sections);
      const next = { ...formData, risks };
      setFormData(next);
      await onSave(next, false);
      toast.success(`Generated ${risks.length} project-specific risk${risks.length !== 1 ? "s" : ""}.`);
    } catch (e) {
      toast.error("Failed to auto-assess risks.");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleAutoSave = useCallback(
    (dataToSave: Record<string, any>) => onSave(dataToSave, false),
    [onSave]
  );
  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const update = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const addRisk = () => {
    const newRisk: Risk = {
      id: crypto.randomUUID(),
      category: "",
      description: "",
      likelihood: "",
      impact: "",
      mitigation: "",
      status: "Identified",
    };
    update("risks", [...formData.risks, newRisk]);
  };

  const updateRisk = (id: string, field: string, value: string) => {
    update(
      "risks",
      formData.risks.map((r: Risk) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRisk = (id: string) => {
    update("risks", formData.risks.filter((r: Risk) => r.id !== id));
  };

  const handleSaveDraft = () => onSave(formData, false);
  const handleSaveAndContinue = () => onSave(formData, true);

  const insuranceFields = [
    formData.buildersRiskInsurance,
    formData.generalLiabilityInsurance,
    formData.titleInsurance,
    formData.propertyInsurance,
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5">
          <div>
            <p className="text-sm font-semibold text-foreground">Auto-Assess Risks</p>
            <p className="text-xs text-muted-foreground">Analyze your project data and generate project-specific risks.</p>
          </div>
          <Button onClick={handleAutoAssess} disabled={autoLoading || !projectId} className="btn-accent">
            {autoLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" />Auto-Assess Risks</>}
          </Button>
        </div>
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* ACCORDION 1: PROJECT RISKS */}
          <AccordionItem value="project-risks" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Project Risks</span>
                  <span className="block text-xs text-muted-foreground">
                    {formData.risks.length} risk{formData.risks.length !== 1 ? "s" : ""} identified
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {formData.risks.map((risk: Risk, index: number) => (
                  <div key={risk.id} className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Risk #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRisk(risk.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Risk Category</Label>
                        <Select value={risk.category} onValueChange={(v) => updateRisk(risk.id, "category", v)}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {RISK_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <Select value={risk.status} onValueChange={(v) => updateRisk(risk.id, "status", v)}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            {RISK_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Risk Description</Label>
                      <Input
                        value={risk.description}
                        onChange={(e) => updateRisk(risk.id, "description", e.target.value)}
                        placeholder="Describe the specific risk"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Likelihood</Label>
                        <Select value={risk.likelihood} onValueChange={(v) => updateRisk(risk.id, "likelihood", v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {LIKELIHOOD_OPTIONS.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Impact</Label>
                        <Select value={risk.impact} onValueChange={(v) => updateRisk(risk.id, "impact", v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {IMPACT_OPTIONS.map((i) => (
                              <SelectItem key={i} value={i}>{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Mitigation Strategy</Label>
                        <AIGenerateButton
                          section="risk-assessment.mitigation"
                          context={{
                            riskCategory: risk.category,
                            riskDescription: risk.description,
                            riskLikelihood: risk.likelihood,
                            riskImpact: risk.impact,
                          }}
                          currentValue={risk.mitigation || ""}
                          onInsert={(t) => updateRisk(risk.id, "mitigation", t)}
                          prompt={`Write a professional mitigation strategy for this risk in a real estate development project: ${risk.description || "(unspecified risk)"}. Category: ${risk.category || "general"}, Likelihood: ${risk.likelihood || "unknown"}, Impact: ${risk.impact || "unknown"}. Write 1-2 sentences describing specific actions to mitigate this risk.`}
                          maxTokens={200}
                        />
                      </div>
                      <Textarea
                        value={risk.mitigation}
                        onChange={(e) => updateRisk(risk.id, "mitigation", e.target.value)}
                        placeholder="How will you address this risk?"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addRisk} className="w-full transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" /> Add Risk
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ACCORDION 2: INSURANCE & COMPLIANCE */}
          <AccordionItem value="insurance-compliance" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Insurance & Compliance</span>
                  <span className="block text-xs text-muted-foreground">
                    {insuranceFields.filter((v) => v === "Obtained").length} of 4 insurance policies obtained
                    {formData.permitStatus ? ` • Permits: ${formData.permitStatus}` : ""}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {[
                  { key: "buildersRiskInsurance", label: "Builder's Risk Insurance", options: INSURANCE_OPTIONS },
                  { key: "generalLiabilityInsurance", label: "General Liability Insurance", options: INSURANCE_OPTIONS },
                  { key: "titleInsurance", label: "Title Insurance", options: INSURANCE_OPTIONS_NO_NA },
                  { key: "propertyInsurance", label: "Property Insurance", options: INSURANCE_OPTIONS_NO_NA },
                ].map(({ key, label, options }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Select value={formData[key]} onValueChange={(v) => update(key, v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label>Permit Status</Label>
                  <Select value={formData.permitStatus} onValueChange={(v) => update("permitStatus", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {PERMIT_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Code Compliance Notes</Label>
                  <Textarea
                    value={formData.codeComplianceNotes}
                    onChange={(e) => update("codeComplianceNotes", e.target.value)}
                    placeholder="Any known code compliance issues or requirements"
                    rows={3}
                  />
                </div>
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

      {/* Right: Risk Summary */}
      <div className="w-full xl:w-[300px] flex-shrink-0">
        <RiskSummaryCard formData={formData} />
      </div>
    </div>
  );
};
