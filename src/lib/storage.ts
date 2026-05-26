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

export const DayScheduleSchema = z.object({
  label: z.string(),
  categories: z.array(z.string()).default([]),
});
export type DaySchedule = z.infer<typeof DayScheduleSchema>;

export const GymScheduleSchema = z.object({
  mon: DayScheduleSchema,
  tue: DayScheduleSchema,
  wed: DayScheduleSchema,
  thu: DayScheduleSchema,
  fri: DayScheduleSchema,
  sat: DayScheduleSchema,
  sun: DayScheduleSchema,
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

// --- Unified Tracker System ---

export const TrackerRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  value1: z.number().optional(),
  value2: z.number().optional(),
  status: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});
export type TrackerRecord = z.infer<typeof TrackerRecordSchema>;

export const TrackerItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  records: z.array(TrackerRecordSchema),
});
export type TrackerItem = z.infer<typeof TrackerItemSchema>;

export const TrackerCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(TrackerItemSchema),
});
export type TrackerCategory = z.infer<typeof TrackerCategorySchema>;

export const TrackerSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  type: z.enum(["measurement", "completion"]),
  isActive: z.boolean(),
  metric1: z.string().optional(),
  metric2: z.string().optional(),
  hasDifficulty: z.boolean().optional(),
  hasUrl: z.boolean().optional(),
  categories: z.array(TrackerCategorySchema),
});
export type TrackerSection = z.infer<typeof TrackerSectionSchema>;

export const DEFAULT_TRACKERS: TrackerSection[] = [
  {
    id: "gym",
    name: "Gym",
    icon: "dumbbell",
    type: "measurement",
    isActive: true,
    metric1: "Weight",
    metric2: "Reps",
    categories: [
      {
        id: "push", name: "Push",
        items: [
          { id: "bench", name: "Bench Press", records: [] },
          { id: "ohp", name: "Overhead Press", records: [] }
        ]
      },
      {
        id: "pull", name: "Pull",
        items: [
          { id: "deadlift", name: "Deadlift", records: [] },
          { id: "row", name: "Barbell Row", records: [] }
        ]
      },
      {
        id: "legs", name: "Legs",
        items: [
          { id: "squat", name: "Back Squat", records: [] },
          { id: "rdl", name: "Romanian Deadlift", records: [] }
        ]
      }
    ]
  },
  {
    id: "dsa",
    name: "DSA",
    icon: "code",
    type: "completion",
    isActive: true,
    hasDifficulty: true,
    hasUrl: true,
    categories: [
      { id: "arrays", name: "Arrays", items: [] },
      { id: "strings", name: "Strings", items: [] },
      { id: "linked-lists", name: "Linked Lists", items: [] },
      { id: "trees", name: "Trees", items: [] },
      { id: "graphs", name: "Graphs", items: [] },
      { id: "dp", name: "Dynamic Programming", items: [] },
      { id: "stacks-queues", name: "Stacks & Queues", items: [] },
      { id: "hashmaps", name: "Hash Maps", items: [] },
    ]
  }
];

export const DEFAULT_GOALS: GoalConfig[] = [
  { id: "read", name: "Reading", unit: "pages", target: 10, icon: "book-open", color: "#6366f1" },
  { id: "steps", name: "Steps", unit: "steps", target: 10000, icon: "footprints", color: "#10b981" },
];

export const DEFAULT_SCHEDULE: GymSchedule = {
  mon: { label: "Chest Day", categories: ["Push"] },
  tue: { label: "Back & Biceps", categories: ["Pull"] },
  wed: { label: "Rest", categories: [] },
  thu: { label: "Legs", categories: ["Legs"] },
  fri: { label: "Shoulders & Triceps", categories: ["Push"] },
  sat: { label: "Full Body / Cardio", categories: ["Push", "Pull", "Legs", "Core", "Cardio"] },
  sun: { label: "Rest", categories: [] },
};

export const DEFAULT_TARGETS: HealthTargets = {
  calories: 2500,
  protein: 150,
  water: 8,
  sleep: 8,
};

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

  getSchedule: (): GymSchedule => {
    const raw = get<any>("gym_schedule", null);
    if (raw && typeof raw.mon === "string") {
      const migrated: any = {};
      for (const key of Object.keys(raw)) {
        migrated[key] = { label: raw[key], categories: [] };
      }
      return migrated as GymSchedule;
    }
    return raw || DEFAULT_SCHEDULE;
  },
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

  getTrackers: (): TrackerSection[] => {
    let trackers = get<TrackerSection[] | null>("trackers", null);
    if (!trackers) {
      // Migrate old data
      const oldLifts = get<any[] | null>("lift_prs", null);
      const oldDSA = get<any[] | null>("dsa_problems", null);
      trackers = JSON.parse(JSON.stringify(DEFAULT_TRACKERS)); // deep copy

      if (oldLifts) {
        const gym = trackers.find(t => t.id === "gym")!;
        gym.categories = [];
        const catMap = new Map<string, TrackerCategory>();
        for (const lift of oldLifts) {
          if (!catMap.has(lift.category)) {
            catMap.set(lift.category, { id: crypto.randomUUID(), name: lift.category, items: [] });
          }
          const cat = catMap.get(lift.category)!;
          cat.items.push({
            id: lift.id,
            name: lift.name,
            records: lift.records.map((r: any) => ({
              id: crypto.randomUUID(),
              date: r.date,
              value1: r.weight,
              value2: r.reps,
              notes: r.notes
            }))
          });
        }
        gym.categories = Array.from(catMap.values());
      }
      if (oldDSA) {
        const dsa = trackers.find(t => t.id === "dsa")!;
        dsa.categories = oldDSA.map(c => ({
          id: c.id,
          name: c.name,
          items: c.problems.map((p: any) => ({
            id: p.id,
            name: p.name,
            records: [{
              id: crypto.randomUUID(),
              date: p.date,
              status: p.difficulty,
              url: p.url,
              notes: p.notes
            }]
          }))
        }));
      }
      set("trackers", trackers);
    }
    return trackers;
  },
  setTrackers: (trackers: TrackerSection[]) => set("trackers", trackers),

  clearAll: () => {
    ["goals_config", "gym_schedule", "daily_logs", "weight_logs", "health_targets", "user_prefs", "trackers", "lift_prs", "lift_categories", "dsa_problems"]
      .forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event("storage:cleared"));
  },
};
