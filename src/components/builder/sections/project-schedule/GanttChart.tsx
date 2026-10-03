import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { format, parseISO, differenceInDays, isAfter, isBefore, addMonths, startOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  progress: number;
  complete?: boolean;
}

interface BaselineDates {
  [milestoneId: string]: { startDate: string; endDate: string };
}

interface GanttChartProps {
  milestones: Milestone[];
  projectStart: Date;
  projectEnd?: Date;
  baselineDates: BaselineDates;
  onResetBaseline: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; badgeClass: string }> = {
  "Not Started": { color: "#cbd5e1", bg: "bg-slate-300", label: "Not Started", badgeClass: "bg-slate-200 text-slate-700 border-slate-300" },
  "In Progress": { color: "#2E86AB", bg: "bg-secondary", label: "In Progress", badgeClass: "bg-blue-100 text-blue-800 border-blue-300" },
  "Complete": { color: "#27AE60", bg: "bg-success", label: "Complete", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  "Delayed": { color: "#E74C3C", bg: "bg-destructive", label: "Delayed", badgeClass: "bg-red-100 text-red-800 border-red-300" },
};

type ViewMode = "timeline" | "summary";

export const GanttChart = ({ milestones, projectStart, projectEnd, baselineDates, onResetBaseline }: GanttChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [showBaseline, setShowBaseline] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ milestone: Milestone; x: number; y: number } | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isLg, setIsLg] = useState(true);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>();
  const timelineRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const validMilestones = milestones.filter(m => m.startDate && m.endDate);

  const hasBaseline = Object.keys(baselineDates).length > 0;

  const { totalDays, monthColumns, chartStart, weekCount } = useMemo(() => {
    if (validMilestones.length === 0) return { totalDays: 0, monthColumns: [], chartStart: new Date(), weekCount: 0 };

    const allStarts = validMilestones.map(m => parseISO(m.startDate));
    const allEnds = validMilestones.map(m => parseISO(m.endDate));

    // Include baseline dates in range calculation
    if (hasBaseline) {
      Object.values(baselineDates).forEach(b => {
        if (b.startDate) allStarts.push(parseISO(b.startDate));
        if (b.endDate) allEnds.push(parseISO(b.endDate));
      });
    }

    const earliest = allStarts.reduce((a, b) => (isBefore(a, b) ? a : b));
    const latest = allEnds.reduce((a, b) => (isAfter(a, b) ? a : b));
    const days = differenceInDays(latest, earliest) || 1;

    // Generate month columns
    const cols: { label: string; startPx: number; widthPx: number }[] = [];
    let current = startOfMonth(earliest);
    if (isBefore(current, earliest)) current = startOfMonth(earliest);

    const PX_PER_DAY = 4;
    while (isBefore(current, latest) || current.getTime() === latest.getTime()) {
      const next = addMonths(current, 1);
      const colStart = Math.max(differenceInDays(current, earliest), 0);
      const colEnd = Math.min(differenceInDays(next, earliest), days);
      cols.push({
        label: format(current, "MMM yyyy"),
        startPx: colStart * PX_PER_DAY,
        widthPx: (colEnd - colStart) * PX_PER_DAY,
      });
      current = next;
    }

    return { totalDays: days, monthColumns: cols, chartStart: earliest, weekCount: Math.ceil(days / 7) };
  }, [validMilestones, baselineDates, hasBaseline]);

  const PX_PER_DAY = 4;
  const totalWidth = totalDays * PX_PER_DAY;
  const ROW_HEIGHT = 44;
  const BAR_HEIGHT = 28;

  // Sync scroll between panels
  const handleTimelineScroll = useCallback(() => {
    if (timelineRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  }, []);

  const handleLeftScroll = useCallback(() => {
    if (leftPanelRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  }, []);

  const handleBarHover = (milestone: Milestone, e: React.MouseEvent) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      setTooltipData({ milestone, x: e.clientX, y: e.clientY });
    }, 200);
  };

  const handleBarLeave = () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltipData(null);
  };

  if (validMilestones.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">No milestones with dates to display.</div>;
  }

  const todayOffset = differenceInDays(new Date(), chartStart);
  const todayPx = todayOffset * PX_PER_DAY;
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  // Week grid lines
  const weekLines: number[] = [];
  for (let w = 1; w <= weekCount; w++) {
    const px = w * 7 * PX_PER_DAY;
    if (px <= totalWidth) weekLines.push(px);
  }

  // === MILESTONE SUMMARY TABLE VIEW ===
  if (viewMode === "summary") {
    const overallVariance = validMilestones.reduce((sum, m) => {
      const baseline = baselineDates[m.id];
      if (!baseline) return sum;
      const actualEnd = parseISO(m.endDate);
      const baselineEnd = parseISO(baseline.endDate);
      return sum + differenceInDays(actualEnd, baselineEnd);
    }, 0);

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode("timeline")}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              Timeline View
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-white shadow-sm text-foreground"
            >
              Milestone Summary
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1B4F72] hover:bg-[#1B4F72]">
                <TableHead className="text-white font-semibold text-xs">Milestone</TableHead>
                <TableHead className="text-white font-semibold text-xs">Planned Start</TableHead>
                <TableHead className="text-white font-semibold text-xs">Planned End</TableHead>
                <TableHead className="text-white font-semibold text-xs">Actual Start</TableHead>
                <TableHead className="text-white font-semibold text-xs">Actual End</TableHead>
                <TableHead className="text-white font-semibold text-xs text-center">Variance</TableHead>
                <TableHead className="text-white font-semibold text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validMilestones.map((m, i) => {
                const baseline = baselineDates[m.id];
                const variance = baseline
                  ? differenceInDays(parseISO(m.endDate), parseISO(baseline.endDate))
                  : 0;
                const config = STATUS_CONFIG[m.status] || STATUS_CONFIG["Not Started"];

                return (
                  <TableRow key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
                    <TableCell className="font-medium text-sm">{m.name || "Unnamed"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {baseline ? format(parseISO(baseline.startDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {baseline ? format(parseISO(baseline.endDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{format(parseISO(m.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-xs">{format(parseISO(m.endDate), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-center">
                      {baseline ? (
                        <span className={`text-xs font-semibold ${variance > 0 ? "text-destructive" : variance < 0 ? "text-success" : "text-muted-foreground"}`}>
                          {variance > 0 ? `+${variance}d` : variance < 0 ? `${variance}d` : "On time"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                        {config.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {hasBaseline && (
            <div className={`px-4 py-3 border-t border-border text-sm font-semibold ${overallVariance > 0 ? "text-destructive bg-red-50/50" : overallVariance < 0 ? "text-success bg-emerald-50/50" : "text-muted-foreground bg-muted/30"}`}>
              Overall: {overallVariance > 0 ? `${overallVariance} days behind schedule` : overallVariance < 0 ? `${Math.abs(overallVariance)} days ahead of schedule` : "On schedule"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === TIMELINE VIEW ===
  return (
    <div>
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode("timeline")}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-white shadow-sm text-foreground"
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            Milestone Summary
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasBaseline && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-baseline"
                checked={showBaseline}
                onCheckedChange={setShowBaseline}
                className="data-[state=checked]:bg-secondary"
              />
              <Label htmlFor="show-baseline" className="text-xs text-muted-foreground cursor-pointer">
                Show Baseline
              </Label>
            </div>
          )}
          {hasBaseline && (
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5">
                  <RotateCcw className="w-3 h-3" />
                  Reset Baseline
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset schedule baseline?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The baseline is the original schedule your current dates are compared against. Resetting replaces it with today's dates, so any recorded delays will no longer show. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setResetDialogOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onResetBaseline();
                      setResetDialogOpen(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Baseline
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Split-panel Gantt */}
      <div className="border border-border rounded-xl overflow-x-auto" style={{ minHeight: "500px" }}>
        <div className="flex min-w-[640px]">
          {/* LEFT PANEL — sticky labels */}
          <div
            className="flex-shrink-0 border-r border-border bg-white z-10 sticky left-0 w-[120px] lg:w-[280px]"
          >
            {/* Left header */}
            <div className="h-10 border-b border-border flex items-center px-3 lg:px-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Milestone</span>
            </div>
            {/* Left rows */}
            <div
              ref={leftPanelRef}
              onScroll={handleLeftScroll}
              className="overflow-y-auto"
              style={{ maxHeight: "calc(100% - 40px)" }}
            >
              {validMilestones.map((m, i) => {
                const config = STATUS_CONFIG[m.status] || STATUS_CONFIG["Not Started"];
                const isHovered = hoveredRow === m.id;
                return (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredRow(m.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="flex items-start px-2 lg:px-4 py-1.5 border-b border-border/40 transition-colors duration-150"
                    style={{
                      minHeight: `${ROW_HEIGHT}px`,
                      backgroundColor: isHovered
                        ? "rgba(46, 134, 171, 0.05)"
                        : i % 2 === 1
                        ? "#FAFBFC"
                        : "white",
                    }}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className={`text-xs lg:text-sm font-medium text-foreground leading-snug ${isLg ? "line-clamp-2" : "truncate"}`}>
                        {m.name || "Unnamed"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground">{m.durationWeeks}w</p>
                        <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL — scrollable timeline */}
          <div
            ref={timelineRef}
            onScroll={handleTimelineScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative"
          >
            <div style={{ width: `${Math.max(totalWidth, 600)}px`, minHeight: `${validMilestones.length * ROW_HEIGHT + 40}px` }}>
              {/* Month headers */}
              <div className="h-10 border-b border-border flex items-end sticky top-0 bg-white z-10">
                {monthColumns.map((col, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-l border-border/30 px-2 pb-2 flex-shrink-0"
                    style={{ width: `${col.widthPx}px`, marginLeft: i === 0 ? `${col.startPx}px` : 0 }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Grid lines + bars */}
              <div className="relative">
                {/* Month grid lines */}
                {monthColumns.map((col, i) => (
                  <div
                    key={`mg-${i}`}
                    className="absolute top-0 bottom-0"
                    style={{ left: `${col.startPx}px`, width: "1px", backgroundColor: "rgba(0,0,0,0.1)" }}
                  />
                ))}

                {/* Week grid lines */}
                {weekLines.map((px, i) => (
                  <div
                    key={`wg-${i}`}
                    className="absolute top-0 bottom-0"
                    style={{ left: `${px}px`, width: "1px", borderLeft: "1px dashed rgba(0,0,0,0.05)" }}
                  />
                ))}

                {/* Today marker */}
                {showToday && (
                  <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${todayPx}px` }}>
                    <div className="absolute inset-y-0 w-0 border-l-2 border-dashed border-destructive" />
                    <span className="absolute -top-1 -translate-x-1/2 text-[9px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded-full shadow-sm">
                      Today
                    </span>
                  </div>
                )}

                {/* Milestone bars */}
                {validMilestones.map((m, i) => {
                  const mStart = parseISO(m.startDate);
                  const mEnd = parseISO(m.endDate);
                  const startPx = differenceInDays(mStart, chartStart) * PX_PER_DAY;
                  const widthPx = Math.max(differenceInDays(mEnd, mStart) * PX_PER_DAY, 8);
                  const isComplete = !!m.complete || m.status === "Complete";
                  const effectiveStatus = isComplete ? "Complete" : (m.status === "Complete" ? "In Progress" : m.status);
                  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG["Not Started"];
                  const isHovered = hoveredRow === m.id;

                  const baseline = baselineDates[m.id];
                  const hasBaselineDiff = baseline && showBaseline && hasBaseline &&
                    (baseline.startDate !== m.startDate || baseline.endDate !== m.endDate);
                  let baselineStartPx = 0;
                  let baselineWidthPx = 0;
                  if (hasBaselineDiff && baseline) {
                    baselineStartPx = differenceInDays(parseISO(baseline.startDate), chartStart) * PX_PER_DAY;
                    baselineWidthPx = Math.max(differenceInDays(parseISO(baseline.endDate), parseISO(baseline.startDate)) * PX_PER_DAY, 8);
                  }

                  const barTop = (ROW_HEIGHT - BAR_HEIGHT) / 2;
                  const showNameOnBar = widthPx > 100;

                  return (
                    <div
                      key={m.id}
                      className="relative border-b border-border/20 transition-colors duration-150"
                      style={{
                        height: `${ROW_HEIGHT}px`,
                        backgroundColor: isHovered
                          ? "rgba(46, 134, 171, 0.05)"
                          : i % 2 === 1
                          ? "#FAFBFC"
                          : "transparent",
                      }}
                      onMouseEnter={() => setHoveredRow(m.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Baseline ghost bar */}
                      {hasBaselineDiff && (
                        <div
                          className="absolute rounded"
                          style={{
                            left: `${baselineStartPx}px`,
                            width: `${baselineWidthPx}px`,
                            top: `${barTop + BAR_HEIGHT + 2}px`,
                            height: "6px",
                            backgroundColor: "rgba(0,0,0,0.12)",
                          }}
                        />
                      )}

                      {/* Actual bar */}
                      <div
                        className="absolute rounded-md cursor-pointer transition-all duration-150 overflow-hidden"
                        style={{
                          left: `${startPx}px`,
                          width: `${widthPx}px`,
                          top: `${barTop}px`,
                          height: `${BAR_HEIGHT}px`,
                          backgroundColor: config.color,
                          transform: isHovered ? "translateY(-1px)" : "none",
                          boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                        }}
                        onMouseEnter={(e) => handleBarHover(m, e)}
                        onMouseMove={(e) => {
                          if (tooltipData?.milestone.id === m.id) {
                            setTooltipData({ milestone: m, x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={handleBarLeave}
                      >
                        {/* Bar content */}
                        <div className="relative z-10 flex items-center h-full px-2 gap-1.5">
                          {showNameOnBar && (
                            <span className="text-[11px] font-medium text-white truncate leading-none">
                              {m.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 lg:hidden">
        Scroll sideways to see the full timeline.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/50">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 rounded-sm" style={{ backgroundColor: config.color }} />
            <span className="text-[10px] text-muted-foreground font-medium">{status}</span>
          </div>
        ))}
        {hasBaseline && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
            <div className="w-3.5 h-1.5 rounded-sm" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />
            <span className="text-[10px] text-muted-foreground font-medium">Baseline</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-border p-3 pointer-events-none"
          style={{
            left: `${tooltipData.x + 12}px`,
            top: `${tooltipData.y - 10}px`,
            maxWidth: "280px",
          }}
        >
          <p className="font-semibold text-sm text-foreground">{tooltipData.milestone.name || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(parseISO(tooltipData.milestone.startDate), "MMM d, yyyy")} — {format(parseISO(tooltipData.milestone.endDate), "MMM d, yyyy")}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span>{tooltipData.milestone.durationWeeks} weeks</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${(STATUS_CONFIG[tooltipData.milestone.status] || STATUS_CONFIG["Not Started"]).badgeClass}`}>
              {tooltipData.milestone.status}
            </span>
          </div>
          {(tooltipData.milestone.complete || tooltipData.milestone.status === "Complete") && (
            <p className="text-xs mt-1 text-success font-medium">✓ Complete</p>
          )}
          {tooltipData.milestone.notes && (
            <p className="text-xs mt-2 text-muted-foreground border-t border-border pt-2">{tooltipData.milestone.notes}</p>
          )}
          {hasBaseline && baselineDates[tooltipData.milestone.id] && (
            (() => {
              const bl = baselineDates[tooltipData.milestone.id];
              if (bl.startDate === tooltipData.milestone.startDate && bl.endDate === tooltipData.milestone.endDate) return null;
              const variance = differenceInDays(parseISO(tooltipData.milestone.endDate), parseISO(bl.endDate));
              return (
                <div className="text-xs mt-2 border-t border-border pt-2 text-muted-foreground">
                  <p>Baseline: {format(parseISO(bl.startDate), "MMM d")} — {format(parseISO(bl.endDate), "MMM d")}</p>
                  <p className={`font-semibold ${variance > 0 ? "text-destructive" : "text-success"}`}>
                    {variance > 0 ? `+${variance} days slippage` : `${Math.abs(variance)} days ahead`}
                  </p>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
