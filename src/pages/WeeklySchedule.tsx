import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Dumbbell, Pencil, ChevronDown, Trophy, Plus } from "lucide-react";
import { storage, type GymSchedule, type TrackerRecord, type TrackerItem } from "@/lib/storage";
import { useSchedule, useUserPrefs, useTrackers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const DAYS: { key: keyof GymSchedule; short: string; full: string }[] = [
  { key: "mon", short: "Mon", full: "Monday" },
  { key: "tue", short: "Tue", full: "Tuesday" },
  { key: "wed", short: "Wed", full: "Wednesday" },
  { key: "thu", short: "Thu", full: "Thursday" },
  { key: "fri", short: "Fri", full: "Friday" },
  { key: "sat", short: "Sat", full: "Saturday" },
  { key: "sun", short: "Sun", full: "Sunday" },
];

const TODAY_KEY = format(new Date(), "EEE").toLowerCase() as keyof GymSchedule;
const REST_WORDS = ["rest", "off", "recovery", "deload"];
const isRest = (s: string) => REST_WORDS.some(r => s.toLowerCase().includes(r));

const PRESET_COLORS = [
  "#6366f1", "#22d3ee", "#10b981", "#f97316", "#818cf8",
  "#ec4899", "#f59e0b", "#14b8a6", "#8b5cf6", "#ef4444",
  "#06b6d4", "#84cc16",
];

function getCategoryColor(cat: string, allCategories: string[]): string {
  const idx = allCategories.indexOf(cat);
  return PRESET_COLORS[idx % PRESET_COLORS.length];
}

function estimate1RM(weight: number, reps: number) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function getPR(records: TrackerRecord[]) {
  if (!records.length) return null;
  return records.reduce((best, r) =>
    estimate1RM(r.value1 || 0, r.value2 || 0) > estimate1RM(best.value1 || 0, best.value2 || 0) ? r : best
  , records[0]);
}

export default function WeeklySchedule() {
  const schedule = useSchedule();
  const trackers = useTrackers();
  const userPrefs = useUserPrefs();
  const unit = userPrefs?.weightUnit ?? "kg";

  const gymTracker = trackers.find(t => t.id === "gym");
  const categories = gymTracker ? gymTracker.categories.map(c => c.name) : [];
  const lifts = gymTracker ? gymTracker.categories.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name }))) : [];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GymSchedule>(schedule);
  const [selectedDay, setSelectedDay] = useState<keyof GymSchedule | null>(null);

  // Log modal state
  const [logLiftId, setLogLiftId] = useState<string | null>(null);
  const [logWeight, setLogWeight] = useState("");
  const [logReps, setLogReps] = useState("5");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const save = () => { storage.setSchedule(draft); setEditing(false); toast.success("Schedule saved"); };
  const cancel = () => { setDraft({ ...schedule }); setEditing(false); };
  const trainingDays = DAYS.filter(d => !isRest(schedule[d.key].label)).length;

  const handleDayTap = (key: keyof GymSchedule) => {
    if (editing) return;
    setSelectedDay(prev => prev === key ? null : key);
  };

  const toggleDraftCategory = (dayKey: keyof GymSchedule, cat: string) => {
    setDraft(d => {
      const day = d[dayKey];
      const cats = day.categories.includes(cat)
        ? day.categories.filter(c => c !== cat)
        : [...day.categories, cat];
      return { ...d, [dayKey]: { ...day, categories: cats } };
    });
  };

  const handleLog = () => {
    const w = parseFloat(logWeight);
    const r = parseInt(logReps);
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0 || !logLiftId || !gymTracker) return;
    const today = format(new Date(), "yyyy-MM-dd");
    
    const newRec: TrackerRecord = { id: crypto.randomUUID(), date: logDate, value1: w, value2: r };

    const update = trackers.map(t => {
      if (t.id === "gym") {
        return {
          ...t,
          categories: t.categories.map(c => ({
            ...c,
            items: c.items.map(i => {
              if (i.id === logLiftId) {
                const existing = i.records.findIndex(rec => rec.date === logDate);
                const records = existing >= 0
                  ? i.records.map((rec, idx) => idx === existing ? { ...rec, value1: w, value2: r } : rec)
                  : [...i.records, newRec];
                return { ...i, records };
              }
              return i;
            })
          }))
        };
      }
      return t;
    });

    storage.setTrackers(update);
    toast.success("Logged");
    setLogLiftId(null); setLogWeight(""); setLogReps("5"); setLogDate(today);
  };

  const logLift = lifts.find(l => l.id === logLiftId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>Weekly training plan</p>
        </div>
        {!editing ? (
          <Button onClick={() => { setDraft({ ...schedule }); setEditing(true); setSelectedDay(null); }} size="sm"
            variant="outline" className="gap-2 border-[#222] text-[#888] hover:bg-white/[0.04] hover:text-white">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={cancel} size="sm" variant="outline" className="border-[#222] text-[#666] hover:bg-white/[0.04]">Cancel</Button>
            <Button onClick={save} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="flex gap-4">
        {[
          { label: "Training days", value: trainingDays },
          { label: "Rest days", value: 7 - trainingDays },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 rounded-xl" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#444" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Hint */}
      {!editing && (
        <p className="text-[11px]" style={{ color: "#333" }}>Tap a day to see its exercises and log a session</p>
      )}

      {/* Day list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1d1d1d" }}>
        {DAYS.map((day, i) => {
          const isToday = day.key === TODAY_KEY;
          const dayData = editing ? draft[day.key] : schedule[day.key];
          const label = dayData.label;
          const dayCats = dayData.categories;
          const rest = isRest(label);
          const isSelected = selectedDay === day.key;
          const dayLifts = lifts.filter(l => dayCats.includes(l.categoryName));

          return (
            <motion.div key={day.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ borderTop: i > 0 ? "1px solid #1a1a1a" : "none" }}>
              {/* Day row */}
              <div
                onClick={() => handleDayTap(day.key)}
                className="flex items-center gap-4 px-4 py-4 transition-colors"
                style={{
                  background: isSelected ? "#161616" : isToday ? "#161616" : "#111",
                  cursor: editing ? "default" : "pointer",
                }}>
                {/* Day label */}
                <div className="w-12 shrink-0">
                  <p className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: isToday ? "#fff" : "#555" }}>{day.short}</p>
                  {isToday && <p className="text-[9px] font-semibold mt-0.5 text-primary">TODAY</p>}
                </div>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: rest ? "#161616" : isToday || isSelected ? "#6366f115" : "#6366f10d" }}>
                  <Dumbbell className="w-3.5 h-3.5"
                    style={{ color: rest ? "#2a2a2a" : isToday || isSelected ? "#818cf8" : "#6366f180" }} />
                </div>

                {/* Label or input */}
                {editing ? (
                  <Input value={draft[day.key].label}
                    onChange={e => setDraft(d => ({ ...d, [day.key]: { ...d[day.key], label: e.target.value } }))}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 h-9 border-[#222] text-white text-sm"
                    style={{ background: "#161616" }} />
                ) : (
                  <p className="flex-1 text-sm font-medium"
                    style={{ color: rest ? "#333" : isToday ? "#e2e8f0" : "#888" }}>
                    {label}
                  </p>
                )}

                {/* Category pills */}
                {!editing && !rest && dayCats.length > 0 && (
                  <div className="flex gap-1 shrink-0">
                    {dayCats.map(cat => (
                      <div key={cat} className="w-1.5 h-1.5 rounded-full" style={{ background: getCategoryColor(cat, categories) }} />
                    ))}
                  </div>
                )}

                {/* Expand chevron */}
                {!editing && !rest && (
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: "#333", transform: isSelected ? "rotate(180deg)" : "rotate(0deg)" }} />
                )}
              </div>

              {/* Category selector (edit mode) */}
              {editing && (
                <div className="px-4 pb-3 pt-0" style={{ background: "#111" }}>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => {
                      const color = getCategoryColor(cat, categories);
                      const active = draft[day.key].categories.includes(cat);
                      return (
                        <button key={cat} onClick={() => toggleDraftCategory(day.key, cat)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                          style={{
                            background: active ? color + "20" : "#161616",
                            border: `1px solid ${active ? color + "50" : "#222"}`,
                            color: active ? color : "#444",
                          }}>{cat}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expanded lift panel */}
              <AnimatePresence>
                {isSelected && !rest && !editing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden" style={{ borderTop: "1px solid #1a1a1a", background: "#0e0e0e" }}>
                    <div className="px-4 py-4 space-y-3">
                      {/* Category group header */}
                      <div className="flex items-center gap-2">
                        {dayCats.map(cat => (
                          <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: getCategoryColor(cat, categories) + "15", color: getCategoryColor(cat, categories) }}>
                            {cat}
                          </span>
                        ))}
                        <span className="text-[10px] ml-auto" style={{ color: "#333" }}>
                          {dayLifts.length} exercise{dayLifts.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {dayLifts.length > 0 ? (
                        <div className="space-y-1">
                          {dayLifts.map(lift => {
                            const pr = getPR(lift.records);
                            const color = getCategoryColor(lift.categoryName, categories);
                            return (
                              <div key={lift.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{ background: "#111" }}>
                                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color + "40" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white">{lift.name}</p>
                                  {pr ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Trophy className="w-2.5 h-2.5 shrink-0" style={{ color }} />
                                      <span className="text-[11px]" style={{ color: "#555" }}>
                                        {pr.value1}{unit} × {pr.value2}
                                        <span className="ml-1.5" style={{ color: "#333" }}>
                                          ~{estimate1RM(pr.value1 || 0, pr.value2 || 0)}{unit}
                                        </span>
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] mt-0.5" style={{ color: "#333" }}>No records yet</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => { setLogLiftId(lift.id); setLogDate(format(new Date(), "yyyy-MM-dd")); }}
                                  className="px-3 h-7 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
                                  style={{ background: color + "15", color }}>
                                  <Plus className="w-3 h-3 inline mr-1" />Log
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[12px] py-2" style={{ color: "#2a2a2a" }}>
                          {dayCats.length === 0
                            ? "No categories assigned — tap Edit to add some"
                            : "No matching exercises — add some in Trackers"}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Quick-log dialog */}
      <Dialog open={!!logLiftId} onOpenChange={o => !o && setLogLiftId(null)}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">{logLift?.name ?? "Log session"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "#888" }}>Weight ({unit})</Label>
                <Input type="number" step="0.5" placeholder="80" value={logWeight}
                  onChange={e => setLogWeight(e.target.value)}
                  className="h-11 border-[#222] text-white" style={{ background: "#161616" }} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "#888" }}>Reps</Label>
                <Input type="number" placeholder="5" value={logReps}
                  onChange={e => setLogReps(e.target.value)}
                  className="h-11 border-[#222] text-white" style={{ background: "#161616" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Date</Label>
              <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                className="h-11 border-[#222] text-white" style={{ background: "#161616" }} />
            </div>
            {logWeight && logReps && (
              <div className="py-2 px-3 rounded-xl text-center" style={{ background: "#161616" }}>
                <p className="text-[11px]" style={{ color: "#555" }}>Estimated 1RM</p>
                <p className="text-lg font-bold text-white">
                  {estimate1RM(parseFloat(logWeight) || 0, parseInt(logReps) || 1)} {unit}
                </p>
              </div>
            )}
            <Button onClick={handleLog} disabled={!logWeight || !logReps}
              className="w-full bg-primary hover:bg-primary/90 font-semibold">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
