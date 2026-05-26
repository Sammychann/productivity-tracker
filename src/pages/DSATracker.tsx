import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, Code2, X, ExternalLink, BookOpen } from "lucide-react";
import { storage, type DSACategory, type DSAProblem } from "@/lib/storage";
import { useDSA } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

const CATEGORY_COLORS = [
  "#6366f1", "#22d3ee", "#10b981", "#f97316", "#818cf8",
  "#ec4899", "#f59e0b", "#14b8a6", "#8b5cf6", "#ef4444",
  "#06b6d4", "#84cc16",
];

function getCatColor(idx: number): string {
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

export default function DSATracker() {
  const categories = useDSA();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddProblem, setShowAddProblem] = useState<string | null>(null); // category id
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Add problem form
  const [newProbName, setNewProbName] = useState("");
  const [newProbDiff, setNewProbDiff] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newProbUrl, setNewProbUrl] = useState("");
  const [newProbNotes, setNewProbNotes] = useState("");

  // Add category form
  const [newCatName, setNewCatName] = useState("");

  const totalProblems = categories.reduce((sum, c) => sum + c.problems.length, 0);
  const easyCount = categories.reduce((s, c) => s + c.problems.filter(p => p.difficulty === "Easy").length, 0);
  const medCount = categories.reduce((s, c) => s + c.problems.filter(p => p.difficulty === "Medium").length, 0);
  const hardCount = categories.reduce((s, c) => s + c.problems.filter(p => p.difficulty === "Hard").length, 0);

  const handleAddProblem = () => {
    if (!newProbName.trim() || !showAddProblem) return;
    const problem: DSAProblem = {
      id: crypto.randomUUID(),
      name: newProbName.trim(),
      difficulty: newProbDiff,
      url: newProbUrl.trim() || undefined,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: newProbNotes.trim() || undefined,
    };
    storage.setDSA(categories.map(c =>
      c.id === showAddProblem ? { ...c, problems: [...c.problems, problem] } : c
    ));
    toast.success("Problem added");
    setShowAddProblem(null);
    setNewProbName(""); setNewProbDiff("Medium"); setNewProbUrl(""); setNewProbNotes("");
  };

  const handleDeleteProblem = (catId: string, probId: string) => {
    storage.setDSA(categories.map(c =>
      c.id === catId ? { ...c, problems: c.problems.filter(p => p.id !== probId) } : c
    ));
    toast.success("Removed");
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    storage.setDSA([...categories, { id: crypto.randomUUID(), name, problems: [] }]);
    toast.success(`"${name}" added`);
    setNewCatName("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.problems.length > 0) {
      if (!window.confirm(`This will delete ${cat.problems.length} problem(s) in "${cat.name}". Continue?`)) return;
    }
    storage.setDSA(categories.filter(c => c.id !== catId));
    if (expanded === catId) setExpanded(null);
    toast.success("Category removed");
  };

  const cardStyle = { background: "#111", border: "1px solid #1d1d1d" };
  const inputCls = "border-[#222] text-white placeholder:text-[#333] h-11";
  const inputStyle = { background: "#161616" };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DSA</h1>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>Problem tracker</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCategory(true)} size="sm" variant="outline"
            className="gap-2 border-[#222] text-[#888] hover:bg-white/[0.04] hover:text-white">
            <Plus className="w-4 h-4" /> Topic
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: totalProblems, color: "#fff" },
          { label: "Easy", value: easyCount, color: DIFFICULTY_COLORS.Easy },
          { label: "Medium", value: medCount, color: DIFFICULTY_COLORS.Medium },
          { label: "Hard", value: hardCount, color: DIFFICULTY_COLORS.Hard },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl" style={cardStyle}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: "#444" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category sections */}
      {categories.map((cat, ci) => {
        const color = getCatColor(ci);
        const isExpanded = expanded === cat.id;

        return (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + ci * 0.04 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1d1d1d" }}>
              {/* Category header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : cat.id)}
                className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/[0.01]"
                style={{ background: isExpanded ? "#131313" : "#111" }}>
                <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{cat.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: color + "15", color }}>
                      {cat.problems.length}
                    </span>
                  </div>
                  {/* Difficulty breakdown */}
                  {cat.problems.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      {(["Easy", "Medium", "Hard"] as const).map(d => {
                        const count = cat.problems.filter(p => p.difficulty === d).length;
                        if (!count) return null;
                        return (
                          <span key={d} className="text-[10px] font-medium" style={{ color: DIFFICULTY_COLORS[d] + "aa" }}>
                            {count} {d}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button onClick={(e) => { e.stopPropagation(); setShowAddProblem(cat.id); }}
                  className="px-3 h-8 rounded-lg text-xs font-semibold transition-colors shrink-0"
                  style={{ background: color + "15", color }}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Add
                </button>
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform"
                  style={{ color: "#333", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
              </div>

              {/* Expanded problems list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden" style={{ borderTop: "1px solid #1a1a1a", background: "#0e0e0e" }}>
                    <div className="px-4 py-4 space-y-1">
                      {cat.problems.length > 0 ? (
                        [...cat.problems].reverse().map((prob, pi) => (
                          <div key={prob.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#111" }}>
                            {/* Difficulty dot */}
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: DIFFICULTY_COLORS[prob.difficulty || "Medium"] }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">{prob.name}</p>
                                {prob.url && (
                                  <a href={prob.url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="shrink-0 transition-colors hover:text-primary"
                                    style={{ color: "#555" }}>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px]" style={{ color: "#333" }}>
                                  {format(new Date(prob.date + "T12:00:00"), "MMM d, yyyy")}
                                </span>
                                {prob.notes && (
                                  <span className="text-[10px] truncate" style={{ color: "#444" }}>— {prob.notes}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: DIFFICULTY_COLORS[prob.difficulty || "Medium"] + "18", color: DIFFICULTY_COLORS[prob.difficulty || "Medium"] }}>
                              {prob.difficulty || "Medium"}
                            </span>
                            <button onClick={() => handleDeleteProblem(cat.id, prob.id)}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:text-red-500 shrink-0"
                              style={{ color: "#2a2a2a" }}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-center py-3" style={{ color: "#2a2a2a" }}>No problems solved yet</p>
                      )}
                    </div>

                    {/* Delete category */}
                    <div className="px-4 pb-3 flex justify-end">
                      <button onClick={() => handleDeleteCategory(cat.id)}
                        className="text-[10px] font-medium px-2 py-1 rounded transition-colors hover:text-red-500"
                        style={{ color: "#333" }}>
                        Delete topic
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {categories.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <Code2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#2a2a2a" }} />
          <p className="text-sm font-medium" style={{ color: "#444" }}>No topics yet</p>
          <p className="text-xs mt-1" style={{ color: "#333" }}>Add your first data structure topic</p>
        </div>
      )}

      {/* Add Problem Dialog */}
      <Dialog open={!!showAddProblem} onOpenChange={o => { if (!o) { setShowAddProblem(null); setNewProbName(""); setNewProbUrl(""); setNewProbNotes(""); } }}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">
              Add Problem — {categories.find(c => c.id === showAddProblem)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Problem name</Label>
              <Input placeholder="e.g. Two Sum" value={newProbName}
                onChange={e => setNewProbName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddProblem()}
                className={inputCls} style={inputStyle} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Difficulty</Label>
              <div className="flex gap-2">
                {(["Easy", "Medium", "Hard"] as const).map(d => (
                  <button key={d} onClick={() => setNewProbDiff(d)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center"
                    style={{
                      background: newProbDiff === d ? DIFFICULTY_COLORS[d] + "20" : "#161616",
                      border: `1px solid ${newProbDiff === d ? DIFFICULTY_COLORS[d] + "50" : "#222"}`,
                      color: newProbDiff === d ? DIFFICULTY_COLORS[d] : "#444",
                    }}>{d}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Link <span style={{ color: "#333" }}>— optional</span></Label>
              <Input placeholder="https://leetcode.com/problems/..." value={newProbUrl}
                onChange={e => setNewProbUrl(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Notes <span style={{ color: "#333" }}>— optional</span></Label>
              <Input placeholder="e.g. Used two-pointer approach" value={newProbNotes}
                onChange={e => setNewProbNotes(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <Button onClick={handleAddProblem} disabled={!newProbName.trim()} className="w-full bg-primary hover:bg-primary/90">
              Add Problem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={o => { if (!o) { setShowAddCategory(false); setNewCatName(""); } }}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Existing categories */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#888" }}>Current topics</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, ci) => {
                  const color = getCatColor(ci);
                  return (
                    <div key={cat.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: color + "15", color, border: `1px solid ${color}30` }}>
                      {cat.name}
                      <button onClick={() => handleDeleteCategory(cat.id)}
                        className="ml-0.5 hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>New topic name</Label>
              <Input placeholder="e.g. Recursion, Greedy, Sorting…" value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                className={inputCls} style={inputStyle} autoFocus />
            </div>
            <Button onClick={handleAddCategory} disabled={!newCatName.trim()} className="w-full bg-primary hover:bg-primary/90">
              Add Topic
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
