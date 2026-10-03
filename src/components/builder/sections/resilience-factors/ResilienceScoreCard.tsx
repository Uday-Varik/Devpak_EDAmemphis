import { Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ResilienceScoreCardProps {
  scores: {
    financial: number;
    project: number;
    market: number;
    total: number;
  };
  totalFactors: number;
}

export const ResilienceScoreCard = ({ scores, totalFactors }: ResilienceScoreCardProps) => {
  const percentage = Math.round((scores.total / totalFactors) * 100);

  const overallColor =
    percentage >= 70 ? "text-green-600" : percentage >= 40 ? "text-amber-600" : "text-red-500";
  const overallLabel =
    percentage >= 70 ? "Strong" : percentage >= 40 ? "Moderate" : "Needs Attention";
  const overallBg =
    percentage >= 70 ? "bg-green-100" : percentage >= 40 ? "bg-amber-100" : "bg-red-100";

  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Resilience Score
        </h3>

        {/* Overall Score */}
        <div className="text-center mb-4 pb-4 border-b border-border">
          <div className={`text-4xl font-bold ${overallColor}`}>{percentage}%</div>
          <div className="text-sm text-muted-foreground mt-1">
            {scores.total} of {totalFactors} factors
          </div>
          <Progress value={percentage} className="h-2.5 mt-3" />
          <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${overallBg} ${overallColor}`}>
            {overallLabel}
          </span>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">By Category</div>

          {[
            { label: "Financial", score: scores.financial, max: 7 },
            { label: "Project", score: scores.project, max: 7 },
            { label: "Market", score: scores.market, max: 6 },
          ].map(({ label, score, max }) => {
            const pct = Math.round((score / max) * 100);
            const color = pct >= 70 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-500";
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>{score}/{max}</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
