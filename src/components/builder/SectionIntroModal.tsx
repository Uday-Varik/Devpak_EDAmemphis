import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Section } from "@/pages/ProjectBuilder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb } from "lucide-react";
import { isTeachingModeEnabled } from "@/hooks/useTeachingMode";

const SECTION_INTROS: Record<Section, { title: string; body: string }> = {
  "project-scope": {
    title: "Project Scope",
    body: "Lenders evaluate your project scope to understand what you are building and whether it is realistic for the market. Take your time here — a clear scope makes every other section easier.",
  },
  "vision-market": {
    title: "Vision & Market Case",
    body: "This section helps you prove there is demand for your project. Strong market data and comparable sales give lenders confidence that your numbers are realistic.",
  },
  "site-location": {
    title: "Site & Location",
    body: "Property details, zoning, and site conditions directly affect your budget and timeline. Lenders want to see you understand the physical realities of your site.",
  },
  "project-schedule": {
    title: "Project Schedule",
    body: "A realistic timeline shows lenders you have thought through the construction process. Include buffer time for permits and inspections — Memphis permitting can take longer than expected.",
  },
  "budget-capital": {
    title: "Budget & Sources/Uses",
    body: "This is where deals get approved or denied. Lenders are not just checking your math, they are judging your understanding of the project. Every number should be intentional, supported, and realistic. A loose budget signals risk. A detailed budget builds confidence. Always include contingency, realistic timelines, and true soft costs, not just construction.",
  },
  "project-team": {
    title: "Project Team",
    body: "Lenders fund teams, not just deals. A strong team with relevant experience reduces perceived risk. Make sure your contractor is licensed and has local experience.",
  },
  "risk-assessment": {
    title: "Risk Assessment",
    body: "Every project has risks. Showing lenders you have identified them and have mitigation plans demonstrates experience and professionalism.",
  },
  "resilience-factors": {
    title: "Resilience Factors",
    body: "These are the built-in protections that make your deal stronger. The more boxes you can check here, the more confident lenders will be.",
  },
  feasibility: {
    title: "Feasibility Analysis",
    body: "This is where you as a developer need to understand if the numbers work BEFORE you present to a lender. A deal that does not pencil out should not be packaged.",
  },
  "executive-summary": {
    title: "Executive Summary",
    body: "This pulls everything together into a professional overview. Lenders read this first, so it needs to be compelling and accurate.",
  },
};

const DISMISS_KEY = "devpack:hideSectionIntros";
const SESSION_SEEN_KEY = "devpack:sessionSeenIntros";

const isDismissedGlobally = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
};

const getSessionSeen = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SESSION_SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const markSessionSeen = (section: Section) => {
  try {
    const seen = getSessionSeen();
    seen.add(section);
    sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
};

interface SectionIntroModalProps {
  activeSection: Section;
  isEmpty: boolean;
}

export const SectionIntroModal = ({ activeSection, isEmpty }: SectionIntroModalProps) => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { id: projectId } = useParams<{ id: string }>();
  const [projectType, setProjectType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) return;
      const { data: details } = await supabase
        .from("project_details")
        .select("data")
        .eq("project_id", projectId)
        .eq("section", "project-scope")
        .maybeSingle();
      if (!cancelled && details?.data) {
        setProjectType(((details.data as Record<string, any>).projectType) || null);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!isTeachingModeEnabled()) return;
    if (isDismissedGlobally()) return;
    const seen = getSessionSeen();
    if (seen.has(activeSection)) return;
    if (!isEmpty) {
      markSessionSeen(activeSection);
      return;
    }
    setOpen(true);
  }, [activeSection, isEmpty]);

  const handleClose = () => {
    markSessionSeen(activeSection);
    if (dontShowAgain) {
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const baseIntro = SECTION_INTROS[activeSection];
  if (!baseIntro) return null;

  // Adapt schedule body by project type (legacy gut/light-renovation map to renovation-rehab)
  let intro = baseIntro;
  if (activeSection === "project-schedule" && projectType) {
    const normalized =
      projectType === "gut-renovation" || projectType === "light-renovation"
        ? "renovation-rehab"
        : projectType;
    if (normalized === "new-construction") {
      intro = { ...baseIntro, body: baseIntro.body + " For new construction in Shelby County, plan on 6-9 months from groundbreaking to certificate of occupancy." };
    } else if (normalized === "renovation-rehab") {
      intro = { ...baseIntro, body: baseIntro.body + " A renovation in Memphis typically runs 3-6 months end to end. Gut-level scopes often surface hidden conditions (knob-and-tube wiring, rotted framing, lead paint) — budget extra time for demo discoveries." };
    } else if (normalized === "acquisition-rehab") {
      intro = { ...baseIntro, body: baseIntro.body + " For acquisition + rehab, 3-6 months is typical for light to moderate scope." };
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-[#F39C12]/15 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-[#F39C12]" />
            </div>
            <DialogTitle className="text-xl text-[#1B4F72]">{intro.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed text-foreground/80 pt-2">
            {intro.body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="dont-show-intros"
            checked={dontShowAgain}
            onCheckedChange={(v) => setDontShowAgain(v === true)}
          />
          <label
            htmlFor="dont-show-intros"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Don't show these tips again
          </label>
        </div>
        <DialogFooter>
          <Button
            onClick={handleClose}
            className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] hover:opacity-90 transition-all"
          >
            Got it, let's go
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
