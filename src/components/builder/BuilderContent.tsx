import { Section } from "@/pages/ProjectBuilder";
import { ProjectScopeForm } from "./sections/ProjectScopeForm";
import { BudgetCapitalForm } from "./sections/BudgetCapitalForm";
import { FeasibilityForm } from "./sections/FeasibilityForm";
import { ExecutiveSummaryForm } from "./sections/ExecutiveSummaryForm";
import { SiteLocationForm } from "./sections/SiteLocationForm";
import { VisionMarketForm } from "./sections/VisionMarketForm";
import { ProjectTeamForm } from "./sections/ProjectTeamForm";
import { RiskAssessmentForm } from "./sections/RiskAssessmentForm";
import { ResilienceFactorsForm } from "./sections/ResilienceFactorsForm";
import { ProjectScheduleForm } from "./sections/ProjectScheduleForm";
import { PlaceholderSection } from "./sections/PlaceholderSection";
import { SectionIntroModal } from "./SectionIntroModal";

interface SectionData {
  section: Section;
  data: Record<string, any>;
  completed: boolean;
}

interface BuilderContentProps {
  activeSection: Section;
  sectionData: SectionData;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
  projectId: string;
}

const SECTION_TITLES: Record<Section, string> = {
  "project-scope": "Project Scope",
  "vision-market": "Vision & Market Case",
  "site-location": "Site & Location",
  "project-schedule": "Project Schedule",
  "budget-capital": "Budget & Sources/Uses",
  "project-team": "Project Team",
  "risk-assessment": "Risk Assessment",
  "resilience-factors": "Resilience Factors",
  "feasibility": "Feasibility Analysis",
  "executive-summary": "Executive Summary",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "project-scope": "Define the basic parameters of your development project.",
  "vision-market": "Articulate your project vision and market opportunity.",
  "site-location": "Document your property's physical, legal, and environmental characteristics.",
  "project-schedule": "Map out your development timeline and key milestones.",
  "budget-capital": "Outline your project costs and how you plan to fund them.",
  "project-team": "Identify your development team and their roles.",
  "risk-assessment": "Evaluate potential risks and mitigation strategies.",
  "resilience-factors": "Highlight factors that strengthen your project's viability.",
  "feasibility": "Analyze the financial viability and expected returns.",
  "executive-summary": "Review your auto-generated summary for lenders.",
};

const COMING_SOON_SECTIONS: Section[] = [];

export const BuilderContent = ({
  activeSection,
  sectionData,
  onSave,
  saving,
  projectId,
}: BuilderContentProps) => {
  const renderSectionForm = () => {
    if (COMING_SOON_SECTIONS.includes(activeSection)) {
      return (
        <PlaceholderSection
          title={SECTION_TITLES[activeSection]}
          description={SECTION_DESCRIPTIONS[activeSection]}
        />
      );
    }

    switch (activeSection) {
      case "project-scope":
        return <ProjectScopeForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "vision-market":
        return <VisionMarketForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "site-location":
        return <SiteLocationForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "project-schedule":
        return <ProjectScheduleForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "budget-capital":
        return <BudgetCapitalForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "project-team":
        return <ProjectTeamForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "risk-assessment":
        return <RiskAssessmentForm data={sectionData.data} onSave={onSave} saving={saving} projectId={projectId} />;
      case "resilience-factors":
        return <ResilienceFactorsForm data={sectionData.data} onSave={onSave} saving={saving} projectId={projectId} />;
      case "feasibility":
        return <FeasibilityForm data={sectionData.data} onSave={onSave} saving={saving} />;
      case "executive-summary":
        return <ExecutiveSummaryForm data={sectionData.data} onSave={onSave} saving={saving} />;
      default:
        return null;
    }
  };

  const isWideSection = [
    "budget-capital", "feasibility", "executive-summary", "site-location", "vision-market", "project-team",
    "risk-assessment", "resilience-factors", "project-schedule",
  ].includes(activeSection);

  const isEmpty = !sectionData?.data || Object.keys(sectionData.data).length === 0;

  return (
    <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <SectionIntroModal activeSection={activeSection} isEmpty={isEmpty} />
      <div className={isWideSection ? "max-w-5xl" : "max-w-2xl"}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {SECTION_TITLES[activeSection]}
          </h1>
          <p className="text-muted-foreground">
            {SECTION_DESCRIPTIONS[activeSection]}
          </p>
        </div>
        {renderSectionForm()}
      </div>
    </main>
  );
};
