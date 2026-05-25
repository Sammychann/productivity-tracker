import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, User, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage, DEFAULT_SCHEDULE } from "@/lib/storage";
import { pullDataFromCloud } from "@/lib/sync";
import { toast } from "sonner";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const inputCls = "border-[#222] text-white placeholder:text-[#333] focus:border-primary/50 h-11";
const inputStyle = { background: "#161616" };

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [height, setHeight] = useState("");
  const [calories, setCalories] = useState("2500");
  const [protein, setProtein] = useState("150");
  const [water, setWater] = useState("8");
  const [sleep, setSleep] = useState("8");
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [syncCode, setSyncCode] = useState("");

  const steps = [
    { icon: User, title: "Welcome", sub: "Let's get you set up" },
    { icon: Target, title: "Your Targets", sub: "Set your daily goals" },
    { icon: Calendar, title: "Your Week", sub: "Plan your training schedule" },
  ];

  const finish = () => {
    storage.setUserPrefs({ name: name || "Athlete", weighInDay: "mon", height: height ? parseFloat(height) : undefined, weightUnit });
    storage.setTargets({ calories: parseInt(calories) || 2500, protein: parseInt(protein) || 150, water: parseInt(water) || 8, sleep: parseInt(sleep) || 8 });
    storage.setSchedule(schedule);
    onComplete();
  };

  const next = () => step === steps.length - 1 ? finish() : setStep(s => s + 1);
  const canProceed = step === 0 ? name.trim().length > 0 : true;

  const handleSync = async () => {
    if (syncCode.length !== 6) {
      toast.error("Please enter a valid 6-character code");
      return;
    }
    toast.loading("Pulling data...", { id: "onboard-sync" });
    const success = await pullDataFromCloud(syncCode);
    if (success) {
      toast.success("Device linked! Data synced.", { id: "onboard-sync" });
      onComplete(); // Skip the rest of onboarding and load dashboard
      setTimeout(() => window.location.reload(), 500); // Reload to ensure all states pick up the new data
    } else {
      toast.error("Failed to find data for that code.", { id: "onboard-sync" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0d0d0d" }}>
      <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl p-7" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
        {/* Step bar */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? "#6366f1" : "#1d1d1d" }} />
          ))}
        </div>

        {/* Step header */}
        <div className="mb-7">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            {(() => { const Icon = steps[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{steps[step].title}</h2>
          <p className="text-sm mt-1" style={{ color: "#555" }}>{steps[step].sub}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: "#aaa" }}>Your name</Label>
                <Input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && canProceed && next()}
                  className={inputCls} style={inputStyle} autoFocus />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: "#aaa" }}>Weight unit</Label>
                <div className="flex gap-2">
                  {(["kg", "lbs"] as const).map(u => (
                    <button key={u} onClick={() => setWeightUnit(u)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: weightUnit === u ? "#6366f115" : "#161616",
                        border: `1px solid ${weightUnit === u ? "#6366f140" : "#222"}`,
                        color: weightUnit === u ? "#818cf8" : "#444",
                      }}>{u}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: "#aaa" }}>
                  Height (cm) <span style={{ color: "#444" }}>— for BMI</span>
                </Label>
                <Input type="number" placeholder="e.g. 175" value={height} onChange={e => setHeight(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {[
                { label: "Calories (kcal)", val: calories, set: setCalories },
                { label: "Protein (g)", val: protein, set: setProtein },
                { label: "Water (glasses)", val: water, set: setWater },
                { label: "Sleep (hrs)", val: sleep, set: setSleep },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: "#aaa" }}>{label}</Label>
                  <Input type="number" value={val} onChange={e => set(e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-9 text-xs font-bold uppercase shrink-0" style={{ color: "#444" }}>{DAY_LABELS[day]}</span>
                  <Input value={schedule[day]} onChange={e => setSchedule(s => ({ ...s, [day]: e.target.value }))}
                    className="flex-1 h-9 border-[#222] text-white text-sm" style={{ background: "#161616" }} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={next} disabled={!canProceed} className="w-full mt-7 bg-primary hover:bg-primary/90 font-semibold">
          {step === steps.length - 1 ? "Get started" : "Continue"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-6 border-t border-[#222]">
            <Label className="text-sm font-medium mb-3 block" style={{ color: "#aaa" }}>Already have a Sync Code?</Label>
            <div className="flex gap-2">
              <Input placeholder="6-digit code" value={syncCode} onChange={e => setSyncCode(e.target.value.toUpperCase())} maxLength={6} className={inputCls + " font-mono uppercase tracking-widest"} style={inputStyle} />
              <Button onClick={handleSync} className="bg-[#1d1d1d] text-white hover:bg-[#2a2a2a] border border-[#333]">Sync</Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
