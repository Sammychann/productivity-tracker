import { useState, useCallback } from "react";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flame, Droplets, Moon, Beef, Target, Check, Edit2, CalendarDays } from "lucide-react";
import { storage, type GoalConfig } from "@/lib/storage";
import { useGoals, useStore } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const TODAY = format(new Date(), "yyyy-MM-dd");
const WEEKS = 12;

const ICON_OPTIONS = [
  { name: "target", icon: <Target className="w-4 h-4" /> },
  { name: "flame", icon: <Flame className="w-4 h-4" /> },
  { name: "droplets", icon: <Droplets className="w-4 h-4" /> },
  { name: "moon", icon: <Moon className="w-4 h-4" /> },
  { name: "beef", icon: <Beef className="w-4 h-4" /> },
];

const COLOR_OPTIONS = ["#6366f1", "#22d3ee", "#10b981", "#f97316", "#ef4444", "#a855f7", "#ec4899", "#14b8a6"];

function GoalIcon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const props = { className, style: color ? { color } : undefined };
  const icons: Record<string, React.ReactNode> = {
    target: <Target {...props} />, flame: <Flame {...props} />, droplets: <Droplets {...props} />,
    moon: <Moon {...props} />, beef: <Beef {...props} />,
  };
  return <>{icons[name] || <Target {...props} />}</>;
}

type LogMap = Record<string, { completedGoals: string[] } & Record<string, unknown>>;

function getStreak(goalId: string, allLogs: LogMap) {
  let streak = 0; let d = new Date();
  while (true) {
    d = subDays(d, 1);
    const key = format(d, "yyyy-MM-dd");
    if (allLogs[key]?.completedGoals?.includes(goalId)) streak++;
    else break;
    if (streak > 365) break;
  }
  return streak;
}

function GoalHeatmap({ goalId, allLogs, color }: { goalId: string; allLogs: LogMap; color: string }) {
  const today = new Date();
  const startDay = startOfWeek(subDays(today, WEEKS * 7 - 1), { weekStartsOn: 1 });
  const cells: { date: string; done: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: { date: string; done: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = addDays(startDay, w * 7 + d);
      if (cellDate > today) { col.push({ date: "", done: false }); continue; }
      const dateStr = format(cellDate, "yyyy-MM-dd");
      col.push({ date: dateStr, done: !!allLogs[dateStr]?.completedGoals?.includes(goalId) });
    }
    cells.push(col);
  }
  return (
    <div className="flex gap-0.5 mt-3 overflow-hidden">
      {cells.map((col, w) => (
        <div key={w} className="flex flex-col gap-0.5">
          {col.map((cell, d) => (
            <div key={d} title={cell.date} className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: !cell.date ? "transparent" : cell.done ? color : "var(--border-light)" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

const inputCls = "border-[var(--border-strong)] text-[var(--text-heading)] placeholder:text-[var(--text-faint)]";
const inputStyle = { background: "var(--panel-hover)" };

export default function DailyGoals() {
  const goals = useGoals();
  const allLogs = useStore("daily_logs", storage.getDailyLogs);
  const todayLog = allLogs[TODAY] || { completedGoals: [] };

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<GoalConfig | null>(null);
  const [expandedHeatmap, setExpandedHeatmap] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newIcon, setNewIcon] = useState("target");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  const resetForm = () => { setNewName(""); setNewUnit(""); setNewTarget(""); setNewIcon("target"); setNewColor(COLOR_OPTIONS[0]); };

  const openEdit = (g: GoalConfig) => {
    setEditGoal(g); setNewName(g.name); setNewUnit(g.unit);
    setNewTarget(String(g.target)); setNewIcon(g.icon); setNewColor(g.color);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    const entry = { name: newName, unit: newUnit, target: parseFloat(newTarget) || 0, icon: newIcon, color: newColor };
    const updated = editGoal
      ? goals.map(g => g.id === editGoal.id ? { ...g, ...entry } : g)
      : [...goals, { id: crypto.randomUUID(), ...entry }];
    storage.setGoals(updated);
    toast.success(editGoal ? "Goal updated" : "Goal added");
    setShowAdd(false); setEditGoal(null); resetForm();
  };

  const toggleGoal = useCallback((goalId: string) => {
    const completed = todayLog.completedGoals || [];
    const next = completed.includes(goalId) ? completed.filter(g => g !== goalId) : [...completed, goalId];
    storage.updateDailyLog(TODAY, { completedGoals: next });
    if (!completed.includes(goalId)) toast.success("Done");
  }, [todayLog.completedGoals]);

  const completedCount = goals.filter(g => (todayLog.completedGoals || []).includes(g.id)).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-heading)] tracking-tight">Goals</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
            {completedCount}/{goals.length} done today
          </p>
        </div>
        <Button onClick={() => { setEditGoal(null); resetForm(); setShowAdd(true); }} size="sm"
          className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </motion.div>

      {/* Progress */}
      {goals.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Today</p>
            <p className="text-[11px] font-bold text-[var(--text-heading)]">{Math.round((completedCount / goals.length) * 100)}%</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border-s)" }}>
            <motion.div className="h-full rounded-full bg-primary"
              initial={{ width: 0 }} animate={{ width: `${(completedCount / goals.length) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }} />
          </div>
        </div>
      )}

      {/* Goal list */}
      {goals.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
          <Target className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-ghost)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No habits yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Add your first daily habit</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-s)" }}>
          <AnimatePresence>
            {goals.map((goal, i) => {
              const done = (todayLog.completedGoals || []).includes(goal.id);
              const streak = getStreak(goal.id, allLogs as LogMap);
              const showHeat = expandedHeatmap === goal.id;

              return (
                <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ background: done ? "var(--panel-active)" : "var(--panel)", borderTop: i > 0 ? "1px solid var(--border-light)" : "none" }}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Checkbox */}
                    <button onClick={() => toggleGoal(goal.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: done ? goal.color + "20" : "var(--panel-hover)",
                        border: `2px solid ${done ? goal.color : "var(--border-strong)"}`,
                      }}>
                      {done
                        ? <Check className="w-4 h-4" style={{ color: goal.color }} />
                        : <GoalIcon name={goal.icon} className="w-3.5 h-3.5" color={goal.color} />
                      }
                    </button>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug"
                        style={{ color: done ? "var(--text-muted)" : "#ccc", textDecoration: done ? "line-through" : "none" }}>
                        {goal.name}
                      </p>
                      {goal.target > 0 && (
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{goal.target} {goal.unit}</p>
                      )}
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--border-light)", color: "#f97316" }}>
                        {streak}d
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setExpandedHeatmap(showHeat ? null : goal.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: showHeat ? "#6366f1" : "var(--text-faint)" }}>
                        <CalendarDays className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(goal)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-[var(--text-heading)]"
                        style={{ color: "var(--text-faint)" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(goal.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-500"
                        style={{ color: "var(--text-faint)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Heatmap */}
                  <AnimatePresence>
                    {showHeat && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-light)" }}>
                          <div className="flex items-center justify-between mt-3 mb-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                              12 weeks
                            </p>
                            <p className="text-[10px]" style={{ color: goal.color }}>
                              {Array.from({ length: WEEKS * 7 }, (_, k) => {
                                const d = format(subDays(new Date(), k), "yyyy-MM-dd");
                                return (allLogs[d] as { completedGoals?: string[] } | undefined)?.completedGoals?.includes(goal.id);
                              }).filter(Boolean).length} days
                            </p>
                          </div>
                          <GoalHeatmap goalId={goal.id} allLogs={allLogs as LogMap} color={goal.color} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={o => { if (!o) { setShowAdd(false); setEditGoal(null); resetForm(); } }}>
        <DialogContent className="max-w-sm" style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <DialogHeader>
            <DialogTitle className="text-[var(--text-heading)]">{editGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Name</Label>
              <Input placeholder="e.g. Meditate" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                className={inputCls} style={inputStyle} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Target</Label>
                <Input type="number" placeholder="10" value={newTarget} onChange={e => setNewTarget(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Unit</Label>
                <Input placeholder="mins, pages…" value={newUnit} onChange={e => setNewUnit(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Icon</Label>
              <div className="flex gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button key={opt.name} onClick={() => setNewIcon(opt.name)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-[var(--text-heading)]"
                    style={{
                      background: newIcon === opt.name ? newColor + "20" : "var(--panel-hover)",
                      border: `1px solid ${newIcon === opt.name ? newColor + "50" : "var(--border-strong)"}`,
                    }}>{opt.icon}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{ background: c, transform: newColor === c ? "scale(1.2)" : "scale(1)", outline: newColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!newName.trim()} className="w-full bg-primary hover:bg-primary/90">
              {editGoal ? "Save" : "Add Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-heading)]">Delete goal?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-dim)" }}>This removes the goal and its streak history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "var(--panel-hover)", borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { storage.setGoals(goals.filter(g => g.id !== deleteId)); toast.success("Deleted"); setDeleteId(null); } }}
              className="bg-destructive text-[var(--destructive-foreground)] hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
