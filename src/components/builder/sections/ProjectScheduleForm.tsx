import { useState, useEffect, useCallback } from "react";
import { format, addWeeks, differenceInWeeks, differenceInDays, parseISO, isValid } from "date-fns";
import { CalendarIcon, Plus, Trash2, Calendar, ClipboardList, BarChart3 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { ScheduleSummaryCard } from "./project-schedule/ScheduleSummaryCard";
import { GanttChart } from "./project-schedule/GanttChart";
import { MilestoneEducation } from "./project-schedule/MilestoneEducation";
import { cn } from "@/lib/utils";
import { useProjectType } from "@/hooks/useProjectType";

interface Milestone {
  id: string;
  name: string;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  status: string;
  dependsOn: string;
  notes: string;
  progress: number;
  complete?: boolean;
}

interface BaselineDates {
  [milestoneId: string]: { startDate: string; endDate: string };
}

interface ProjectScheduleFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

const NEW_CONSTRUCTION_MILESTONES: Milestone[] = [
  { id: "m1", name: "Pre-Development", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "", notes: "Due diligence, site assessment, design", progress: 0, complete: false },
  { id: "m2", name: "Permitting & Approvals", durationWeeks: 6, startDate: "", endDate: "", status: "Not Started", dependsOn: "m1", notes: "Building permits, zoning approvals", progress: 0, complete: false },
  { id: "m3", name: "Site Preparation", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m2", notes: "Clearing, grading, utilities stub-in", progress: 0, complete: false },
  { id: "m4", name: "Foundation & Structural", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m3", notes: "Foundation, framing, structural work, and roofing", progress: 0, complete: false },
  { id: "m5", name: "MEP (Mechanical, Electrical, Plumbing)", durationWeeks: 3, startDate: "", endDate: "", status: "Not Started", dependsOn: "m4", notes: "Plumbing, electrical, HVAC rough-in and finish", progress: 0, complete: false },
  { id: "m6", name: "Interior Finishes", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m5", notes: "Drywall, flooring, painting, fixtures", progress: 0, complete: false },
  { id: "m7", name: "Exterior & Landscaping", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m6", notes: "Exterior finishes (siding, brick facade) and landscaping.", progress: 0, complete: false },
  { id: "m8", name: "Inspections & Punch List", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m7", notes: "Final inspections and punch-list corrections.", progress: 0, complete: false },
  { id: "m9", name: "Marketing & Disposition", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m8", notes: "Listing, showing, closing or lease-up.", progress: 0, complete: false },
];

const REHAB_MILESTONES: Milestone[] = [
  { id: "m1", name: "Pre-Development", durationWeeks: 3, startDate: "", endDate: "", status: "Not Started", dependsOn: "", notes: "Due diligence, inspections, scope finalization", progress: 0, complete: false },
  { id: "m2", name: "Permitting & Approvals", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m1", notes: "Building permits for renovation work", progress: 0, complete: false },
  { id: "m3", name: "Demolition & Selective Demo", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m2", notes: "Removal of finishes, fixtures, and partitions to be replaced", progress: 0, complete: false },
  { id: "m4", name: "Structural Repairs", durationWeeks: 3, startDate: "", endDate: "", status: "Not Started", dependsOn: "m3", notes: "Foundation repairs, framing fixes, roof repairs", progress: 0, complete: false },
  { id: "m5", name: "MEP (Mechanical, Electrical, Plumbing)", durationWeeks: 3, startDate: "", endDate: "", status: "Not Started", dependsOn: "m4", notes: "Plumbing, electrical, HVAC updates", progress: 0, complete: false },
  { id: "m6", name: "Interior Finishes", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m5", notes: "Drywall, flooring, painting, fixtures, cabinets", progress: 0, complete: false },
  { id: "m7", name: "Exterior & Landscaping", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m6", notes: "Exterior repairs/paint and landscaping refresh", progress: 0, complete: false },
  { id: "m8", name: "Inspections & Punch List", durationWeeks: 2, startDate: "", endDate: "", status: "Not Started", dependsOn: "m7", notes: "Final inspections and punch-list corrections.", progress: 0, complete: false },
  { id: "m9", name: "Marketing & Disposition", durationWeeks: 4, startDate: "", endDate: "", status: "Not Started", dependsOn: "m8", notes: "Listing, showing, closing or lease-up.", progress: 0, complete: false },
];

const getDefaultMilestones = (projectType: string | null): Milestone[] => {
  if (projectType && projectType !== "new-construction") {
    // Normalize legacy values to current ones
    const normalized =
      projectType === "gut-renovation" || projectType === "light-renovation"
        ? "renovation-rehab"
        : projectType;
    // Renovation/Rehab and Acquisition+Rehab both use the rehab template
    return REHAB_MILESTONES.map((m) => ({ ...m }));
  }
  return NEW_CONSTRUCTION_MILESTONES.map((m) => ({ ...m }));
};

const DEFAULT_MILESTONES = NEW_CONSTRUCTION_MILESTONES;

const MILESTONE_STATUSES = ["Not Started", "In Progress", "Complete", "Delayed"];

export const ProjectScheduleForm = ({ data, onSave, saving }: ProjectScheduleFormProps) => {
  const projectType = useProjectType();
  const [startDate, setStartDate] = useState<Date | undefined>(
    data.startDate ? parseISO(data.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    data.endDate ? parseISO(data.endDate) : undefined
  );
  const [milestones, setMilestones] = useState<Milestone[]>(
    data.milestones?.length
      ? data.milestones.map((m: any) => ({ ...m, progress: m.progress ?? 0, complete: m.complete ?? (m.status === "Complete") }))
      : getDefaultMilestones(null)
  );
  const [endDateManual, setEndDateManual] = useState<boolean>(!!data.endDateManual);
  const [baselineDates, setBaselineDates] = useState<BaselineDates>(
    data.baselineDates || {}
  );
  const [keyDates, setKeyDates] = useState({
    loanClosing: data.keyDates?.loanClosing || "",
    constructionStart: data.keyDates?.constructionStart || "",
    certificateOfOccupancy: data.keyDates?.certificateOfOccupancy || "",
    firstLeaseSale: data.keyDates?.firstLeaseSale || "",
    loanMaturity: data.keyDates?.loanMaturity || "",
    notes: data.keyDates?.notes || "",
  });

  // Initial cascade — only runs once to seed dates from project start if milestones lack dates
  const recalculateDates = useCallback((projectStart: Date | undefined, currentMilestones: Milestone[]) => {
    if (!projectStart) return currentMilestones;

    const updated = [...currentMilestones];
    for (let i = 0; i < updated.length; i++) {
      const m = updated[i];
      let mStart: Date;

      if (m.dependsOn) {
        const dep = updated.find(x => x.id === m.dependsOn);
        if (dep && dep.endDate) {
          mStart = parseISO(dep.endDate);
        } else {
          mStart = projectStart;
        }
      } else if (i === 0) {
        mStart = projectStart;
      } else {
        const prev = updated[i - 1];
        mStart = prev.endDate ? parseISO(prev.endDate) : projectStart;
      }

      const mEnd = addWeeks(mStart, m.durationWeeks);
      updated[i] = {
        ...m,
        startDate: format(mStart, "yyyy-MM-dd"),
        endDate: format(mEnd, "yyyy-MM-dd"),
      };
    }
    return updated;
  }, []);

  // Seed milestone dates only when the project start date is first set (or milestones are empty of dates)
  useEffect(() => {
    if (startDate && milestones.every(m => !m.startDate)) {
      const updated = recalculateDates(startDate, milestones);
      setMilestones(updated);
      const last = updated[updated.length - 1];
      if (last?.endDate && !endDateManual) {
        setEndDate(parseISO(last.endDate));
      }
      if (Object.keys(baselineDates).length === 0) {
        const bl: BaselineDates = {};
        updated.forEach(m => {
          if (m.startDate && m.endDate) {
            bl[m.id] = { startDate: m.startDate, endDate: m.endDate };
          }
        });
        setBaselineDates(bl);
      }
    }
  }, [startDate]);

  // Keep end date in sync with last milestone unless the user has set it manually
  useEffect(() => {
    if (endDateManual) return;
    const last = milestones[milestones.length - 1];
    if (last?.endDate) {
      const d = parseISO(last.endDate);
      if (isValid(d) && (!endDate || format(d, "yyyy-MM-dd") !== format(endDate, "yyyy-MM-dd"))) {
        setEndDate(d);
      }
    }
  }, [milestones, endDateManual]);

  // Swap default milestones when projectType becomes known, but only if the user
  // hasn't customized them. We detect "untouched defaults" by name-match.
  const isUntouchedDefaults = useCallback((current: Milestone[]) => {
    const names = current.map((m) => m.name).join("|");
    const nc = NEW_CONSTRUCTION_MILESTONES.map((m) => m.name).join("|");
    const rh = REHAB_MILESTONES.map((m) => m.name).join("|");
    if (names !== nc && names !== rh) return false;
    return current.every((m) => !m.startDate);
  }, []);

  useEffect(() => {
    if (!projectType) return;
    if (data.milestones?.length) return;
    setMilestones((current) => {
      if (!isUntouchedDefaults(current)) return current;
      return getDefaultMilestones(projectType);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectType]);

  const getFormData = useCallback(() => ({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    endDateManual,
    milestones,
    baselineDates,
    keyDates,
  }), [startDate, endDate, endDateManual, milestones, baselineDates, keyDates]);

  const { saveStatus, lastSaved } = useAutoSave(
    getFormData(),
    (formData) => onSave(formData, false),
    3000,
  );

  const totalDurationWeeks = startDate && endDate ? differenceInWeeks(endDate, startDate) : 0;
  const totalMonths = Math.round(totalDurationWeeks / 4.33);
  const daysUntilCompletion = endDate ? differenceInDays(endDate, new Date()) : 0;

  // Cascade end-date changes forward: any milestone whose `dependsOn` equals the
  // just-updated milestone gets its startDate pushed to the new endDate, its endDate
  // recomputed from existing durationWeeks, and cascades through its own dependents.
  const cascadeFromIndex = (list: Milestone[], startIdx: number): Milestone[] => {
    const out = list.map((m) => ({ ...m }));
    const queue: number[] = [startIdx];
    const seen = new Set<number>();
    let guard = 0;
    while (queue.length && guard++ < 500) {
      const i = queue.shift()!;
      if (seen.has(i)) continue;
      seen.add(i);
      const parent = out[i];
      if (!parent?.endDate) {
        console.log("[cascade] parent has no endDate, skipping", parent?.id);
        continue;
      }
      console.log(`[cascade] parent=${parent.id} endDate=${parent.endDate} — searching dependents`);
      for (let j = 0; j < out.length; j++) {
        if (j === i) continue;
        if (out[j].dependsOn === parent.id) {
          const child = out[j];
          const newStart = parseISO(parent.endDate);
          if (!isValid(newStart)) {
            console.warn("[cascade] invalid parent endDate", parent.endDate);
            continue;
          }
          const weeks = Math.max(1, Number(child.durationWeeks) || 1);
          const newEnd = addWeeks(newStart, weeks);
          const before = { start: child.startDate, end: child.endDate };
          out[j] = {
            ...child,
            startDate: format(newStart, "yyyy-MM-dd"),
            endDate: format(newEnd, "yyyy-MM-dd"),
          };
          console.log(
            `[cascade]   → child=${child.id} (${child.name}) dependsOn=${child.dependsOn} : ${before.start}→${before.end}  becomes  ${out[j].startDate}→${out[j].endDate}`
          );
          queue.push(j);
        }
      }
    }
    return out;
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    let updated = milestones.map((m) => ({ ...m }));
    updated[index] = { ...updated[index], [field]: value };
    const m = updated[index];
    let shouldCascade = false;

    console.log(`[updateMilestone] id=${m.id} name=${m.name} field=${field} value=${value}`);

    // durationWeeks change: recompute end from existing start + new duration → cascade
    if (field === "durationWeeks" && m.startDate) {
      const weeks = Number(value) || 0;
      if (weeks > 0) {
        const newEnd = addWeeks(parseISO(m.startDate), weeks);
        updated[index].endDate = format(newEnd, "yyyy-MM-dd");
        console.log(`[updateMilestone] duration→ new endDate=${updated[index].endDate} (from start ${m.startDate} + ${weeks}w)`);
        shouldCascade = true;
      }
    } else if (field === "startDate" && value) {
      // startDate change: preserve durationWeeks, recompute end → cascade
      const start = parseISO(value);
      const weeks = Math.max(1, m.durationWeeks || 1);
      if (isValid(start)) {
        const newEnd = addWeeks(start, weeks);
        updated[index].endDate = format(newEnd, "yyyy-MM-dd");
        console.log(`[updateMilestone] startDate→ new endDate=${updated[index].endDate}`);
        shouldCascade = true;
      }
    } else if (field === "endDate" && value && m.startDate) {
      // Manual end-date override: recompute duration + cascade forward from new endDate.
      const start = parseISO(m.startDate);
      const end = parseISO(value);
      if (isValid(start) && isValid(end)) {
        const weeks = differenceInWeeks(end, start);
        updated[index].durationWeeks = weeks < 1 ? 1 : weeks;
        console.log(`[updateMilestone] endDate override→ duration=${updated[index].durationWeeks}w, cascading`);
        shouldCascade = true;
      }
    }

    // Keep status in sync with complete checkbox
    if (field === "complete") {
      updated[index].status = value ? "Complete" : (updated[index].status === "Complete" ? "In Progress" : updated[index].status);
      updated[index].progress = value ? 100 : updated[index].progress;
    }

    if (shouldCascade) {
      console.log(`[updateMilestone] triggering cascade from index ${index} (${m.id})`);
      updated = cascadeFromIndex(updated, index);
    }

    setMilestones(updated);
  };

  const addMilestone = () => {
    const newId = `m${Date.now()}`;
    const lastMilestone = milestones[milestones.length - 1];
    const newMilestone: Milestone = {
      id: newId,
      name: "",
      durationWeeks: 2,
      startDate: lastMilestone?.endDate || "",
      endDate: "",
      status: "Not Started",
      dependsOn: lastMilestone?.id || "",
      notes: "",
      progress: 0,
      complete: false,
    };

    if (newMilestone.startDate) {
      const e = addWeeks(parseISO(newMilestone.startDate), newMilestone.durationWeeks);
      newMilestone.endDate = format(e, "yyyy-MM-dd");
    }

    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    const removed = milestones[index];
    let updated = milestones.filter((_, i) => i !== index);
    updated = updated.map(m => m.dependsOn === removed.id ? { ...m, dependsOn: "" } : m);
    setMilestones(updated);
  };

  const handleResetBaseline = () => {
    const bl: BaselineDates = {};
    milestones.forEach(m => {
      if (m.startDate && m.endDate) {
        bl[m.id] = { startDate: m.startDate, endDate: m.endDate };
      }
    });
    setBaselineDates(bl);
  };

  const handleSave = (markComplete: boolean) => {
    onSave(getFormData(), markComplete);
  };

  const DatePicker = ({
    value,
    onChange,
    label,
    displayFormat = "PPP",
  }: {
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
    label: string;
    displayFormat?: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-2",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {value ? format(value, displayFormat) : <span>{label}</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={value}
          defaultMonth={value || undefined}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />

        <Accordion type="multiple" defaultValue={["milestones", "key-dates"]} className="space-y-4">
          {/* ACCORDION 1: PROJECT MILESTONES */}
          <AccordionItem value="milestones" className="bg-white rounded-xl border border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Project Milestones</span>
                  <span className="block text-xs text-muted-foreground">{milestones.length} milestones</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {/* Project dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="min-w-0">
                  <Label className="text-sm font-medium">Project Start Date</Label>
                  <div className="mt-1.5">
                    <DatePicker value={startDate} onChange={setStartDate} label="Select start date" />
                  </div>
                </div>
                <div className="min-w-0">
                  <Label className="text-sm font-medium">Estimated Completion</Label>
                  <div className="mt-1.5">
                    <DatePicker
                      value={endDate}
                      onChange={(d) => {
                        setEndDate(d);
                        setEndDateManual(!!d);
                      }}
                      label="Select completion date"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {endDateManual
                      ? "Manually set. Clear to auto-calculate from last milestone."
                      : "Auto-calculated from last milestone. Override anytime."}
                    {endDateManual && (
                      <button
                        type="button"
                        className="ml-2 text-primary hover:underline"
                        onClick={() => {
                          setEndDateManual(false);
                          const last = milestones[milestones.length - 1];
                          if (last?.endDate) setEndDate(parseISO(last.endDate));
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {totalDurationWeeks > 0 && (
                <div className="bg-muted/30 rounded-lg p-3 mb-6 text-sm text-muted-foreground">
                  Total Project Duration: <span className="font-semibold text-foreground">{totalDurationWeeks} weeks ({totalMonths} months)</span>
                </div>
              )}

              {/* Milestone list */}
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Milestone {index + 1}
                      </span>
                      {milestones.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)} className="text-destructive hover:text-destructive h-6 w-6 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1">
                      <div className="col-span-2 sm:col-span-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, "name", e.target.value)}
                          placeholder="Milestone name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration (weeks)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={milestone.durationWeeks}
                          onChange={(e) => updateMilestone(index, "durationWeeks", parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <MilestoneEducation milestoneName={milestone.name} />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="min-w-0">
                        <Label className="text-xs">Start Date</Label>
                        <div className="mt-1">
                          <DatePicker
                            value={milestone.startDate ? parseISO(milestone.startDate) : undefined}
                            onChange={(d) => updateMilestone(index, "startDate", d ? format(d, "yyyy-MM-dd") : "")}
                            label="Pick start"
                            displayFormat="MMM d, yyyy"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-xs">End Date</Label>
                        <div className="mt-1">
                          <DatePicker
                            value={milestone.endDate ? parseISO(milestone.endDate) : undefined}
                            onChange={(d) => updateMilestone(index, "endDate", d ? format(d, "yyyy-MM-dd") : "")}
                            label="Pick end"
                            displayFormat="MMM d, yyyy"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-xs">Status</Label>
                        <Select value={milestone.status} onValueChange={(v) => updateMilestone(index, "status", v)}>
                          <SelectTrigger className="mt-1 text-xs h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MILESTONE_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-xs">Complete</Label>
                        <div className="mt-1 flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
                          <Checkbox
                            id={`complete-${milestone.id}`}
                            checked={!!milestone.complete}
                            onCheckedChange={(checked) => updateMilestone(index, "complete", !!checked)}
                          />
                          <label htmlFor={`complete-${milestone.id}`} className="text-xs text-muted-foreground cursor-pointer truncate">
                            {milestone.complete ? "Done" : "Mark done"}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Depends On</Label>
                        <Select value={milestone.dependsOn} onValueChange={(v) => updateMilestone(index, "dependsOn", v === "none" ? "" : v)}>
                          <SelectTrigger className="mt-1 text-xs h-9">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {milestones.filter(m => m.id !== milestone.id).map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name || "Unnamed"}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Input
                          value={milestone.notes}
                          onChange={(e) => updateMilestone(index, "notes", e.target.value)}
                          placeholder="Optional notes"
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addMilestone} className="mt-4 w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Milestone
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* GANTT CHART — Full-width standalone card, always visible */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 my-4" style={{ minHeight: "500px" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gantt Chart</h3>
              <p className="text-xs text-muted-foreground">Visual timeline with baseline comparison</p>
            </div>
          </div>
          {startDate && milestones.some(m => m.startDate) ? (
            <GanttChart
              milestones={milestones}
              projectStart={startDate}
              projectEnd={endDate}
              baselineDates={baselineDates}
              onResetBaseline={handleResetBaseline}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Set a project start date above to generate the Gantt chart.
            </div>
          )}
        </div>

        <Accordion type="multiple" defaultValue={["key-dates"]} className="space-y-4">
          {/* ACCORDION 3: KEY DATES */}
          <AccordionItem value="key-dates" className="bg-white rounded-xl border border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">Key Dates & Deadlines</span>
                  <span className="block text-xs text-muted-foreground">Important target dates</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "loanClosing", label: "Loan Closing Target" },
                  { key: "constructionStart", label: "Construction Start Target" },
                  { key: "certificateOfOccupancy", label: "Certificate of Occupancy Target" },
                  { key: "firstLeaseSale", label: "First Lease/Sale Target" },
                  { key: "loanMaturity", label: "Loan Maturity Date" },
                ].map(({ key, label }) => (
                  <div key={key} className="min-w-0">
                    <Label className="text-sm font-medium">{label}</Label>
                    <div className="mt-1.5">
                      <DatePicker
                        value={keyDates[key as keyof typeof keyDates] ? parseISO(keyDates[key as keyof typeof keyDates] as string) : undefined}
                        onChange={(d) => setKeyDates(prev => ({ ...prev, [key]: d ? format(d, "yyyy-MM-dd") : "" }))}
                        label={`Select ${label.toLowerCase()}`}
                        displayFormat="MMM d, yyyy"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium">Timeline Constraints & Notes</Label>
                <Textarea
                  value={keyDates.notes}
                  onChange={(e) => setKeyDates(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any external deadlines, seasonal considerations, or dependencies"
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="px-6">
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="btn-accent px-6 transition-all duration-300">
            {saving ? "Saving..." : "Save & Continue →"}
          </Button>
        </div>
      </div>

      {/* Right side summary */}
      <div className="w-full xl:w-[280px] flex-shrink-0">
        <ScheduleSummaryCard
          milestones={milestones}
          startDate={startDate}
          endDate={endDate}
          totalDurationWeeks={totalDurationWeeks}
          daysUntilCompletion={daysUntilCompletion}
        />
      </div>
    </div>
  );
};
