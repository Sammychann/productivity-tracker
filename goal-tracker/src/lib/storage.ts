import { z } from "zod";

export const GoalConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  target: z.number(),
  icon: z.string(),
  color: z.string(),
});
export type GoalConfig = z.infer<typeof GoalConfigSchema>;

export const GymScheduleSchema = z.object({
  mon: z.string(),
  tue: z.string(),
  wed: z.string(),
  thu: z.string(),
  fri: z.string(),
  sat: z.string(),
  sun: z.string(),
});
export type GymSchedule = z.infer<typeof GymScheduleSchema>;

export const DailyLogSchema = z.object({
  water: z.number(),
  calories: z.number(),
  protein: z.number(),
  sleep: z.number(),
  sleepQuality: z.enum(["poor", "okay", "good", "great"]).optional(),
  completedGoals: z.array(z.string()),
});
export type DailyLog = z.infer<typeof DailyLogSchema>;

export const WeightLogSchema = z.object({
  date: z.string(),
  weight: z.number(),
});
export type WeightLog = z.infer<typeof WeightLogSchema>;

export const HealthTargetsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  water: z.number(),
  sleep: z.number(),
});
export type HealthTargets = z.infer<typeof HealthTargetsSchema>;

export const UserPrefsSchema = z.object({
  name: z.string(),
  weighInDay: z.string(),
  height: z.number().optional(),
  weightUnit: z.enum(["kg", "lbs"]),
});
export type UserPrefs = z.infer<typeof UserPrefsSchema>;

export const LiftRecordSchema = z.object({
  date: z.string(),
  weight: z.number(),
  reps: z.number(),
  notes: z.string().optional(),
});
export type LiftRecord = z.infer<typeof LiftRecordSchema>;

export const LiftEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["Push", "Pull", "Legs", "Core", "Cardio"]),
  records: z.array(LiftRecordSchema),
});
export type LiftEntry = z.infer<typeof LiftEntrySchema>;

export const LIFT_CATEGORIES = ["Push", "Pull", "Legs", "Core", "Cardio"] as const;

export const DEFAULT_GOALS: GoalConfig[] = [
  { id: "read", name: "Reading", unit: "pages", target: 10, icon: "book-open", color: "#6366f1" },
  { id: "steps", name: "Steps", unit: "steps", target: 10000, icon: "footprints", color: "#10b981" },
];

export const DEFAULT_SCHEDULE: GymSchedule = {
  mon: "Chest Day",
  tue: "Back & Biceps",
  wed: "Rest",
  thu: "Legs",
  fri: "Shoulders & Triceps",
  sat: "Full Body / Cardio",
  sun: "Rest",
};

export const DEFAULT_TARGETS: HealthTargets = {
  calories: 2500,
  protein: 150,
  water: 8,
  sleep: 8,
};

export const DEFAULT_LIFTS: LiftEntry[] = [
  { id: "bench", name: "Bench Press", category: "Push", records: [] },
  { id: "ohp", name: "Overhead Press", category: "Push", records: [] },
  { id: "deadlift", name: "Deadlift", category: "Pull", records: [] },
  { id: "row", name: "Barbell Row", category: "Pull", records: [] },
  { id: "squat", name: "Back Squat", category: "Legs", records: [] },
  { id: "rdl", name: "Romanian Deadlift", category: "Legs", records: [] },
];

const EMPTY_LOG: DailyLog = { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] };

const get = <T,>(key: string, def: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
};

const set = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(`storage:${key}`));
  } catch { /* silent */ }
};

export const storage = {
  getGoals: () => get<GoalConfig[]>("goals_config", DEFAULT_GOALS),
  setGoals: (goals: GoalConfig[]) => set("goals_config", goals),

  getSchedule: () => get<GymSchedule>("gym_schedule", DEFAULT_SCHEDULE),
  setSchedule: (schedule: GymSchedule) => set("gym_schedule", schedule),

  getDailyLogs: () => get<Record<string, DailyLog>>("daily_logs", {}),
  setDailyLogs: (logs: Record<string, DailyLog>) => set("daily_logs", logs),
  getDailyLog: (dateStr: string): DailyLog => {
    const logs = storage.getDailyLogs();
    return Object.assign({}, EMPTY_LOG, logs[dateStr] || {});
  },
  updateDailyLog: (dateStr: string, update: Partial<DailyLog>) => {
    const logs = storage.getDailyLogs();
    logs[dateStr] = Object.assign({}, EMPTY_LOG, logs[dateStr] || {}, update);
    storage.setDailyLogs(logs);
  },

  getWeightLogs: () => get<WeightLog[]>("weight_logs", []),
  setWeightLogs: (logs: WeightLog[]) => set("weight_logs", logs),

  getTargets: () => get<HealthTargets>("health_targets", DEFAULT_TARGETS),
  setTargets: (targets: HealthTargets) => set("health_targets", targets),

  getUserPrefs: () => get<UserPrefs | null>("user_prefs", null),
  setUserPrefs: (prefs: UserPrefs) => set("user_prefs", prefs),

  getLifts: () => get<LiftEntry[]>("lift_prs", DEFAULT_LIFTS),
  setLifts: (lifts: LiftEntry[]) => set("lift_prs", lifts),

  clearAll: () => {
    ["goals_config", "gym_schedule", "daily_logs", "weight_logs", "health_targets", "user_prefs", "lift_prs"]
      .forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event("storage:cleared"));
  },
};
