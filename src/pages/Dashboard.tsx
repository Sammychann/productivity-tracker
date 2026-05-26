import { useState, useCallback } from "react";
import { format, subDays, addDays } from "date-fns";
import { motion } from "framer-motion";
import { Droplets, Flame, Beef, Moon, Dumbbell, TrendingUp, TrendingDown, Plus, Code2, Trophy, Zap, ChevronLeft, ChevronRight, BookOpen, Activity, LayoutGrid } from "lucide-react";
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { RingProgress } from "@/components/RingProgress";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { storage, type DailyLog } from "@/lib/storage";
import { useHealthTargets, useDailyLog, useSchedule, useWeightLogs, useGoals, useStore, useTrackers } from "@/hooks/use-storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";

const TODAY = format(new Date(), "yyyy-MM-dd");

const WEEKDAY_KEY: Record<string, keyof import("@/lib/storage").GymSchedule> = {
  Sunday: "sun", Monday: "mon", Tuesday: "tue", Wednesday: "wed",
  Thursday: "thu", Friday: "fri", Saturday: "sat",
};

function useIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

function QuickLogModal({
  open, onClose, field, current, target, label, unit, color, dateStr
}: {
  open: boolean; onClose: () => void;
  field: keyof Pick<DailyLog, "water" | "calories" | "protein" | "sleep">;
  current: number; target: number; label: string; unit: string; color: string;
  dateStr: string;
}) {
  const [val, setVal] = useState(String(current));
  const isMobile = useIsMobile();
  const step = field === "water" ? 1 : field === "sleep" ? 0.5 : 10;

  const save = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) {
      storage.updateDailyLog(dateStr, { [field]: n } as Partial<DailyLog>);
      toast.success(`${label} updated`);
      onClose();
    }
  };

  const content = (
    <div className="space-y-5 py-2">
      <div className="flex justify-between text-sm py-3 px-4 rounded-xl" style={{ background: "#181818" }}>
        <span style={{ color: "#555" }}>Target</span>
        <span className="font-semibold" style={{ color }}>{target} {unit}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setVal(v => String(Math.max(0, parseFloat(v || "0") - step)))}
          className="w-11 h-11 rounded-xl text-lg font-bold transition-colors"
          style={{ background: "#1a1a1a", color: "#fff" }}>−</button>
        <Input type="number" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          className="text-center text-2xl font-bold border-0 text-white"
          style={{ background: "#1a1a1a" }} autoFocus />
        <button onClick={() => setVal(v => String(parseFloat(v || "0") + step))}
          className="w-11 h-11 rounded-xl text-lg font-bold transition-colors"
          style={{ background: "#1a1a1a", color: "#fff" }}>+</button>
      </div>
      <p className="text-center text-xs" style={{ color: "#555" }}>{unit}</p>
      <Button onClick={save} className="w-full font-semibold" style={{ background: color, border: "none" }}>
        Save
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={o => !o && onClose()}>
        <DrawerContent style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DrawerHeader><DrawerTitle className="text-white">{label}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-8">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent style={{ background: "#111", borderColor: "#1d1d1d" }}>
        <DialogHeader><DialogTitle className="text-white">{label}</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const targets = useHealthTargets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = selectedDateStr === TODAY;
  const log = useDailyLog(selectedDate);
  const schedule = useSchedule();
  const weightLogs = useWeightLogs();
  const goals = useGoals();
  const allLogs = useStore("daily_logs", storage.getDailyLogs);
  const trackers = useTrackers();
  const activeTrackers = trackers.filter(t => t.isActive);
  const [activeModal, setActiveModal] = useState<null | "water" | "calories" | "protein" | "sleep">(null);

  const t = targets ?? { calories: 2500, protein: 150, water: 8, sleep: 8 };
  const todayWorkoutObj = schedule[WEEKDAY_KEY[format(selectedDate, "EEEE")] || "mon"];
  const todayLabel = typeof todayWorkoutObj === "string" ? todayWorkoutObj : todayWorkoutObj?.label;

  const metrics = [
    { field: "water" as const, label: "Water", unit: "gl", color: "#22d3ee", icon: <Droplets className="w-3.5 h-3.5" style={{ color: "#22d3ee" }} />, value: log.water, target: t.water },
    { field: "calories" as const, label: "Calories", unit: "kcal", color: "#f97316", icon: <Flame className="w-3.5 h-3.5" style={{ color: "#f97316" }} />, value: log.calories, target: t.calories },
    { field: "protein" as const, label: "Protein", unit: "g", color: "#10b981", icon: <Beef className="w-3.5 h-3.5" style={{ color: "#10b981" }} />, value: log.protein, target: t.protein },
    { field: "sleep" as const, label: "Sleep", unit: "h", color: "#818cf8", icon: <Moon className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />, value: log.sleep, target: t.sleep },
  ];

  // Overall daily score (0-100)
  const dailyScore = Math.round(
    metrics.reduce((sum, m) => sum + Math.min(m.value / Math.max(m.target, 1), 1), 0) / metrics.length * 100
  );

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const l = allLogs[d] || { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] };
    return { day: format(subDays(new Date(), 6 - i), "EEE"), ...l };
  });

  const weightData = weightLogs.slice(-12).map(w => ({
    date: format(new Date(w.date + "T12:00:00"), "MM/dd"),
    weight: w.weight,
  }));

  const toggleGoal = useCallback((goalId: string) => {
    const dayLog = allLogs[selectedDateStr] || { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] };
    const completed = dayLog.completedGoals || [];
    const next = completed.includes(goalId) ? completed.filter(g => g !== goalId) : [...completed, goalId];
    storage.updateDailyLog(selectedDateStr, { completedGoals: next });
    if (!completed.includes(goalId)) toast.success("Goal done");
  }, [selectedDateStr, allLogs]);

  const getStreak = (goalId: string) => {
    let streak = 0; let d = new Date();
    while (true) {
      d = subDays(d, 1);
      const key = format(d, "yyyy-MM-dd");
      const l = allLogs[key];
      if (l?.completedGoals?.includes(goalId)) streak++;
      else break;
      if (streak > 365) break;
    }
    return streak;
  };



  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-widest mb-1" style={{ color: "#444" }}>{greeting}</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">{format(selectedDate, "EEEE")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>{format(selectedDate, "MMMM d, yyyy")}</p>
        </div>
        {/* Date Navigator */}
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedDate(d => subDays(d, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.05]"
            style={{ color: "#555" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.05]"
            style={{ color: isToday ? "#888" : "#6366f1", background: isToday ? "transparent" : "#6366f115" }}>
            {isToday ? "Today" : format(selectedDate, "MMM d")}
          </button>
          <button onClick={() => { if (!isToday) setSelectedDate(d => { const next = addDays(d, 1); return next > new Date() ? new Date() : next; }); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.05]"
            style={{ color: isToday ? "#2a2a2a" : "#555" }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Today's Score + Workout */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 gap-3">
        {/* Daily Score */}
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6366f115, #818cf810)", border: "1px solid #6366f130" }}>
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: "#818cf8" }} />
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#818cf880" }}>{isToday ? "Today's Score" : "Score"}</p>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">{dailyScore}<span className="text-lg" style={{ color: "#555" }}>%</span></p>
        </div>

        {/* Today's Workout */}
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #10b98115, #22d3ee10)", border: "1px solid #10b98130" }}>
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4" style={{ color: "#10b98180" }} />
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#10b98180" }}>{isToday ? "Today" : format(selectedDate, "EEEE")}</p>
          </div>
          <p className="text-lg font-bold text-white leading-tight mt-1">{todayLabel || "Rest Day"}</p>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <ActivityHeatmap />
      </motion.div>

      {/* Progress Rings */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#444" }}>{isToday ? "Today's Progress" : "Progress"}</p>
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => {
            const pct = Math.round(Math.min(m.value / Math.max(m.target, 1), 1) * 100);
            return (
              <button key={m.field} onClick={() => setActiveModal(m.field)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors hover:bg-white/[0.02]"
                style={{ background: "#111", border: "1px solid #1d1d1d" }}>
                <RingProgress value={m.value} max={m.target} size={72} strokeWidth={5} color={m.color} icon={m.icon} unit={m.unit} />
                <div className="text-center">
                  <p className="text-[11px] font-semibold" style={{ color: "#555" }}>{m.label}</p>
                  <p className="text-[10px]" style={{ color: pct >= 100 ? m.color : "#444" }}>{pct}%</p>
                </div>
              </button>
            );
          })}
        </div>
        {/* Quick add row */}
        <div className="flex gap-2 mt-3">
          {metrics.map(m => (
            <button key={m.field} onClick={() => setActiveModal(m.field)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-colors"
              style={{ background: "#111", border: "1px solid #1d1d1d", color: "#444" }}>
              <Plus className="w-3 h-3" />
              {m.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Habits */}
      {goals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Habits</p>
            <p className="text-[11px]" style={{ color: "#444" }}>
              {(log.completedGoals || []).filter(id => goals.find(g => g.id === id)).length} / {goals.length}
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1d1d1d" }}>
            {goals.map((goal, i) => {
              const done = (log.completedGoals || []).includes(goal.id);
              const streak = getStreak(goal.id);
              return (
                <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: done ? "#131313" : "#111",
                    borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                  }}>
                  <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center border-2 transition-all"
                    style={{
                      borderColor: done ? goal.color : "#2a2a2a",
                      background: done ? goal.color + "22" : "transparent",
                    }}>
                    {done && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={goal.color} strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: done ? "#444" : "#ccc" }}>
                    {goal.name}
                  </span>
                  {streak > 0 && isToday && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#1a1a1a", color: "#f97316" }}>
                      🔥 {streak}d
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tracker Summary Cards */}
      {activeTrackers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="grid grid-cols-2 gap-3">
          {activeTrackers.map((t, i) => {
            const totalItems = t.categories.reduce((s, c) => s + c.items.length, 0);
            
            let extraStat = null;
            if (t.type === "measurement") {
              const itemsWithLogs = t.categories.reduce((s, c) => s + c.items.filter(item => item.records.length > 0).length, 0);
              extraStat = <span style={{ color: "#f59e0b" }}>{itemsWithLogs} logged</span>;
            } else if (t.type === "completion" && t.hasDifficulty) {
              const e = t.categories.reduce((s, c) => s + c.items.filter(item => item.records.length > 0 && item.records[item.records.length-1].status === "Easy").length, 0);
              const m = t.categories.reduce((s, c) => s + c.items.filter(item => item.records.length > 0 && item.records[item.records.length-1].status === "Medium").length, 0);
              const h = t.categories.reduce((s, c) => s + c.items.filter(item => item.records.length > 0 && item.records[item.records.length-1].status === "Hard").length, 0);
              extraStat = (
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "#22c55e" }}>{e}E</span>
                  <span className="text-[10px]" style={{ color: "#f59e0b" }}>{m}M</span>
                  <span className="text-[10px]" style={{ color: "#ef4444" }}>{h}H</span>
                </div>
              );
            }

            return (
              <Link key={t.id} href={`/trackers/${t.id}`}>
                <div className="rounded-2xl p-4 cursor-pointer transition-all hover:border-[#333] relative overflow-hidden"
                  style={{ background: "#111", border: "1px solid #1d1d1d" }}>
                  <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full opacity-[0.05]"
                    style={{ background: `radial-gradient(circle, ${i % 2 === 0 ? "#f59e0b" : "#6366f1"}, transparent)` }} />
                  <div className="flex items-center gap-2 mb-3">
                    {t.icon === "dumbbell" ? <Dumbbell className="w-4 h-4" style={{ color: "#f59e0b" }} /> : 
                     t.icon === "code" ? <Code2 className="w-4 h-4" style={{ color: "#6366f1" }} /> :
                     t.icon === "book" ? <BookOpen className="w-4 h-4" style={{ color: "#10b981" }} /> :
                     <Activity className="w-4 h-4" style={{ color: "#22d3ee" }} />}
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>{t.name}</p>
                  </div>
                  <p className="text-3xl font-black text-white">{totalItems}</p>
                  {extraStat ? (
                    <div className="text-[10px] mt-1" style={{ color: "#555" }}>
                      {extraStat}
                    </div>
                  ) : (
                    <p className="text-[10px] mt-1" style={{ color: "#555" }}>Items</p>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="grid grid-cols-2 gap-4">
        {/* Calories */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Calories</p>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#333" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#161616", border: "1px solid #222", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#666" }} itemStyle={{ color: "#f97316" }} />
              <ReferenceLine y={t.calories} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.3} />
              <Bar dataKey="calories" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weight */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Weight</p>
            {weightLogs.length >= 2 && (
              <span className={cn("text-[10px] font-semibold flex items-center gap-0.5",
                weightLogs[weightLogs.length - 1].weight < weightLogs[0].weight ? "text-emerald-500" : "text-red-500")}>
                {weightLogs[weightLogs.length - 1].weight < weightLogs[0].weight
                  ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {Math.abs(weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight).toFixed(1)}
              </span>
            )}
          </div>
          {weightData.length > 1 ? (
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={weightData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#333" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#161616", border: "1px solid #222", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#666" }} itemStyle={{ color: "#6366f1" }} />
                <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[90px] flex items-center justify-center text-[11px]" style={{ color: "#333" }}>
              Log weigh-ins to see trend
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Log Modals */}
      {metrics.map(m => (
        <QuickLogModal key={m.field} open={activeModal === m.field} onClose={() => setActiveModal(null)}
          field={m.field} current={m.value} target={m.target} label={m.label} unit={m.unit} color={m.color} dateStr={selectedDateStr} />
      ))}
    </div>
  );
}
