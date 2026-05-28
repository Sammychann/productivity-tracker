import { useState, useRef, useEffect } from "react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Droplets, Flame, Beef, Moon, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { storage, type DailyLog } from "@/lib/storage";
import { useHealthTargets, useStore } from "@/hooks/use-storage";
import { toast } from "sonner";

const SLEEP_QUALITY = [
  { value: "poor", label: "Poor", color: "#ef4444" },
  { value: "okay", label: "Okay", color: "#f59e0b" },
  { value: "good", label: "Good", color: "#22c55e" },
  { value: "great", label: "Great", color: "#6366f1" },
] as const;

const METRICS = [
  { key: "water" as const, label: "Water", unit: "glasses", color: "#22d3ee", icon: Droplets, step: 1 },
  { key: "calories" as const, label: "Calories", unit: "kcal", color: "#f97316", icon: Flame, step: 50 },
  { key: "protein" as const, label: "Protein", unit: "g", color: "#10b981", icon: Beef, step: 5 },
  { key: "sleep" as const, label: "Sleep", unit: "hrs", color: "#818cf8", icon: Moon, step: 0.5 },
];

function TapEdit({ value, onSave, color }: { value: number; onSave: (v: number) => void; color: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { setDraft(String(value)); setTimeout(() => ref.current?.select(), 10); }
  }, [editing, value]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input ref={ref} type="number" value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="text-right text-2xl font-bold bg-transparent outline-none border-b w-20"
        style={{ color, borderColor: color + "50" }}
      />
    );
  }
  return (
    <button onClick={() => setEditing(true)} title="Tap to edit"
      className="text-right group">
      <p className="text-2xl font-bold text-white group-hover:opacity-80 transition-opacity">{value}</p>
    </button>
  );
}

export default function HealthTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const targets = useHealthTargets();
  const allLogs = useStore("daily_logs", storage.getDailyLogs);
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const log: DailyLog = Object.assign(
    { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] },
    allLogs[dateStr] || {}
  ) as DailyLog;

  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
  const t = targets ?? { calories: 2500, protein: 150, water: 8, sleep: 8 };
  const targetMap = { water: t.water, calories: t.calories, protein: t.protein, sleep: t.sleep };

  const update = (field: keyof Pick<DailyLog, "water" | "calories" | "protein" | "sleep">, value: number) => {
    storage.updateDailyLog(dateStr, { [field]: Math.max(0, value) } as Partial<DailyLog>);
    toast.success("Updated");
  };

  const historyData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const l = allLogs[d] || { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] };
    return { day: format(subDays(new Date(), 6 - i), "EEE"), ...l };
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white tracking-tight">Health</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>Daily metrics</p>
      </motion.div>

      {/* Date Picker */}
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.04]"
          style={{ color: "var(--text-dim)" }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">
            {isToday ? "Today" : format(selectedDate, "MMMM d")}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{format(selectedDate, "EEEE, yyyy")}</p>
        </div>
        <button onClick={() => setSelectedDate(d => { const n = subDays(d, -1); return n > new Date() ? new Date() : n; })}
          disabled={isToday}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.04] disabled:opacity-20"
          style={{ color: "var(--text-dim)" }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="space-y-3">
        {METRICS.map((m, i) => {
          const value = (log[m.key] as number) ?? 0;
          const target = targetMap[m.key];
          const pct = Math.min((value / Math.max(target, 1)) * 100, 100);
          const Icon = m.icon;

          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.color + "15" }}>
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{m.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>/ {target} {m.unit}</p>
                  </div>
                </div>
                <TapEdit value={value} onSave={v => update(m.key, v)} color={m.color} />
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: "var(--border-s)" }}>
                <motion.div className="h-full rounded-full" style={{ background: m.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }} />
              </div>

              {/* +/- controls */}
              <div className="flex items-center gap-2">
                <button onClick={() => update(m.key, value - m.step)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: "var(--panel-hover)", color: "var(--text-tertiary)" }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => update(m.key, value + m.step)}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  style={{ background: m.color + "15", color: m.color }}>
                  <Plus className="w-3.5 h-3.5" /> +{m.step} {m.unit}
                </button>
              </div>

              {/* Sleep quality */}
              {m.key === "sleep" && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Quality</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SLEEP_QUALITY.map(q => (
                      <button key={q.value} onClick={() => { storage.updateDailyLog(dateStr, { sleepQuality: q.value }); toast.success("Quality saved"); }}
                        className="py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: log.sleepQuality === q.value ? q.color + "20" : "var(--panel-hover)",
                          border: `1px solid ${log.sleepQuality === q.value ? q.color + "40" : "var(--border-s)"}`,
                          color: log.sleepQuality === q.value ? q.color : "var(--text-muted)",
                        }}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 7-Day History */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>7-Day History</p>
        <div className="grid grid-cols-2 gap-3">
          {METRICS.map((m, i) => {
            const target = targetMap[m.key];
            return (
              <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="p-4 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <m.icon className="w-3 h-3" style={{ color: m.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                </div>
                <ResponsiveContainer width="100%" height={70}>
                  <BarChart data={historyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, Math.max(target * 1.3, 1)]} />
                    <Tooltip contentStyle={{ background: "var(--panel-hover)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "var(--text-tertiary)" }} itemStyle={{ color: m.color }} />
                    <ReferenceLine y={target} stroke={m.color} strokeDasharray="3 3" strokeOpacity={0.3} />
                    <Bar dataKey={m.key} fill={m.color} radius={[2, 2, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
