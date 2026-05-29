import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ArrowLeft, ExternalLink, MoveRight, Pencil } from "lucide-react";
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

  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  const [moveItem, setMoveItem] = useState<{ catId: string, itemId: string, name: string } | null>(null);
  const [destCatId, setDestCatId] = useState<string>("");

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
        <p className="text-[var(--text-heading)] font-bold text-xl">Module not found</p>
        <Link href="/trackers">
          <Button variant="link" className="text-[var(--text-secondary)] mt-2">Go back</Button>
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

  const handleRenameCategory = () => {
    if (!editCatName.trim() || !editCatId) return;
    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        return {
          ...t, categories: t.categories.map(c => c.id === editCatId ? { ...c, name: editCatName.trim() } : c)
        };
      }
      return t;
    });
    storage.setTrackers(update);
    toast.success("Category renamed");
    setEditCatId(null);
  };

  const handleMoveItem = () => {
    if (!moveItem || !destCatId) return;
    const { catId: srcCatId, itemId } = moveItem;

    const update = trackers.map(t => {
      if (t.id === tracker.id) {
        let itemToMove: TrackerItem | null = null;
        
        // Find the item
        t.categories.forEach(c => {
          if (c.id === srcCatId) {
            itemToMove = c.items.find(i => i.id === itemId) || null;
          }
        });

        if (!itemToMove) return t;

        // Remove from source, add to dest
        return {
          ...t, categories: t.categories.map(c => {
            if (c.id === srcCatId) {
              return { ...c, items: c.items.filter(i => i.id !== itemId) };
            }
            if (c.id === destCatId) {
              return { ...c, items: [...c.items, itemToMove!] };
            }
            return c;
          })
        };
      }
      return t;
    });

    storage.setTrackers(update);
    toast.success("Item moved");
    setMoveItem(null);
    setDestCatId("");
  };

  const totalItems = tracker.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/trackers">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-[var(--text-heading)]" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-heading)] tracking-tight">{tracker.name}</h1>
            <p className="text-sm mt-0.5 uppercase tracking-widest font-semibold" style={{ color: "var(--text-dim)" }}>
              {totalItems} items
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddCat(true)} size="sm" variant="outline"
          className="gap-2 border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-heading)]">
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
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-s)" }}>
                {/* Category Header */}
                <div onClick={() => setExpandedCat(isExpandedCat ? null : cat.id)}
                  className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/[0.01]"
                  style={{ background: isExpandedCat ? "var(--panel-active)" : "var(--panel)" }}>
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-heading)]">{cat.name}</p>
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
                    style={{ color: "var(--text-faint)", transform: isExpandedCat ? "rotate(180deg)" : "rotate(0deg)" }} />
                </div>

                {/* Items List */}
                <AnimatePresence>
                  {isExpandedCat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden" style={{ borderTop: "1px solid var(--border-light)", background: "var(--panel-deep)" }}>
                      
                      {tracker.type === "completion" ? (
                        // COMPLETION TYPE RENDERING (Like DSA)
                        <div className="px-4 py-4 space-y-1">
                          {cat.items.map(item => {
                            const rec = item.records[item.records.length - 1]; // latest record
                            return (
                              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--panel)" }}>
                                {tracker.hasDifficulty && (
                                  <div className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: DIFFICULTY_COLORS[rec?.status || "Medium"] }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-[var(--text-heading)] truncate">{item.name}</p>
                                    {rec?.url && (
                                      <a href={rec.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        className="shrink-0 transition-colors hover:text-primary" style={{ color: "var(--text-dim)" }}>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {rec?.date && (
                                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                                        {format(new Date(rec.date + "T12:00:00"), "MMM d, yyyy")}
                                      </span>
                                    )}
                                    {rec?.notes && (
                                      <span className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>— {rec.notes}</span>
                                    )}
                                  </div>
                                </div>
                                {tracker.hasDifficulty && rec?.status && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                                    style={{ background: DIFFICULTY_COLORS[rec.status] + "18", color: DIFFICULTY_COLORS[rec.status] }}>
                                    {rec.status}
                                  </span>
                                )}
                                <button onClick={() => setMoveItem({ catId: cat.id, itemId: item.id, name: item.name })}
                                  className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:text-blue-500 shrink-0"
                                  style={{ color: "var(--text-ghost)" }}>
                                  <MoveRight className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteItem(cat.id, item.id)}
                                  className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:text-red-500 shrink-0"
                                  style={{ color: "var(--text-ghost)" }}>
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
                              <div key={item.id} className="rounded-xl overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--border-light)" }}>
                                <div onClick={() => setExpandedItem(isExpandedItem ? null : item.id)}
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--text-heading)]">{item.name}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                                      {item.records.length} logs {prRecord && <span className="ml-2 text-emerald-500 font-medium">PR: {prRecord.value1} {tracker.metric1}</span>}
                                    </p>
                                  </div>
                                  <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--text-muted)", transform: isExpandedItem ? "rotate(180deg)" : "rotate(0deg)" }} />
                                </div>
                                
                                <AnimatePresence>
                                  {isExpandedItem && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden bg-[#0a0a0a] border-t border-[var(--border-light)]">
                                      <div className="p-3 space-y-3">
                                        <div className="flex gap-2">
                                          <Input type="number" placeholder={tracker.metric1 || "Val 1"} value={val1} onChange={e => setVal1(e.target.value)} className="h-9 text-xs border-[var(--border-strong)] bg-[var(--panel)] text-[var(--text-heading)]" />
                                          <Input type="number" placeholder={tracker.metric2 || "Val 2"} value={val2} onChange={e => setVal2(e.target.value)} className="h-9 text-xs border-[var(--border-strong)] bg-[var(--panel)] text-[var(--text-heading)]" />
                                          <Button onClick={() => handleAddRecord(cat.id, item.id)} size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 text-xs">Log</Button>
                                          <Button onClick={() => setMoveItem({ catId: cat.id, itemId: item.id, name: item.name })} size="sm" variant="outline" className="h-9 w-9 p-0 border-[var(--border-strong)] hover:bg-blue-500/20 text-[var(--text-secondary)] hover:text-blue-500"><MoveRight className="w-3.5 h-3.5" /></Button>
                                          <Button onClick={() => handleDeleteItem(cat.id, item.id)} size="sm" variant="outline" className="h-9 w-9 p-0 border-[var(--border-strong)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                        {item.records.length > 0 && (
                                          <div className="space-y-1">
                                            {[...item.records].reverse().map(rec => (
                                              <div key={rec.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-[var(--panel)]">
                                                <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{format(new Date(rec.date + "T12:00:00"), "MMM d, yyyy")}</span>
                                                <span className="text-xs font-mono font-medium text-[var(--text-heading)]">{rec.value1} {tracker.metric1} <span style={{ color: "var(--text-dim)" }}>×</span> {rec.value2} {tracker.metric2}</span>
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

                      <div className="px-4 pb-3 flex justify-end gap-3">
                        <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors hover:text-blue-500"
                          style={{ color: "var(--text-faint)" }}>Rename category</button>
                        <button onClick={() => handleDeleteCategory(cat.id)}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors hover:text-red-500"
                          style={{ color: "var(--text-faint)" }}>Delete category</button>
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
        <DialogContent className="max-w-xs" style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <DialogHeader><DialogTitle className="text-[var(--text-heading)]">Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="e.g. Legs, Strings..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()} className="border-[var(--border-strong)] text-[var(--text-heading)] bg-[var(--panel-hover)]" autoFocus />
            <Button onClick={handleAddCategory} className="w-full bg-primary hover:bg-primary/90">Add Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!showAddItem} onOpenChange={o => { if (!o) setShowAddItem(null); }}>
        <DialogContent className="max-w-xs" style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <DialogHeader><DialogTitle className="text-[var(--text-heading)]">Add Item</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Name</Label>
              <Input placeholder="e.g. Bench Press" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                className="border-[var(--border-strong)] text-[var(--text-heading)] bg-[var(--panel-hover)]" autoFocus />
            </div>
            
            {tracker.type === "completion" && (
              <>
                {tracker.hasDifficulty && (
                  <div className="space-y-1.5">
                    <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Difficulty</Label>
                    <div className="flex gap-2">
                      {(["Easy", "Medium", "Hard"] as const).map(d => (
                        <button key={d} onClick={() => setNewStatus(d)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: newStatus === d ? DIFFICULTY_COLORS[d] + "20" : "var(--panel-hover)",
                            border: `1px solid ${newStatus === d ? DIFFICULTY_COLORS[d] + "50" : "var(--border-strong)"}`,
                            color: newStatus === d ? DIFFICULTY_COLORS[d] : "var(--text-muted)",
                          }}>{d}</button>
                      ))}
                    </div>
                  </div>
                )}
                {tracker.hasUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>URL</Label>
                    <Input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="border-[var(--border-strong)] text-[var(--text-heading)] bg-[var(--panel-hover)]" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Notes</Label>
                  <Input placeholder="Optional notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="border-[var(--border-strong)] text-[var(--text-heading)] bg-[var(--panel-hover)]" />
                </div>
              </>
            )}

            <Button onClick={handleAddItem} disabled={!newItemName.trim()} className="w-full bg-primary hover:bg-primary/90 mt-2">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Category Dialog */}
      <Dialog open={!!editCatId} onOpenChange={o => { if (!o) setEditCatId(null); }}>
        <DialogContent className="max-w-xs" style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <DialogHeader><DialogTitle className="text-[var(--text-heading)]">Rename Category</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input value={editCatName} onChange={e => setEditCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRenameCategory()} className="border-[var(--border-strong)] text-[var(--text-heading)] bg-[var(--panel-hover)]" autoFocus />
            <Button onClick={handleRenameCategory} className="w-full bg-primary hover:bg-primary/90">Rename</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Item Dialog */}
      <Dialog open={!!moveItem} onOpenChange={o => { if (!o) { setMoveItem(null); setDestCatId(""); } }}>
        <DialogContent className="max-w-xs" style={{ background: "var(--panel)", borderColor: "var(--border-s)" }}>
          <DialogHeader><DialogTitle className="text-[var(--text-heading)]">Move {moveItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Label className="text-sm" style={{ color: "var(--text-secondary)" }}>Move to category</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {tracker.categories.filter(c => c.id !== moveItem?.catId).map(c => (
                <button key={c.id} onClick={() => setDestCatId(c.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: destCatId === c.id ? "var(--primary)/10" : "var(--panel-hover)",
                    border: `1px solid ${destCatId === c.id ? "var(--primary)/40" : "var(--border-strong)"}`,
                    color: destCatId === c.id ? "var(--primary)" : "var(--text-muted)",
                  }}>
                  <span className="text-sm font-medium">{c.name}</span>
                </button>
              ))}
              {tracker.categories.filter(c => c.id !== moveItem?.catId).length === 0 && (
                <p className="text-xs italic" style={{ color: "var(--text-faint)" }}>No other categories exist.</p>
              )}
            </div>
            <Button onClick={handleMoveItem} disabled={!destCatId} className="w-full bg-primary hover:bg-primary/90 mt-2">
              Move
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
