const MAX_BASE_LENGTH = 80;

/** Turns a project name into a safe, short base name for downloaded files. */
export const exportFileBase = (name: string | null | undefined): string => {
  const cleaned = (name || "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  let base = cleaned.slice(0, MAX_BASE_LENGTH);
  // Cut at a word boundary when the name is longer than the limit.
  if (cleaned.length > MAX_BASE_LENGTH) {
    const lastWordEnd = base.lastIndexOf("_");
    if (lastWordEnd >= MAX_BASE_LENGTH / 2) base = base.slice(0, lastWordEnd);
  }
  base = base.replace(/_+$/, "");
  return base || "DevPack";
};

/** Shortens a long label for display, adding an ellipsis when it is cut. */
export const truncateLabel = (label: string | null | undefined, max = 60): string => {
  const text = label ?? "";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};
