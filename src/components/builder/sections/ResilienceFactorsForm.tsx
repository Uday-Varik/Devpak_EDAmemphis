import { useState, useCallback, useMemo } from "react";
import { DollarSign, Wrench, TrendingUp, FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ResilienceScoreCard } from "./resilience-factors/ResilienceScoreCard";
import { fetchProjectSections, generateResilienceScore } from "@/utils/autoAssess";

interface ResilienceFactorsFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
  projectId: string;
}

import {
  FINANCIAL_FACTORS,
  PROJECT_FACTORS,
  MARKET_FACTORS,
  computeResilience,
} from "@/utils/resilience";


const DEFAULT_DATA: Record<string, any> = {
  additionalStrengths: "",
  ...Object.fromEntries(FINANCIAL_FACTORS.map((f) => [f.key, false])),
  ...Object.fromEntries(PROJECT_FACTORS.map((f) => [f.key, false])),
  ...Object.fromEntries(MARKET_FACTORS.map((f) => [f.key, false])),
};

export const ResilienceFactorsForm = ({ data, onSave, saving, projectId }: ResilienceFactorsFormProps) => {
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_DATA, ...data }));
  const [openSections, setOpenSections] = useState<string[]>(["financial"]);
  const [autoLoading, setAutoLoading] = useState(false);
  const autoFlags: Record<string, boolean> = formData._autoFlags || {};

  const handleAutoSave = useCallback(
    (dataToSave: Record<string, any>) => onSave(dataToSave, false),
    [onSave]
  );
  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const update = (field: string, value: any) => {
    setFormData((prev: any) => {
      const nextFlags = { ...(prev._autoFlags || {}) };
      delete nextFlags[field];
      return { ...prev, [field]: value, _autoFlags: nextFlags };
    });
  };

  const handleAutoScore = async () => {
    if (!projectId) return;
    setAutoLoading(true);
    try {
      const sections = await fetchProjectSections(projectId);
      const { checks, autoFlags } = generateResilienceScore(sections);
      const next = { ...formData, ...checks, _autoFlags: autoFlags };
      setFormData(next);
      await onSave(next, false);
      const count = Object.values(checks).filter(Boolean).length;
      toast.success(`Auto-scored ${count} resilience factor${count !== 1 ? "s" : ""}.`);
    } catch (e) {
      toast.error("Failed to auto-score resilience factors.");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleSaveDraft = () => onSave(formData, false);
  const handleSaveAndContinue = () => onSave(formData, true);

  const scores = useMemo(() => {
    const s = computeResilience(formData);
    return { financial: s.financial, project: s.project, market: s.market, total: s.total };
  }, [formData]);

  const renderFactorGroup = (factors: readonly { key: string; label: string }[]) => (
    <div className="space-y-3">
      {factors.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
          <Label htmlFor={key} className="text-sm text-foreground cursor-pointer flex-1 pr-4 flex items-center gap-2">
            <span>{label}</span>
            {autoFlags[key] && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">auto</Badge>}
          </Label>
          <Switch
            id={key}
            checked={!!formData[key]}
            onCheckedChange={(checked) => update(key, checked)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5">
          <div>
            <p className="text-sm font-semibold text-foreground">Auto-Score Resilience</p>
            <p className="text-xs text-muted-foreground">Evaluate factors based on data already entered. You can override any factor.</p>
          </div>
          <Button onClick={handleAutoScore} disabled={autoLoading || !projectId} className="btn-accent">
            {autoLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" />Auto-Score</>}
          </Button>
        </div>
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* FINANCIAL RESILIENCE */}
          <AccordionItem value="financial" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Financial Resilience</span>
                  <span className="block text-xs text-muted-foreground">
                    {scores.financial} of {FINANCIAL_FACTORS.length} factors
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {renderFactorGroup(FINANCIAL_FACTORS)}
            </AccordionContent>
          </AccordionItem>

          {/* PROJECT RESILIENCE */}
          <AccordionItem value="project" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Project Resilience</span>
                  <span className="block text-xs text-muted-foreground">
                    {scores.project} of {PROJECT_FACTORS.length} factors
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {renderFactorGroup(PROJECT_FACTORS)}
            </AccordionContent>
          </AccordionItem>

          {/* MARKET RESILIENCE */}
          <AccordionItem value="market" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Market Resilience</span>
                  <span className="block text-xs text-muted-foreground">
                    {scores.market} of {MARKET_FACTORS.length} factors
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {renderFactorGroup(MARKET_FACTORS)}
            </AccordionContent>
          </AccordionItem>

          {/* ADDITIONAL STRENGTHS */}
          <AccordionItem value="additional" className="border border-border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Additional Strengths</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Textarea
                value={formData.additionalStrengths}
                onChange={(e) => update("additionalStrengths", e.target.value)}
                placeholder="Describe any additional factors that strengthen this project (e.g., developer experience, community support, pre-leasing interest, etc.)"
                rows={5}
              />
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

      {/* Right: Resilience Score */}
      <div className="w-full xl:w-[300px] flex-shrink-0">
        <ResilienceScoreCard scores={scores} totalFactors={20} />
      </div>
    </div>
  );
};
