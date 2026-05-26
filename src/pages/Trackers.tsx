import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, Trash2, Check, Dumbbell, Code2, BookOpen, Activity, LayoutGrid } from "lucide-react";
import { storage, type TrackerSection } from "@/lib/storage";
import { useTrackers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { toast } from "sonner";

const ICONS: Record<string, React.ReactNode> = {
  dumbbell: <Dumbbell className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
  default: <LayoutGrid className="w-5 h-5" />,
};

export default function Trackers() {
  const trackers = useTrackers();
  const active = trackers.filter(t => t.isActive);
  const inactive = trackers.filter(t => !t.isActive);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"measurement" | "completion">("measurement");
  const [newIcon, setNewIcon] = useState("activity");

  const toggleTracker = (id: string, activate: boolean) => {
    storage.setTrackers(trackers.map(t => t.id === id ? { ...t, isActive: activate } : t));
    toast.success(activate ? "Module activated" : "Module deactivated");
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newTracker: TrackerSection = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      icon: newIcon,
      type: newType,
      isActive: true,
      categories: [],
      ...(newType === "measurement" ? { metric1: "Value 1", metric2: "Value 2" } : { hasDifficulty: true, hasUrl: true })
    };
    storage.setTrackers([...trackers, newTracker]);
    setShowAdd(false);
    setNewName("");
    toast.success(`${newTracker.name} created!`);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this custom tracker permanently?")) return;
    storage.setTrackers(trackers.filter(t => t.id !== id));
    toast.success("Tracker deleted");
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Modules</h1>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>Manage your trackers</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" variant="outline"
          className="gap-2 border-[#222] text-[#888] hover:bg-white/[0.04] hover:text-white">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </motion.div>

      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Active Modules</p>
        <div className="grid grid-cols-2 gap-3">
          {active.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="relative group">
              <Link href={`/trackers/${t.id}`}>
                <div className="rounded-2xl p-4 cursor-pointer transition-all hover:border-[#333] h-full"
                  style={{ background: "#111", border: "1px solid #1d1d1d" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#1a1a1a", color: "#6366f1" }}>
                      {ICONS[t.icon] || ICONS.default}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: "#161616", color: "#555" }}>
                      {t.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
                  <p className="text-xs" style={{ color: "#555" }}>
                    {t.categories.length} {t.categories.length === 1 ? "category" : "categories"}
                  </p>
                </div>
              </Link>
              {/* Deactivate/Delete button */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {["gym", "dsa"].includes(t.id) ? (
                  <button onClick={(e) => { e.preventDefault(); toggleTracker(t.id, false); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-[#161616] hover:bg-[#222]"
                    style={{ color: "#888" }} title="Deactivate">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                ) : (
                  <button onClick={(e) => { e.preventDefault(); handleDelete(t.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-[#161616] hover:bg-red-500/20"
                    style={{ color: "#ef4444" }} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {active.length === 0 && (
            <div className="col-span-2 rounded-2xl p-8 text-center" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
              <p className="text-sm font-medium" style={{ color: "#444" }}>No active modules</p>
              <p className="text-xs mt-1" style={{ color: "#333" }}>Activate a template below or create your own</p>
            </div>
          )}
        </div>
      </div>

      {inactive.length > 0 && (
        <div className="space-y-4 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Available Templates</p>
          <div className="grid grid-cols-1 gap-2">
            {inactive.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-2xl p-3 flex items-center justify-between"
                style={{ background: "#111", border: "1px solid #1d1d1d" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#1a1a1a", color: "#888" }}>
                    {ICONS[t.icon] || ICONS.default}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{t.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#555" }}>{t.type} tracker</p>
                  </div>
                </div>
                <Button onClick={() => toggleTracker(t.id, true)} size="sm"
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs h-8">
                  Activate
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Tracker Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Create Tracker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Name</Label>
              <Input placeholder="e.g. Running, Reading..." value={newName}
                onChange={e => setNewName(e.target.value)}
                className="border-[#222] text-white placeholder:text-[#333] h-11"
                style={{ background: "#161616" }} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setNewType("measurement")}
                  className="p-3 rounded-xl text-left border transition-colors"
                  style={{
                    background: newType === "measurement" ? "#6366f115" : "#161616",
                    borderColor: newType === "measurement" ? "#6366f150" : "#222",
                  }}>
                  <p className="text-xs font-bold text-white mb-1">Measurement</p>
                  <p className="text-[10px]" style={{ color: "#666" }}>Track numeric values like Weight/Reps or Distance/Time</p>
                </button>
                <button onClick={() => setNewType("completion")}
                  className="p-3 rounded-xl text-left border transition-colors"
                  style={{
                    background: newType === "completion" ? "#10b98115" : "#161616",
                    borderColor: newType === "completion" ? "#10b98150" : "#222",
                  }}>
                  <p className="text-xs font-bold text-white mb-1">Completion</p>
                  <p className="text-[10px]" style={{ color: "#666" }}>Track status, difficulty, links, or simple check-offs</p>
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Icon</Label>
              <div className="flex gap-2">
                {Object.keys(ICONS).filter(k => k !== "default").map(k => (
                  <button key={k} onClick={() => setNewIcon(k)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors border"
                    style={{
                      background: newIcon === k ? "#ffffff10" : "#161616",
                      borderColor: newIcon === k ? "#ffffff30" : "#222",
                      color: newIcon === k ? "#fff" : "#666"
                    }}>
                    {ICONS[k]}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full bg-primary hover:bg-primary/90 mt-2">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
