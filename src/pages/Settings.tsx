import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Save, LogOut } from "lucide-react";
import { storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { useHealthTargets, useUserPrefs } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const WEEKDAYS = [
  { value: "mon", label: "Monday" }, { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" }, { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" }, { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 space-y-5" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{title}</p>
      {children}
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-white/70">{label}</Label>
      {children}
    </div>
  );
}

const inputCls = "bg-[var(--panel-hover)] border-[var(--border-strong)] text-white placeholder:text-[var(--text-muted)] focus:border-primary/50";

export default function Settings() {
  const targets = useHealthTargets();
  const userPrefs = useUserPrefs();
  const [showReset, setShowReset] = useState(false);

  const [name, setName] = useState(userPrefs?.name ?? "");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(userPrefs?.weightUnit ?? "kg");
  const [height, setHeight] = useState(String(userPrefs?.height ?? ""));
  const [weighInDay, setWeighInDay] = useState(userPrefs?.weighInDay ?? "mon");
  const [theme, setTheme] = useState<"noir" | "floral">(userPrefs?.theme ?? "noir");

  const [calories, setCalories] = useState(String(targets?.calories ?? 2500));
  const [protein, setProtein] = useState(String(targets?.protein ?? 150));
  const [water, setWater] = useState(String(targets?.water ?? 8));
  const [sleep, setSleep] = useState(String(targets?.sleep ?? 8));

  const saveProfile = () => {
    storage.setUserPrefs({ name: name || "Athlete", weighInDay, height: height ? parseFloat(height) : undefined, weightUnit, theme });
    toast.success("Profile saved");
  };

  const saveTargets = () => {
    storage.setTargets({ calories: parseInt(calories) || 2500, protein: parseInt(protein) || 150, water: parseInt(water) || 8, sleep: parseInt(sleep) || 8 });
    toast.success("Targets saved");
  };

  const reset = () => {
    storage.clearAll();
    toast.success("Data reset");
    setShowReset(false);
    setTimeout(() => window.location.reload(), 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    storage.clearAll();
    window.location.href = "/";
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-[var(--text-heading)] tracking-tight">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>Profile & preferences</p>
      </motion.div>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Name">
          <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
            className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight unit">
            <Select value={weightUnit} onValueChange={v => setWeightUnit(v as "kg" | "lbs")}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent style={{ background: "var(--panel)", borderColor: "var(--border-strong)" }}>
                <SelectItem value="kg" className="text-[var(--text-heading)] focus:bg-white/[0.06]">kg</SelectItem>
                <SelectItem value="lbs" className="text-[var(--text-heading)] focus:bg-white/[0.06]">lbs</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Height (cm)">
            <Input type="number" placeholder="e.g. 175" value={height} onChange={e => setHeight(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weigh-in day">
            <Select value={weighInDay} onValueChange={setWeighInDay}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent style={{ background: "var(--panel)", borderColor: "var(--border-strong)" }}>
                {WEEKDAYS.map(d => <SelectItem key={d.value} value={d.value} className="text-[var(--text-heading)] focus:bg-white/[0.06]">{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Theme">
            <Select value={theme} onValueChange={v => setTheme(v as "noir" | "floral")}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent style={{ background: "var(--panel)", borderColor: "var(--border-strong)" }}>
                <SelectItem value="noir" className="text-[var(--text-heading)] focus:bg-white/[0.06]">Noir (Dark)</SelectItem>
                <SelectItem value="floral" className="text-[var(--text-heading)] focus:bg-white/[0.06]">Floral (Light)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button onClick={saveProfile} className="w-full gap-2 bg-primary text-[var(--primary-foreground)] hover:bg-primary/90">
          <Save className="w-4 h-4" /> Save Profile
        </Button>
      </Section>

      {/* Daily Targets */}
      <Section title="Daily Targets">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Calories (kcal)", val: calories, set: setCalories },
            { label: "Protein (g)", val: protein, set: setProtein },
            { label: "Water (glasses)", val: water, set: setWater },
            { label: "Sleep (hrs)", val: sleep, set: setSleep },
          ].map(({ label, val, set }) => (
            <Field key={label} label={label}>
              <Input type="number" value={val} onChange={e => set(e.target.value)} className={inputCls} />
            </Field>
          ))}
        </div>
        <Button onClick={saveTargets} className="w-full gap-2 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4" /> Save Targets
        </Button>
      </Section>

      {/* Account Settings */}
      <Section title="Account">
        <Button onClick={handleLogout} variant="outline" className="w-full bg-[var(--panel-hover)] border-[var(--border-strong)] text-white hover:bg-[var(--border-strong)]">
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </Section>

      {/* Danger */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-6" style={{ border: "1px solid #2a1515" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-dim)" }}>Danger Zone</p>
        <Button onClick={() => setShowReset(true)} variant="outline"
          className="w-full border-red-900/50 text-red-500 hover:bg-red-950/30 hover:border-red-800">
          <Trash2 className="w-4 h-4 mr-2" /> Reset All Data
        </Button>
      </motion.div>

      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent style={{ background: "var(--panel)", borderColor: "var(--border-strong)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reset all data?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-tertiary)" }}>
              This permanently deletes all goals, logs, and preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "var(--panel-hover)", borderColor: "var(--border-strong)", color: "#aaa" }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={reset} className="bg-destructive text-white hover:bg-destructive/90">Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
