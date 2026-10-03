import { Loader2, Check } from "lucide-react";

interface AutoSaveIndicatorProps {
  saveStatus: "idle" | "saving" | "saved";
  lastSaved: Date | null;
}

export const AutoSaveIndicator = ({ saveStatus, lastSaved }: AutoSaveIndicatorProps) => {
  if (saveStatus === "saving") {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    );
  }

  if (saveStatus === "saved" && lastSaved) {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-green-500" />
        Saved at{" "}
        {lastSaved.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
    );
  }

  // For forms that had a manual lastSaved before auto-save
  if (lastSaved) {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-green-500" />
        Saved at{" "}
        {lastSaved.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
    );
  }

  return null;
};
