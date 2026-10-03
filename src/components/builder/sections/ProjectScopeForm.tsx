import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { ConceptDrawingsUpload } from "./scope/ConceptDrawingsUpload";
import { AIGenerateButton } from "@/components/ai/AIGenerateButton";
import { PROJECT_TYPE_OPTIONS, normalizeProjectType, normalizePropertyType } from "@/lib/projectTypes";
import { toast } from "sonner";

interface ProjectScopeFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const PROJECT_TYPES = PROJECT_TYPE_OPTIONS;

// Square footage must be greater than 0; blank is allowed while editing.
const positiveOrEmpty = (v: string) => {
  if (v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? v : "";
};

const PROPERTY_TYPES = [
  { value: "single-family", label: "Single Family" },
  { value: "duplex", label: "Duplex" },
  { value: "triplex", label: "Triplex" },
  { value: "fourplex", label: "Fourplex" },
];

export const ProjectScopeForm = ({ data, onSave, saving }: ProjectScopeFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();

  const [formData, setFormData] = useState(() => {
    const base = {
      projectType: "",
      propertyType: "",
      numberOfUnits: "",
      sqftExisting: "",
      sqftPlanned: "",
      bedroomsPerUnit: "",
      bathroomsPerUnit: "",
      scopeOfWork: "",
      conceptDrawings: [] as any[],
      ...data,
    };
    base.projectType = normalizeProjectType(base.projectType);
    base.propertyType = normalizePropertyType(base.propertyType);
    return base;
  });

  useEffect(() => {
    setFormData((prev) => {
      const next = { ...prev, ...data };
      next.projectType = normalizeProjectType(next.projectType);
      next.propertyType = normalizePropertyType(next.propertyType);
      return next;
    });
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "projectType" && prev.projectType && prev.projectType !== value) {
        toast("Project type changed", {
          description: "Some default suggestions may have updated. Your entered data has been preserved.",
        });
      }
      // Auto-fill Number of Units from Property Type, but only if the user hasn't entered a value yet
      if (field === "propertyType") {
        const UNIT_MAP: Record<string, string> = {
          "single-family": "1",
          duplex: "2",
          triplex: "3",
          fourplex: "4",
        };
        const current = String(prev.numberOfUnits ?? "").trim();
        if ((current === "" || current === "0") && UNIT_MAP[value]) {
          next.numberOfUnits = UNIT_MAP[value];
        }
      }
      return next;
    });
  };

  const handleAutoSave = useCallback(async (data: any) => {
    await onSave(data, false);
    // Notify other sections (Budget, Feasibility) that scope changed.
    window.dispatchEvent(new CustomEvent("section-data-updated", { detail: { section: "project-scope" } }));
  }, [onSave]);

  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const handleSaveDraft = async () => {
    await onSave(formData, false);
  };

  const handleSaveAndContinue = async () => {
    await onSave(formData, true);
  };

  const isNewConstruction = formData.projectType === "new-construction";
  const showExisting = !isNewConstruction && !!formData.projectType;
  const showPlanned = !!formData.projectType;
  const showRenovationHint = formData.projectType && formData.projectType !== "new-construction";

  return (
    <div className="space-y-8">
      {/* Project Type & Property Type Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="projectType">Project Type *</Label>
          <Select
            value={formData.projectType}
            onValueChange={(value) => handleChange("projectType", value)}
          >
            <SelectTrigger id="projectType">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select
            value={formData.propertyType}
            onValueChange={(value) => handleChange("propertyType", value)}
          >
            <SelectTrigger id="propertyType">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Units */}
      <div className="space-y-2">
        <Label htmlFor="numberOfUnits">Number of Units</Label>
        <Input
          id="numberOfUnits"
          type="number"
          min="1"
          max="4"
          placeholder="e.g., 2"
          value={formData.numberOfUnits}
          step="1"
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return handleChange("numberOfUnits", "");
            const n = Math.round(Number(v));
            if (!Number.isFinite(n)) return;
            handleChange("numberOfUnits", String(Math.min(4, Math.max(1, n))));
          }}
        />
      </div>

      {/* Square Footage Row - Conditional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showExisting && (
          <div className="space-y-2">
            <Label htmlFor="sqftExisting">Square Footage — Existing</Label>
            <Input
              id="sqftExisting"
              type="number"
              min="0"
              placeholder="e.g., 1800"
              value={formData.sqftExisting}
              onChange={(e) => handleChange("sqftExisting", positiveOrEmpty(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Current square footage before construction</p>
          </div>
        )}

        {showPlanned && (
          <div className="space-y-2">
            <Label htmlFor="sqftPlanned">
              Square Footage — {isNewConstruction ? "Planned" : "Planned (After Construction)"}
            </Label>
            <Input
              id="sqftPlanned"
              type="number"
              min="0"
              placeholder="Total square footage after construction/renovation"
              value={formData.sqftPlanned}
              onChange={(e) => handleChange("sqftPlanned", positiveOrEmpty(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {isNewConstruction
                ? "Total planned square footage"
                : "Include any additions or expansions"}
            </p>
          </div>
        )}
      </div>

      {/* Bedrooms & Bathrooms Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bedroomsPerUnit">Bedrooms per Unit</Label>
          <Input
            id="bedroomsPerUnit"
            type="number"
            min="0"
            placeholder="e.g., 3"
            value={formData.bedroomsPerUnit}
            onChange={(e) => handleChange("bedroomsPerUnit", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathroomsPerUnit">Bathrooms per Unit</Label>
          <Input
            id="bathroomsPerUnit"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g., 2"
            value={formData.bathroomsPerUnit}
            onChange={(e) => handleChange("bathroomsPerUnit", e.target.value)}
          />
        </div>
      </div>

      {/* Scope of Work */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="scopeOfWork">Scope of Work</Label>
          <AIGenerateButton
            section="project-scope.scopeOfWork"
            context={{
              projectType: formData.projectType,
              propertyType: formData.propertyType,
              numberOfUnits: formData.numberOfUnits,
              sqftExisting: formData.sqftExisting,
              sqftPlanned: formData.sqftPlanned,
              bedroomsPerUnit: formData.bedroomsPerUnit,
              bathroomsPerUnit: formData.bathroomsPerUnit,
            }}
            currentValue={formData.scopeOfWork || ""}
            onInsert={(t) => handleChange("scopeOfWork", t)}
            prompt={`Write a professional scope of work description for a ${formData.projectType || "residential"} ${formData.propertyType || "property"} project. ${formData.numberOfUnits || ""} units, ${formData.sqftPlanned || ""} sq ft planned. Include key construction phases and materials. Write 2-3 sentences, professional tone suitable for a lender package.`}
          />
        </div>
        <Textarea
          id="scopeOfWork"
          placeholder={showRenovationHint
            ? "Describe the scope of work: What are you building or renovating? What systems are you updating? What's the condition of the existing structure?"
            : "Describe your project scope in a few sentences. What are you building? What's your vision?"}
          rows={5}
          value={formData.scopeOfWork}
          onChange={(e) => handleChange("scopeOfWork", e.target.value)}
        />
      </div>

      {/* Concept Drawings */}
      {projectId && (
        <div className="pt-4 border-t border-border">
          <ConceptDrawingsUpload
            drawings={formData.conceptDrawings || []}
            onChange={(drawings) => handleChange("conceptDrawings", drawings)}
            projectId={projectId}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-6 border-t border-border">
        <Button
          variant="accent"
          size="lg"
          onClick={handleSaveAndContinue}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleSaveDraft}
          disabled={saving}
        >
          Save Draft
        </Button>
        <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
      </div>
    </div>
  );
};
