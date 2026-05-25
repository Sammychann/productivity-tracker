import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Trophy, X } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { storage, type LiftEntry, type LiftRecord } from "@/lib/storage";
import { useLifts, useUserPrefs, useCategories } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366f1", "#22d3ee", "#10b981", "#f97316", "#818cf8",
  "#ec4899", "#f59e0b", "#14b8a6", "#8b5cf6", "#ef4444",
  "#06b6d4", "#84cc16",
];

function getCategoryColor(cat: string, allCategories: string[]): string {
  const idx = allCategories.indexOf(cat);
  return PRESET_COLORS[idx % PRESET_COLORS.length];
}

function getPR(records: LiftRecord[]) {
  if (!records.length) return null;
  return records.reduce((best, r) => {
    const score = r.weight * (1 + r.reps / 30);
    const bestScore = best.weight * (1 + best.reps / 30);
    return score > bestScore ? r : best;
  }, records[0]);
}

function getLatest(records: LiftRecord[]) {
  if (!records.length) return null;
  return [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
}

function estimate1RM(weight: number, reps: number) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

const cardStyle = { background: "#111", border: "1px solid #1d1d1d" };
const inputCls = "border-[#222] text-white placeholder:text-[#333] h-11";
const inputStyle = { background: "#161616" };

export default function LiftTracker() {
  const lifts = useLifts();
  const userPrefs = useUserPrefs();
  const categories = useCategories();
  const unit = userPrefs?.weightUnit ?? "kg";

  const [expanded, setExpanded] = useState<string | null>(null);
  const [logLiftId, setLogLiftId] = useState<string | null>(null);
  const [showAddLift, setShowAddLift] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Log form
  const [logWeight, setLogWeight] = useState("");
  const [logReps, setLogReps] = useState("5");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logNotes, setLogNotes] = useState("");

  // Add lift form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0] || "Push");

  // Add category form
  const [newCatName, setNewCatName] = useState("");

  const grouped = categories.reduce<Record<string, LiftEntry[]>>((acc, cat) => {
    acc[cat] = lifts.filter(l => l.category === cat);
    return acc;
  }, {} as Record<string, LiftEntry[]>);

  const handleLog = () => {
    const w = parseFloat(logWeight);
    const r = parseInt(logReps);
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0 || !logLiftId) return;
    const updated = lifts.map(l => {
      if (l.id !== logLiftId) return l;
      const existing = l.records.findIndex(rec => rec.date === logDate);
      const newRecord: LiftRecord = { date: logDate, weight: w, reps: r, notes: logNotes || undefined };
      const records = existing >= 0
        ? l.records.map((rec, i) => i === existing ? newRecord : rec)
        : [...l.records, newRecord];
      return { ...l, records };
    });
    storage.setLifts(updated);
    toast.success("Lift logged");
    setLogLiftId(null);
    setLogWeight(""); setLogReps("5"); setLogDate(format(new Date(), "yyyy-MM-dd")); setLogNotes("");
  };

  const handleAddLift = () => {
    if (!newName.trim()) return;
    storage.setLifts([...lifts, { id: crypto.randomUUID(), name: newName.trim(), category: newCategory, records: [] }]);
    toast.success("Lift added");
    setShowAddLift(false); setNewName(""); setNewCategory(categories[0] || "Push");
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      toast.error("Category already exists");
      return;
    }
    storage.setCategories([...categories, name]);
    toast.success(`"${name}" category added`);
    setNewCatName("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (cat: string) => {
    // Remove the category and all lifts in it
    const liftsInCat = lifts.filter(l => l.category === cat);
    if (liftsInCat.length > 0) {
      if (!window.confirm(`Wait! This will also delete ${liftsInCat.length} exercise(s) inside the "${cat}" category. Are you sure?`)) {
        return;
      }
      storage.setLifts(lifts.filter(l => l.category !== cat));
    }
    storage.setCategories(categories.filter(c => c !== cat));
    toast.success(`"${cat}" removed`);
  };

  const handleDelete = (id: string) => {
    storage.setLifts(lifts.filter(l => l.id !== id));
    if (expanded === id) setExpanded(null);
    toast.success("Removed");
  };

  const handleDeleteRecord = (liftId: string, date: string) => {
    storage.setLifts(lifts.map(l => l.id !== liftId ? l : { ...l, records: l.records.filter(r => r.date !== date) }));
  };

  const logLift = lifts.find(l => l.id === logLiftId);
  const totalSessions = lifts.reduce((sum, l) => sum + l.records.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lifts</h1>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>Personal records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCategory(true)} size="sm" variant="outline"
            className="gap-2 border-[#222] text-[#888] hover:bg-white/[0.04] hover:text-white">
            <Plus className="w-4 h-4" /> Category
          </Button>
          <Button onClick={() => setShowAddLift(true)} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add lift
          </Button>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Exercises", value: lifts.length },
          { label: "Sessions", value: totalSessions },
          { label: "PRs set", value: lifts.filter(l => l.records.length > 0).length },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl" style={cardStyle}>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: "#444" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category sections */}
      {categories.map((cat, ci) => {
        const catLifts = grouped[cat] || [];
        if (!catLifts.length) return null;
        const color = getCategoryColor(cat, categories);

        return (
          <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + ci * 0.04 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: color }} />
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>{cat}</p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1d1d1d" }}>
              {catLifts.map((lift, i) => {
                const pr = getPR(lift.records);
                const latest = getLatest(lift.records);
                const isExpanded = expanded === lift.id;
                const sorted = [...lift.records].sort((a, b) => a.date.localeCompare(b.date));
                const chartData = sorted.slice(-8).map(r => ({
                  date: format(parseISO(r.date), "MM/dd"),
                  "1RM": estimate1RM(r.weight, r.reps),
                  raw: `${r.weight}×${r.reps}`,
                }));
                const daysSince = latest ? differenceInDays(new Date(), parseISO(latest.date)) : null;

                let trending: "up" | "down" | null = null;
                if (sorted.length >= 2) {
                  const last1RM = estimate1RM(sorted[sorted.length - 1].weight, sorted[sorted.length - 1].reps);
                  const prev1RM = estimate1RM(sorted[sorted.length - 2].weight, sorted[sorted.length - 2].reps);
                  trending = last1RM >= prev1RM ? "up" : "down";
                }

                return (
                  <div key={lift.id} style={{ borderTop: i > 0 ? "1px solid #1a1a1a" : "none" }}>
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-4" style={{ background: "#111" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white">{lift.name}</p>
                          {trending === "up" && <TrendingUp className="w-3 h-3 shrink-0" style={{ color: "#22c55e" }} />}
                          {trending === "down" && <TrendingUp className="w-3 h-3 shrink-0 rotate-180" style={{ color: "#ef4444" }} />}
                        </div>
                        {pr ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold" style={{ color }}>{pr.weight}</span>
                            <span className="text-xs" style={{ color: "#555" }}>{unit} × {pr.reps}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: color + "15", color: color + "cc" }}>
                              ~{estimate1RM(pr.weight, pr.reps)}{unit} 1RM
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: "#333" }}>No records yet</p>
                        )}
                        {daysSince !== null && (
                          <p className="text-[10px] mt-0.5" style={{ color: "#333" }}>
                            {daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : `${daysSince}d ago`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setLogLiftId(lift.id); setLogDate(format(new Date(), "yyyy-MM-dd")); }}
                          className="px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: color + "15", color }}>
                          Log
                        </button>
                        <button onClick={() => setExpanded(isExpanded ? null : lift.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: "#444" }}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(lift.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-500"
                          style={{ color: "#2a2a2a" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded history */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden" style={{ borderTop: "1px solid #1a1a1a", background: "#0e0e0e" }}>
                          <div className="px-4 py-4 space-y-4">
                            {chartData.length > 1 && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#333" }}>
                                  Estimated 1RM
                                </p>
                                <ResponsiveContainer width="100%" height={80}>
                                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#2a2a2a" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: "#2a2a2a" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                                    <Tooltip
                                      contentStyle={{ background: "#161616", border: "1px solid #222", borderRadius: 8, fontSize: 11 }}
                                      labelStyle={{ color: "#555" }}
                                      itemStyle={{ color }}
                                      formatter={(v, _, p) => [`${v}${unit} (${p.payload.raw})`, "1RM"]}
                                    />
                                    <Bar dataKey="1RM" fill={color} radius={[2, 2, 0, 0]} opacity={0.8} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {sorted.length > 0 ? (
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#333" }}>History</p>
                                {[...sorted].reverse().map(rec => {
                                  const isPR = rec === pr;
                                  return (
                                    <div key={rec.date} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                                      style={{ background: isPR ? color + "08" : "transparent" }}>
                                      {isPR && <Trophy className="w-3 h-3 shrink-0" style={{ color }} />}
                                      {!isPR && <div className="w-3 shrink-0" />}
                                      <div className="flex-1">
                                        <span className="text-sm font-semibold text-white">{rec.weight}{unit} × {rec.reps}</span>
                                        {rec.notes && <span className="text-xs ml-2" style={{ color: "#444" }}>{rec.notes}</span>}
                                      </div>
                                      <span className="text-[10px]" style={{ color: "#333" }}>
                                        {format(parseISO(rec.date), "MMM d")}
                                      </span>
                                      <button onClick={() => handleDeleteRecord(lift.id, rec.date)}
                                        className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:text-red-500"
                                        style={{ color: "#2a2a2a" }}>
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-center py-3" style={{ color: "#2a2a2a" }}>No sessions logged yet</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {lifts.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "#2a2a2a" }} />
          <p className="text-sm font-medium" style={{ color: "#444" }}>No lifts yet</p>
          <p className="text-xs mt-1" style={{ color: "#333" }}>Add your first exercise</p>
        </div>
      )}

      {/* Log session modal */}
      <Dialog open={!!logLiftId} onOpenChange={o => !o && setLogLiftId(null)}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">{logLift?.name ?? "Log Session"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "#888" }}>Weight ({unit})</Label>
                <Input type="number" step="0.5" placeholder="80" value={logWeight}
                  onChange={e => setLogWeight(e.target.value)}
                  className={inputCls} style={inputStyle} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: "#888" }}>Reps</Label>
                <Input type="number" placeholder="5" value={logReps}
                  onChange={e => setLogReps(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Date</Label>
              <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                className={cn(inputCls, "text-white")} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Notes <span style={{ color: "#333" }}>— optional</span></Label>
              <Input placeholder="e.g. Paused reps, beltless…" value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
                className={inputCls} style={inputStyle} />
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
              className="w-full bg-primary hover:bg-primary/90">Save session</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add lift modal */}
      <Dialog open={showAddLift} onOpenChange={o => { if (!o) { setShowAddLift(false); setNewName(""); setNewCategory(categories[0] || "Push"); } }}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Exercise name</Label>
              <Input placeholder="e.g. Incline Bench Press" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddLift()}
                className={inputCls} style={inputStyle} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const color = getCategoryColor(cat, categories);
                  return (
                    <button key={cat} onClick={() => setNewCategory(cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: newCategory === cat ? color + "20" : "#161616",
                        border: `1px solid ${newCategory === cat ? color + "50" : "#222"}`,
                        color: newCategory === cat ? color : "#444",
                      }}>{cat}</button>
                  );
                })}
              </div>
            </div>
            <Button onClick={handleAddLift} disabled={!newName.trim()} className="w-full bg-primary hover:bg-primary/90">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add category modal */}
      <Dialog open={showAddCategory} onOpenChange={o => { if (!o) { setShowAddCategory(false); setNewCatName(""); } }}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Existing categories */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#888" }}>Current categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const color = getCategoryColor(cat, categories);
                  return (
                    <div key={cat} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: color + "15", color, border: `1px solid ${color}30` }}>
                      {cat}
                      <button onClick={() => handleDeleteCategory(cat)}
                        className="ml-0.5 hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Add new */}
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>New category name</Label>
              <Input placeholder="e.g. Shoulders, Arms, Olympic…" value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                className={inputCls} style={inputStyle} autoFocus />
            </div>
            <Button onClick={handleAddCategory} disabled={!newCatName.trim()} className="w-full bg-primary hover:bg-primary/90">
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
