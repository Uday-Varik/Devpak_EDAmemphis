import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads `projectType` from the project-scope section of the current project.
 * Returns null until loaded. Refetches when the projectId changes.
 */
export function useProjectType(): string | null {
  const { id: projectId } = useParams<{ id: string }>();
  const [projectType, setProjectType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchType = async () => {
      if (!projectId) return;
      const { data: details } = await supabase
        .from("project_details")
        .select("data")
        .eq("project_id", projectId)
        .eq("section", "project-scope")
        .maybeSingle();
      if (cancelled) return;
      if (details?.data) {
        const d = details.data as Record<string, any>;
        setProjectType(d.projectType || null);
      }
    };
    fetchType();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return projectType;
}
