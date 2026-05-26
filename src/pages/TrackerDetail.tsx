import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ArrowLeft, ExternalLink, Activity } from "lucide-react";
import { storage, type TrackerSection, type TrackerRecord, type TrackerItem } from "@/lib/storage";
import { useTrackers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useRoute } from "wouter";
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

export default function TrackerDetail() {
  const [, params] = useRoute("/trackers/:id");
  const trackers = useTrackers();
  const tracker = trackers.find(t => t.id === params?.id);

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showAddItem, setShowAddItem] = useState<string | null>(null); // categoryId
  const [newItemName, setNewItemName] = useState("");

  // For Completion type (Adding a record immediately implies adding an item in DSA)
  // But wait, our unified schema has Item -> Records.
  // In DSA, an "Item" is the problem (e.g. "Two Sum"). The "Record" is solving it today.
  // So adding an item = adding a problem + a record.
  const [newStatus, setNewStatus] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newUrl, setNewUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // For Measurement type (Adding a record to an existing item)
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");

  if (!tracker) {
    return (
      <div className="text-center py-12">
        <p className="text-white font-bold text-xl">Module not found</p>
        <Link href="/trackers">
          <Button variant="link" className="text-[#888] mt-2">Go back</Button>
        </Link>
      </div>
    );
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return { ...t, categories: [...t.categories, { id: crypto.randomUUID(), name: newCatName.trim(), items: [] }] };
      }
      return t;
    });
    storage.setTrackers(update);
    toast.success(`Category added`);
    setShowAddCat(false);
    setNewCatName("");
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !showAddItem) return;
    
    let initialRecord: TrackerRecord | null = null;
    if (tracker.type === "completion") {
      initialRecord = {
        id: crypto.randomUUID(),
        date: format(new Date(), "yyyy-MM-dd"),
        status: tracker.hasDifficulty ? newStatus : undefined,
        url: tracker.hasUrl ? newUrl : undefined,
        notes: newNotes || undefined,
      };
    }

    const item: TrackerItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      records: initialRecord ? [initialRecord] : [],
    };

    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return {
          ...t, categories: t.categories.map(c => 
            c.id === showAddItem ? { ...c, items: [...c.items, item] } : c
          )
        };
      }
      return t;
    });

    storage.setTrackers(update);
    toast.success("Added");
    setShowAddItem(null);
    setNewItemName(""); setNewUrl(""); setNewNotes("");
  };

  const handleAddRecord = (catId: string, itemId: string) => {
    if (!val1 && !val2) return;
    const record: TrackerRecord = {
      id: crypto.randomUUID(),
      date: format(new Date(), "yyyy-MM-dd"),
      value1: parseFloat(val1) || 0,
      value2: parseFloat(val2) || 0,
    };

    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return {
          ...t, categories: t.categories.map(c => 
            c.id === catId ? {
              ...c, items: c.items.map(i => 
                i.id === itemId ? { ...i, records: [...i.records, record] } : i
              )
            } : c
          )
        };
      }
      return t;
    });

    storage.setTrackers(update);
    toast.success("Logged");
    setVal1(""); setVal2("");
  };

  const handleDeleteItem = (catId: string, itemId: string) => {
    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return {
          ...t, categories: t.categories.map(c => 
            c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
          )
        };
      }
      return t;
    });
    storage.setTrackers(update);
    toast.success("Deleted");
  };

  const handleDeleteCategory = (catId: string) => {
    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return { ...t, categories: t.categories.filter(c => c.id !== catId) };
      }
      return t;
    });
    storage.setTrackers(update);
    toast.success("Category deleted");
  };

  const totalItems = tracker.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/trackers">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{tracker.name}</h1>
            <p className="text-sm mt-0.5 uppercase tracking-widest font-semibold" style={{ color: "#555" }}>
              {totalItems} items
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddCat(true)} size="sm" variant="outline"
          className="gap-2 border-[#222] text-[#888] hover:bg-white/[0.04] hover:text-white">
          <Plus className="w-4 h-4" /> Category
        </Button>
      </motion.div>

      {/* Content */}
      <div className="space-y-4">
        {tracker.categories.map((cat, ci) => {
          const color = getCatColor(ci);
          const isExpandedCat = expandedCat === cat.id;

          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1d1d1d" }}>
                {/* Category Header */}
                <div onClick={() => setExpandedCat(isExpandedCat ? null : cat.id)}
                  className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/[0.01]"
                  style={{ background: isExpandedCat ? "#131313" : "#111" }}>
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{cat.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: color + "15", color }}>
                        {cat.items.length}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setShowAddItem(cat.id); }}
                    className="px-3 h-8 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    style={{ background: color + "15", color }}>
                    <Plus className="w-3.5 h-3.5 inline mr-1" />Add
                  </button>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: "#333", transform: isExpandedCat ? "rotate(180deg)" : "rotate(0deg)" }} />
                </div>

                {/* Items List */}
                <AnimatePresence>
                  {isExpandedCat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden" style={{ borderTop: "1px solid #1a1a1a", background: "#0e0e0e" }}>
                      
                      {tracker.type === "completion" ? (
                        // COMPLETION TYPE RENDERING (Like DSA)
                        <div className="px-4 py-4 space-y-1">
                          {cat.items.map(item => {
                            const rec = item.records[item.records.length - 1]; // latest record
                            return (
                              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#111" }}>
                                {tracker.hasDifficulty && (
                                  <div className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: DIFFICULTY_COLORS[rec?.status || "Medium"] }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                    {rec?.url && (
                                      <a href={rec.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        className="shrink-0 transition-colors hover:text-primary" style={{ color: "#555" }}>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {rec?.date && (
                                      <span className="text-[10px]" style={{ color: "#333" }}>
                                        {format(new Date(rec.date + "T12:00:00"), "MMM d, yyyy")}
                                      </span>
                                    )}
                                    {rec?.notes && (
                                      <span className="text-[10px] truncate" style={{ color: "#444" }}>— {rec.notes}</span>
                                    )}
                                  </div>
                                </div>
                                {tracker.hasDifficulty && rec?.status && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                                    style={{ background: DIFFICULTY_COLORS[rec.status] + "18", color: DIFFICULTY_COLORS[rec.status] }}>
                                    {rec.status}
                                  </span>
                                )}
                                <button onClick={() => handleDeleteItem(cat.id, item.id)}
                                  className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:text-red-500 shrink-0"
                                  style={{ color: "#2a2a2a" }}>
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // MEASUREMENT TYPE RENDERING (Like Lifts)
                        <div className="px-4 py-4 space-y-2">
                          {cat.items.map(item => {
                            const isExpandedItem = expandedItem === item.id;
                            const prRecord = item.records.length > 0 
                              ? item.records.reduce((a, b) => (b.value1 || 0) > (a.value1 || 0) ? b : a) 
                              : null;
                            
                            return (
                              <div key={item.id} className="rounded-xl overflow-hidden" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                                <div onClick={() => setExpandedItem(isExpandedItem ? null : item.id)}
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{item.name}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>
                                      {item.records.length} logs {prRecord && <span className="ml-2 text-emerald-500 font-medium">PR: {prRecord.value1} {tracker.metric1}</span>}
                                    </p>
                                  </div>
                                  <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "#444", transform: isExpandedItem ? "rotate(180deg)" : "rotate(0deg)" }} />
                                </div>
                                
                                <AnimatePresence>
                                  {isExpandedItem && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden bg-[#0a0a0a] border-t border-[#1a1a1a]">
                                      <div className="p-3 space-y-3">
                                        <div className="flex gap-2">
                                          <Input type="number" placeholder={tracker.metric1 || "Val 1"} value={val1} onChange={e => setVal1(e.target.value)} className="h-9 text-xs border-[#222] bg-[#111] text-white" />
                                          <Input type="number" placeholder={tracker.metric2 || "Val 2"} value={val2} onChange={e => setVal2(e.target.value)} className="h-9 text-xs border-[#222] bg-[#111] text-white" />
                                          <Button onClick={() => handleAddRecord(cat.id, item.id)} size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 text-xs">Log</Button>
                                          <Button onClick={() => handleDeleteItem(cat.id, item.id)} size="sm" variant="outline" className="h-9 w-9 p-0 border-[#222] hover:bg-red-500/20 text-[#888] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                        {item.records.length > 0 && (
                                          <div className="space-y-1">
                                            {[...item.records].reverse().map(rec => (
                                              <div key={rec.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-[#111]">
                                                <span className="text-[10px]" style={{ color: "#555" }}>{format(new Date(rec.date + "T12:00:00"), "MMM d, yyyy")}</span>
                                                <span className="text-xs font-mono font-medium text-white">{rec.value1} {tracker.metric1} <span style={{ color: "#555" }}>×</span> {rec.value2} {tracker.metric2}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="px-4 pb-3 flex justify-end">
                        <button onClick={() => handleDeleteCategory(cat.id)}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors hover:text-red-500"
                          style={{ color: "#333" }}>Delete category</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCat} onOpenChange={setShowAddCat}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader><DialogTitle className="text-white">Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="e.g. Legs, Strings..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()} className="border-[#222] text-white bg-[#161616]" autoFocus />
            <Button onClick={handleAddCategory} className="w-full bg-primary hover:bg-primary/90">Add Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!showAddItem} onOpenChange={o => { if (!o) setShowAddItem(null); }}>
        <DialogContent className="max-w-xs" style={{ background: "#111", borderColor: "#1d1d1d" }}>
          <DialogHeader><DialogTitle className="text-white">Add Item</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "#888" }}>Name</Label>
              <Input placeholder="e.g. Bench Press" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                className="border-[#222] text-white bg-[#161616]" autoFocus />
            </div>
            
            {tracker.type === "completion" && (
              <>
                {tracker.hasDifficulty && (
                  <div className="space-y-1.5">
                    <Label className="text-sm" style={{ color: "#888" }}>Difficulty</Label>
                    <div className="flex gap-2">
                      {(["Easy", "Medium", "Hard"] as const).map(d => (
                        <button key={d} onClick={() => setNewStatus(d)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: newStatus === d ? DIFFICULTY_COLORS[d] + "20" : "#161616",
                            border: `1px solid ${newStatus === d ? DIFFICULTY_COLORS[d] + "50" : "#222"}`,
                            color: newStatus === d ? DIFFICULTY_COLORS[d] : "#444",
                          }}>{d}</button>
                      ))}
                    </div>
                  </div>
                )}
                {tracker.hasUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-sm" style={{ color: "#888" }}>URL</Label>
                    <Input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="border-[#222] text-white bg-[#161616]" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ color: "#888" }}>Notes</Label>
                  <Input placeholder="Optional notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="border-[#222] text-white bg-[#161616]" />
                </div>
              </>
            )}

            <Button onClick={handleAddItem} disabled={!newItemName.trim()} className="w-full bg-primary hover:bg-primary/90 mt-2">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
