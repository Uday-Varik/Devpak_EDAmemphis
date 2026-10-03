import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Milestone {
  id: string;
  name: string;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  status: string;
  complete?: boolean;
}

interface ScheduleSummaryCardProps {
  milestones: Milestone[];
  startDate?: Date;
  endDate?: Date;
  totalDurationWeeks: number;
  daysUntilCompletion: number;
}

export const ScheduleSummaryCard = ({
  milestones,
  startDate,
  endDate,
  totalDurationWeeks,
  daysUntilCompletion,
}: ScheduleSummaryCardProps) => {
  const totalMonths = Math.round(totalDurationWeeks / 4.33);
  const complete = milestones.filter(m => m.complete || m.status === "Complete").length;
  const inProgress = milestones.filter(m => !m.complete && m.status === "In Progress").length;
  const delayed = milestones.filter(m => !m.complete && m.status === "Delayed").length;
  const completionPercent = milestones.length > 0 ? Math.round((complete / milestones.length) * 100) : 0;

  return (
    <div className="sticky top-28 bg-white rounded-xl border border-border shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Schedule Summary
      </h3>

      {/* Duration */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Duration</span>
          <span className="font-semibold text-foreground">
            {totalDurationWeeks > 0 ? `${totalDurationWeeks} weeks (${totalMonths} mo)` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Start Date</span>
          <span className="font-medium text-foreground">
            {startDate ? format(startDate, "MMM d, yyyy") : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Target Completion</span>
          <span className="font-medium text-foreground">
            {endDate ? format(endDate, "MMM d, yyyy") : "—"}
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-primary">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="h-2" />
      </div>

      {/* Milestone breakdown */}
      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-xs font-medium text-foreground mb-2">Milestones ({milestones.length} total)</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
          <span className="text-foreground font-medium">{complete}</span>
          <span className="text-muted-foreground">Complete</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />
          <span className="text-foreground font-medium">{inProgress}</span>
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0" />
          <span className="text-foreground font-medium">{delayed}</span>
          <span className="text-muted-foreground">Delayed</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0" />
          <span className="text-foreground font-medium">{milestones.length - complete - inProgress - delayed}</span>
          <span className="text-muted-foreground">Not Started</span>
        </div>
      </div>

      {/* Countdown */}
      {daysUntilCompletion > 0 && (
        <div className="border-t border-border pt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Days Until Completion</span>
            </div>
            <span className="text-2xl font-bold text-primary">{daysUntilCompletion}</span>
          </div>
        </div>
      )}
    </div>
  );
};
