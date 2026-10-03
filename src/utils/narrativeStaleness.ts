// Fingerprints the figures a generated narrative is based on, so we can tell
// when saved text has drifted from the live numbers.

const round = (n: unknown) =>
  typeof n === "number" && isFinite(n) ? Math.round(n * 10) / 10 : 0;

export const buildFingerprint = (values: Record<string, unknown>): string =>
  Object.keys(values)
    .sort()
    .map((k) => {
      const v = values[k];
      return `${k}:${typeof v === "number" ? round(v) : String(v ?? "").trim().toLowerCase()}`;
    })
    .join("|");

/**
 * Text is stale when it exists but its stored fingerprint is missing
 * (written before staleness tracking) or no longer matches the live figures.
 */
export const isNarrativeStale = (
  text: string | undefined | null,
  storedFingerprint: string | undefined | null,
  currentFingerprint: string
): boolean => {
  if (!text || !text.trim()) return false;
  if (!currentFingerprint) return false;
  if (!storedFingerprint) return true;
  return storedFingerprint !== currentFingerprint;
};

/** Sections of the package counted for completion (Executive Summary excluded). */
export const PACKAGE_SECTIONS: { key: string; label: string }[] = [
  { key: "project-scope", label: "Project Scope" },
  { key: "vision-market", label: "Vision & Market Case" },
  { key: "site-location", label: "Site & Location" },
  { key: "project-schedule", label: "Project Schedule" },
  { key: "budget-capital", label: "Budget & Sources/Uses" },
  { key: "project-team", label: "Project Team" },
  { key: "risk-assessment", label: "Risk Assessment" },
  { key: "resilience-factors", label: "Resilience Factors" },
  { key: "feasibility", label: "Feasibility Analysis" },
];

export const countCompletedSections = (
  sectionsCompleted: Record<string, boolean> | undefined | null
): number =>
  PACKAGE_SECTIONS.filter((s) => !!sectionsCompleted?.[s.key]).length;
