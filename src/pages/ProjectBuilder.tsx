import type { Json } from "@/integrations/supabase/types";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BuilderSidebar, BuilderSidebarContent } from "@/components/builder/BuilderSidebar";
import { BuilderContent } from "@/components/builder/BuilderContent";
import { TeachingPanel } from "@/components/builder/TeachingPanel";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTeachingMode } from "@/hooks/useTeachingMode";
import { countCompletedSections, PACKAGE_SECTIONS } from "@/utils/narrativeStaleness";
import { isPageUnloading, keepaliveSectionSave } from "@/utils/unloadSave";
import { trackEvent } from "@/lib/analytics";

export type Section =
  | "project-scope"
  | "vision-market"
  | "site-location"
  | "project-schedule"
  | "budget-capital"
  | "project-team"
  | "risk-assessment"
  | "resilience-factors"
  | "feasibility"
  | "executive-summary";

interface Project {
  id: string;
  name: string;
  address: string | null;
  progress: number;
}

interface SectionData {
  section: Section;
  data: Record<string, unknown>;
  completed: boolean;
}

const SECTIONS: Section[] = [
  "project-scope",
  "vision-market",
  "site-location",
  "project-schedule",
  "budget-capital",
  "project-team",
  "risk-assessment",
  "resilience-factors",
  "feasibility",
  "executive-summary",
];

const DEFAULT_SECTION_DATA: Record<Section, SectionData> = Object.fromEntries(
  SECTIONS.map((s) => [s, { section: s, data: {}, completed: false }])
) as Record<Section, SectionData>;

const ProjectBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [sectionData, setSectionData] = useState<Record<Section, SectionData>>({
    ...DEFAULT_SECTION_DATA,
  });
  const [activeSection, setActiveSection] = useState<Section>("project-scope");
  const [showTeachingPanel, setShowTeachingPanel] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enabled: teachingEnabled } = useTeachingMode();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Listen for cross-section navigation events
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent).detail as Section;
      if (SECTIONS.includes(section)) {
        setActiveSection(section);
      }
    };
    window.addEventListener("navigate-section", handler);
    return () => window.removeEventListener("navigate-section", handler);
  }, []);

  // Persist active section per project so users return to where they left off.
  useEffect(() => {
    if (id) localStorage.setItem(`devpack:lastSection:${id}`, activeSection);
  }, [activeSection, id]);

  const fetchProjectData = useCallback(async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name, address, progress")
        .eq("id", id)
        .single();

      if (projectError || !projectData) {
        console.error("Error fetching project:", projectError);
        toast.error("We couldn't open that project. It may have been deleted or you may not have access.");
        navigate("/dashboard");
        return;
      }

      setProject(projectData);

      const { data: detailsData } = await supabase
        .from("project_details")
        .select("section, data, completed")
        .eq("project_id", id);

      if (detailsData) {
        const newSectionData = { ...DEFAULT_SECTION_DATA };
        detailsData.forEach((detail) => {
          const section = detail.section as Section;
          if (SECTIONS.includes(section)) {
            newSectionData[section] = {
              section,
              data: detail.data as Record<string, unknown>,
              completed: detail.completed,
            };
          }
        });
        setSectionData(newSectionData);

        // Prefer last visited section from localStorage, else first incomplete
        const savedSection = localStorage.getItem(`devpack:lastSection:${id}`) as Section | null;
        if (savedSection && SECTIONS.includes(savedSection)) {
          setActiveSection(savedSection);
        } else {
          const firstIncomplete = SECTIONS.find((s) => !newSectionData[s].completed);
          if (firstIncomplete) setActiveSection(firstIncomplete);
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("We couldn't open that project. Please try again.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchProjectData();
    }
  }, [user, id, fetchProjectData]);

  const handleSaveSection = async (data: Record<string, unknown>, markComplete: boolean = false) => {
    if (!id) return;

    // Tab is closing: send the final save with keepalive so the browser finishes it.
    // Runs synchronously, before the first await, so the request starts before unload.
    if (isPageUnloading() && session) {
      const completedMap = Object.fromEntries(
        SECTIONS.map((s) => [s, s === activeSection ? markComplete : sectionData[s].completed])
      ) as Record<string, boolean>;
      const progress = Math.round((countCompletedSections(completedMap) / PACKAGE_SECTIONS.length) * 100);
      if (keepaliveSectionSave(session.access_token, id, activeSection, data, markComplete, progress)) return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("project_details")
        .upsert(
          {
            project_id: id,
            section: activeSection,
            data: data as Json,
            completed: markComplete,
          },
          { onConflict: "project_id,section" }
        );

      if (error) throw error;
      trackEvent("section_saved", { section: activeSection, completed: markComplete });

      setSectionData((prev) => ({
        ...prev,
        [activeSection]: { section: activeSection, data, completed: markComplete },
      }));

      const completedMap = Object.fromEntries(
        SECTIONS.map((s) => [s, s === activeSection ? markComplete : sectionData[s].completed])
      ) as Record<string, boolean>;
      const completedCount = countCompletedSections(completedMap);
      const progress = Math.round((completedCount / PACKAGE_SECTIONS.length) * 100);

      await supabase.from("projects").update({ progress }).eq("id", id);
      setProject((prev) => (prev ? { ...prev, progress } : null));

      if (markComplete) {
        const currentIndex = SECTIONS.indexOf(activeSection);
        if (currentIndex < SECTIONS.length - 1) {
          setActiveSection(SECTIONS[currentIndex + 1]);
        }
      }
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Couldn't save this section. Your latest changes may not be stored. Try again.");
      // Rethrow so useAutoSave marks the indicator as failed and callers don't advance.
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Same list and denominator as the Executive Summary panels (Executive Summary excluded).
  const overallProgress = Math.round(
    (countCompletedSections(
      Object.fromEntries(SECTIONS.map((s) => [s, sectionData[s].completed])) as Record<string, boolean>
    ) /
      PACKAGE_SECTIONS.length) *
      100
  );

  // Sections that have their own right-side dashboard instead of teaching panel
  const hasDashboardPanel = activeSection === "executive-summary";
  // Sections that support teaching panel
  const hasTeachingContent = [
    "project-scope",
    "vision-market",
    "budget-capital",
    "feasibility",
    "site-location",
    "project-team",
    "risk-assessment",
    "resilience-factors",
    "project-schedule",
  ].includes(activeSection);

  return (
    <div className="min-h-screen bg-background flex">
      <BuilderSidebar
        projectName={project.name}
        activeSection={activeSection}
        sectionData={sectionData}
        onSectionChange={setActiveSection}
      />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw]">
          <SheetTitle className="sr-only">Project sections</SheetTitle>
          <SheetDescription className="sr-only">Choose a section of the development package to work on.</SheetDescription>
          <BuilderSidebarContent
            projectName={project.name}
            activeSection={activeSection}
            sectionData={sectionData}
            onSectionChange={(s) => {
              setActiveSection(s);
              setMobileNavOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col lg:ml-[280px]">
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 md:px-6 lg:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-2 flex-shrink-0"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open section menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <span className="text-sm font-medium text-foreground truncate">Package Completion</span>
            </div>
            <span className="text-sm font-bold text-primary flex-shrink-0">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="flex-1 flex flex-col xl:flex-row min-w-0">
          <BuilderContent
            activeSection={activeSection}
            sectionData={sectionData[activeSection]}
            onSave={handleSaveSection}
            saving={saving}
            projectId={id || ""}
          />

          {teachingEnabled && !hasDashboardPanel && hasTeachingContent && showTeachingPanel && (
            <TeachingPanel
              activeSection={activeSection}
              onClose={() => setShowTeachingPanel(false)}
            />
          )}

          {teachingEnabled && !hasDashboardPanel && hasTeachingContent && !showTeachingPanel && (
            <button
              onClick={() => setShowTeachingPanel(true)}
              className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-2 py-4 rounded-l-lg shadow-lg hover:bg-primary/90 transition-colors"
              title="Show Teaching Panel"
            >
              <span className="writing-vertical text-xs font-medium">Tips</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectBuilder;
