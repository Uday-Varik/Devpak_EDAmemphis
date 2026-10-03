// Canonical project type values and legacy mapping.
// Old values "gut-renovation" and "light-renovation" map to "renovation-rehab".
export const PROJECT_TYPE_OPTIONS = [
  { value: "new-construction", label: "New Construction" },
  { value: "renovation-rehab", label: "Renovation/Rehab" },
  { value: "acquisition-rehab", label: "Acquisition + Rehab" },
] as const;

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  "new-construction": "New Construction",
  "renovation-rehab": "Renovation/Rehab",
  "acquisition-rehab": "Acquisition + Rehab",
  // legacy
  "gut-renovation": "Renovation/Rehab",
  "light-renovation": "Renovation/Rehab",
};

// Normalize legacy stored values to the current canonical value.
export const normalizeProjectType = (v: string | null | undefined): string => {
  if (!v) return "";
  if (v === "gut-renovation" || v === "light-renovation") return "renovation-rehab";
  return v;
};

// True for any rehab/renovation-style project (new or legacy values).
export const isRenovationType = (v: string | null | undefined): boolean => {
  const n = normalizeProjectType(v);
  return n === "renovation-rehab" || n === "acquisition-rehab";
};

// Property type legacy normalization — "mixed-use" no longer supported.
export const normalizePropertyType = (v: string | null | undefined): string => {
  if (!v) return "";
  if (v === "mixed-use") return "single-family";
  return v;
};
