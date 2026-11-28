/** Turns a project name into a safe, short base name for downloaded files. */
export const exportFileBase = (name: string | null | undefined): string => {
  const cleaned = (name || "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)
    .replace(/_+$/, "");
  return cleaned || "DevPack";
};

/** Shortens a long label for display, adding an ellipsis when it is cut. */
export const truncateLabel = (label: string | null | undefined, max = 60): string => {
  const text = label ?? "";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};
