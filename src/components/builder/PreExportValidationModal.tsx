import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { runValidation, type ValidationFinding } from "@/utils/validatePackage";

interface PreExportValidationModalProps {
  open: boolean;
  projectId: string;
  exportLabel: string;
  onCancel: () => void;
  onProceed: () => void;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Critical" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Warning" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", label: "Info" },
};

export const PreExportValidationModal = ({ open, projectId, exportLabel, onCancel, onProceed }: PreExportValidationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<ValidationFinding[]>([]);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    runValidation(projectId)
      .then(setFindings)
      .catch(() => setFindings([]))
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const grouped = {
    critical: findings.filter((f) => f.severity === "critical"),
    warning: findings.filter((f) => f.severity === "warning"),
    info: findings.filter((f) => f.severity === "info"),
  };

  const hasIssues = findings.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pre-Export Review</DialogTitle>
          <DialogDescription>
            Review these findings before exporting. All issues are advisory — you can proceed regardless.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing package...
          </div>
        ) : !hasIssues ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
            <p className="font-semibold text-foreground">Your package looks good!</p>
            <p className="text-sm text-muted-foreground">No validation issues detected.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-5">
              {(["critical", "warning", "info"] as const).map((sev) => {
                const items = grouped[sev];
                if (!items.length) return null;
                const cfg = severityConfig[sev];
                const Icon = cfg.icon;
                return (
                  <div key={sev}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className="text-sm font-semibold text-foreground">
                        {cfg.label} ({items.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((f) => (
                        <div key={f.id} className={`p-3 rounded-lg border border-border ${cfg.bg}`}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-foreground flex-1">{f.message}</p>
                            <Badge variant="outline" className="shrink-0 text-xs">{f.section}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="btn-accent" onClick={onProceed} disabled={loading}>
            {hasIssues ? `Export Anyway — ${exportLabel}` : `Continue — ${exportLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
