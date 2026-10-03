import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface ScheduleSectionProps {
  schedule: Record<string, any>;
}

const formatDate = (d: string | undefined) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  complete: "Complete",
  delayed: "Delayed",
};

// Bar color based on status + complete flag
const getBarColor = (m: any): string => {
  if (m.complete === true || m.status === "complete" || m.status === "Complete") return colors.green;
  if (m.status === "delayed" || m.status === "Delayed") return colors.gold;
  if (m.status === "in-progress" || m.status === "In Progress") return colors.blue;
  return "#CBD5E1"; // light gray for not started
};

// Compute non-overlapping rows (lanes) so overlapping milestones stack vertically
const assignLanes = (items: { start: number; end: number; idx: number }[]): number[] => {
  const lanes: number[][] = []; // lane -> last end timestamp
  const result: number[] = new Array(items.length).fill(0);
  // Sort by start date, but keep original index
  const sorted = [...items].sort((a, b) => a.start - b.start);
  for (const item of sorted) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i][lanes[i].length - 1] <= item.start) {
        lanes[i].push(item.end);
        result[item.idx] = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([item.end]);
      result[item.idx] = lanes.length - 1;
    }
  }
  return result;
};

interface GanttPDFChartProps {
  milestones: any[];
}

const GanttPDFChart = ({ milestones }: GanttPDFChartProps) => {
  const valid = milestones.filter(m => m.startDate && m.endDate);
  if (valid.length === 0) return null;

  const parsed = valid.map(m => ({
    ...m,
    _start: new Date(m.startDate).getTime(),
    _end: new Date(m.endDate).getTime(),
  }));

  const minTime = Math.min(...parsed.map(m => m._start));
  const maxTime = Math.max(...parsed.map(m => m._end));
  const totalMs = maxTime - minTime || 1;

  // Layout constants — page content width ~495 (Letter 612 - 50*2 margins)
  const CHART_WIDTH = 495;
  const LABEL_WIDTH = 130;
  const DATE_WIDTH = 95;
  const TIMELINE_WIDTH = CHART_WIDTH - LABEL_WIDTH - DATE_WIDTH; // ~270
  const ROW_HEIGHT = 18;
  const BAR_HEIGHT = 10;
  const AXIS_HEIGHT = 16;

  // Lanes for overlap stacking
  const lanes = assignLanes(
    parsed.map((m, idx) => ({ start: m._start, end: m._end, idx }))
  );

  // Group milestones by lane so each lane is its own row of bars; but per spec,
  // we keep each milestone on its own row (label on left). Lanes only matter
  // if user wants lane stacking. Spec says "stack vertically" => each milestone
  // already gets its own row. Use lanes only to confirm independent rows.
  // We render one row per milestone.

  // Month axis
  const monthLabels: { label: string; leftPct: number }[] = [];
  const startDate = new Date(minTime);
  const endDate = new Date(maxTime);
  let cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (cur.getTime() <= endDate.getTime()) {
    const offset = cur.getTime() - minTime;
    const pct = Math.max(0, (offset / totalMs) * 100);
    monthLabels.push({
      label: cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      leftPct: pct,
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  return (
    <View style={{ marginBottom: 16, marginTop: 8 }}>
      {/* Axis row */}
      <View style={{ flexDirection: "row", height: AXIS_HEIGHT, marginBottom: 4 }}>
        <View style={{ width: LABEL_WIDTH }} />
        <View style={{ width: TIMELINE_WIDTH, position: "relative", borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          {monthLabels.map((m, i) => (
            <Text
              key={i}
              style={{
                position: "absolute",
                left: `${m.leftPct}%`,
                top: 0,
                fontSize: 6.5,
                color: colors.muted,
              }}
            >
              {m.label}
            </Text>
          ))}
        </View>
        <View style={{ width: DATE_WIDTH }} />
      </View>

      {/* Milestone rows */}
      {parsed.map((m, i) => {
        const startOffset = ((m._start - minTime) / totalMs) * TIMELINE_WIDTH;
        const widthPx = Math.max(2, ((m._end - m._start) / totalMs) * TIMELINE_WIDTH);
        const barColor = getBarColor(m);
        const dateRange = `${new Date(m._start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(m._end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              height: ROW_HEIGHT,
              alignItems: "center",
              backgroundColor: i % 2 === 1 ? colors.tableAlt : undefined,
            }}
          >
            <View style={{ width: LABEL_WIDTH, paddingRight: 6 }}>
              <Text style={{ fontSize: 7.5, color: colors.body, fontFamily: "Helvetica-Bold" }}>
                {m.name || "—"}
              </Text>
            </View>
            <View style={{ width: TIMELINE_WIDTH, height: ROW_HEIGHT, position: "relative" }}>
              <View
                style={{
                  position: "absolute",
                  left: startOffset,
                  top: (ROW_HEIGHT - BAR_HEIGHT) / 2,
                  width: widthPx,
                  height: BAR_HEIGHT,
                  backgroundColor: barColor,
                  borderRadius: 2,
                }}
              />
            </View>
            <View style={{ width: DATE_WIDTH, paddingLeft: 6 }}>
              <Text style={{ fontSize: 6.5, color: colors.muted }}>{dateRange}</Text>
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View style={{ flexDirection: "row", marginTop: 8, gap: 12, paddingLeft: LABEL_WIDTH }}>
        {[
          { label: "Complete", color: colors.green },
          { label: "In Progress", color: colors.blue },
          { label: "Not Started", color: "#CBD5E1" },
          { label: "Delayed", color: colors.gold },
        ].map((l, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 8, height: 8, backgroundColor: l.color, borderRadius: 1, marginRight: 4 }} />
            <Text style={{ fontSize: 7, color: colors.muted }}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const ScheduleSection = ({ schedule }: ScheduleSectionProps) => {
  const milestones: any[] = schedule.milestones || [];
  const totalWeeks = schedule.totalDurationWeeks || milestones.reduce((s: number, m: any) => s + (m.durationWeeks || m.duration || 0), 0);
  const months = Math.round(totalWeeks / 4.33);

  return (
    <View>
      <Text style={styles.sectionTitle}>Project Schedule</Text>

      {/* Duration Summary */}
      <View style={[styles.metricGrid, { marginBottom: 16 }]}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Total Duration</Text>
          <Text style={styles.metricValue}>{totalWeeks} wks ({months} mo)</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Start Date</Text>
          <Text style={styles.metricValue}>{formatDate(schedule.startDate || schedule.projectStartDate)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Completion</Text>
          <Text style={styles.metricValue}>{formatDate(schedule.endDate || schedule.projectEndDate)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Milestones</Text>
          <Text style={styles.metricValue}>{milestones.length}</Text>
        </View>
      </View>

      {/* Visual Gantt Chart */}
      {milestones.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Schedule Timeline</Text>
          <GanttPDFChart milestones={milestones} />
        </View>
      )}

      {/* Milestone Table */}
      {milestones.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Milestone Summary</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Milestone</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Start</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>End</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "right" }]}>Weeks</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: "right" }]}>Status</Text>
            </View>
            {milestones.map((m: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>{m.name || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatDate(m.startDate)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatDate(m.endDate)}</Text>
                <Text style={[styles.tableCell, { flex: 0.6, textAlign: "right" }]}>{m.durationWeeks || m.duration || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 0.8, textAlign: "right" }]}>
                  {STATUS_LABELS[m.status] || m.status || "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Key Dates */}
      {(() => {
        const kd = schedule.keyDates || {};
        const keyDateRows = [
          { label: "Loan Closing", value: kd.loanClosing || schedule.loanClosingDate },
          { label: "Construction Start", value: kd.constructionStart || schedule.constructionStartDate },
          { label: "Certificate of Occupancy", value: kd.coTarget || schedule.coTargetDate },
          { label: "First Lease/Sale", value: kd.firstLeaseSale || schedule.firstLeaseSaleDate },
          { label: "Loan Maturity", value: kd.loanMaturity || schedule.loanMaturityDate },
        ].filter(r => r.value);
        return keyDateRows.length > 0 ? (
          <View>
            <Text style={styles.subTitle}>Key Dates & Deadlines</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Milestone</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Target Date</Text>
              </View>
              {keyDateRows.map((row, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
                  <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{formatDate(row.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null;
      })()}

      {/* Notes */}
      {(schedule.keyDates?.notes || schedule.timelineNotes) && (
        <View>
          <Text style={styles.subTitle}>Timeline Notes</Text>
          <Text style={styles.bodyText}>{schedule.keyDates?.notes || schedule.timelineNotes}</Text>
        </View>
      )}
    </View>
  );
};
