import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaleNarrativeNoticeProps {
  stale: boolean;
  onRegenerate: () => void;
  actionLabel?: string;
  message?: string;
}

export const StaleNarrativeNotice = ({
  stale,
  onRegenerate,
  actionLabel = "Regenerate",
  message = "Figures have changed since this was written.",
}: StaleNarrativeNoticeProps) => {
  if (!stale) return null;
  return (
    <div className="flex items-start gap-2 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
      <p className="flex-1 text-xs text-amber-800">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        className="h-7 flex-shrink-0 gap-1.5 text-xs"
      >
        <RefreshCw className="h-3 w-3" />
        {actionLabel}
      </Button>
    </div>
  );
};
