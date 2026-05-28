import { useState } from "react";
import { format, parseISO, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Plus, Trash2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { storage } from "@/lib/storage";
import { useWeightLogs, useUserPrefs } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

function getBMI(weight: number, heightCm: number) {
  return (weight / Math.pow(heightCm / 100, 2));
}

function getBMILabel(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#22d3ee" };
  if (bmi < 25)   return { label: "Normal", color: "#22c55e" };
  if (bmi < 30)   return { label: "Overweight", color: "#f59e0b" };
  return { label: "Obese", color: "#ef4444" };
}

export default function WeightTracker() {
  const weightLogs = useWeightLogs();
  const userPrefs = useUserPrefs();
  const unit = userPrefs?.weightUnit ?? "kg";
  const height = userPrefs?.height;

  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState(() => localStorage.getItem("goal_weight") || "");

  const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.filter(l => parseISO(l.date) >= subWeeks(new Date(), 12));
  const chartData = recent.map(l => ({ date: format(parseISO(l.date), "MMM d"), weight: l.weight }));

  const current = sorted.length ? sorted[sorted.length - 1].weight : null;
  const start = sorted.length ? sorted[0].weight : null;
  const change = current !== null && start !== null ? current - start : null;
  const goalNum = goalWeight ? parseFloat(goalWeight) : null;

  const bmiVal = current && height ? getBMI(current, height) : null;
  const bmiInfo = bmiVal ? getBMILabel(bmiVal) : null;

  const handleAdd = () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const logs = storage.getWeightLogs();
    const idx = logs.findIndex(l => l.date === today);
    if (idx >= 0) logs[idx].weight = w;
    else logs.push({ date: today, weight: w });
    storage.setWeightLogs(logs);
    toast.success("Weight logged");
    setNewWeight("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Weight</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>Track your progress</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Log
        </Button>
      </motion.div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Current", value: current ? `${current}` : "—", sub: unit, color: "var(--text-heading)" },
          { label: "Change", value: change !== null ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—", sub: unit, color: change === null ? "var(--text-muted)" : change < 0 ? "#22c55e" : "#ef4444" },
          { label: "Goal", value: goalNum ? `${goalNum}` : "—", sub: unit, color: "#6366f1" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
            {s.value !== "—" && <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Goal weight input */}
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
        <p className="text-sm font-medium shrink-0" style={{ color: "var(--text-dim)" }}>Goal ({unit})</p>
        <Input type="number" placeholder="e.g. 75" value={goalWeight}
          onChange={e => { setGoalWeight(e.target.value); localStorage.setItem("goal_weight", e.target.value); }}
          className="h-9 border-[var(--border-strong)] text-white text-sm" style={{ background: "var(--panel-hover)" }} />
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>12-Week Trend</p>
          {current && start && change !== null && (
            <span className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: change < 0 ? "#22c55e" : "#ef4444" }}>
              {change < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {Math.abs(change).toFixed(1)} {unit}
            </span>
          )}
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={40} />
              <Tooltip contentStyle={{ background: "var(--panel-hover)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "var(--text-tertiary)" }} itemStyle={{ color: "#6366f1" }}
                formatter={v => [`${v} ${unit}`, "Weight"]} />
              {goalNum && (
                <ReferenceLine y={goalNum} stroke="#6366f1" strokeDasharray="4 4" strokeOpacity={0.5}
                  label={{ value: "Goal", fill: "#6366f1", fontSize: 10, position: "insideTopRight" }} />
              )}
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center" style={{ color: "var(--text-ghost)" }}>
            <p className="text-sm">Log weigh-ins to see your trend</p>
          </div>
        )}
      </motion.div>

      {/* BMI */}
      {bmiVal && bmiInfo && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex items-center justify-between p-5 rounded-2xl" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>BMI</p>
            <p className="text-3xl font-bold text-white">{bmiVal.toFixed(1)}</p>
          </div>
          <span className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: bmiInfo.color + "15", color: bmiInfo.color }}>
            {bmiInfo.label}
          </span>
        </motion.div>
      )}

      {/* Log history */}
      {sorted.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>History</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-s)" }}>
            {[...sorted].reverse().slice(0, 8).map((log, i) => (
              <motion.div key={log.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={{ background: "var(--panel)", borderTop: i > 0 ? "1px solid var(--border-light)" : "none" }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{log.weight} <span style={{ color: "var(--text-muted)" }}>{unit}</span></p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{format(parseISO(log.date), "EEEE, MMM d")}</p>
                </div>
                <button onClick={() => { storage.setWeightLogs(storage.getWeightLogs().filter(l => l.date !== log.date)); toast.success("Deleted"); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-950/40"
                  style={{ color: "var(--text-faint)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent style={{ background: "var(--panel)", borderColor: "var(--border-s)" }} className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white">Log Weight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Input type="number" step="0.1" placeholder={`Weight in ${unit}`} value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="text-center text-2xl font-bold border-[var(--border-strong)] text-white h-14"
              style={{ background: "var(--panel-hover)" }} autoFocus />
            <Button onClick={handleAdd} disabled={!newWeight} className="w-full bg-primary hover:bg-primary/90">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
