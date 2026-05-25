import { supabase } from './supabase';
import { storage } from './storage';

export const SYNC_CODE_KEY = "sync_code";

export function getSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY);
}

export function setSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_KEY, code);
}

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Push all local data to Supabase
export async function pushDataToCloud() {
  const code = getSyncCode();
  if (!code) return;

  const data = {
    goals_config: storage.getGoals(),
    gym_schedule: storage.getSchedule(),
    daily_logs: storage.getDailyLogs(),
    weight_logs: storage.getWeightLogs(),
    health_targets: storage.getTargets(),
    user_prefs: storage.getUserPrefs(),
    lift_prs: storage.getLifts(),
  };

  const { error } = await supabase
    .from('sync_data')
    .upsert({ id: code, data, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Failed to push data to cloud:", error);
  } else {
    console.log("Successfully synced to cloud!");
  }
}

// Pull data from Supabase and overwrite local data
export async function pullDataFromCloud(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('sync_data')
    .select('data')
    .eq('id', code)
    .single();

  if (error || !data) {
    console.error("Failed to pull data from cloud:", error);
    return false;
  }

  const cloudData = data.data as any;

  if (cloudData.goals_config) storage.setGoals(cloudData.goals_config);
  if (cloudData.gym_schedule) storage.setSchedule(cloudData.gym_schedule);
  if (cloudData.daily_logs) storage.setDailyLogs(cloudData.daily_logs);
  if (cloudData.weight_logs) storage.setWeightLogs(cloudData.weight_logs);
  if (cloudData.health_targets) storage.setTargets(cloudData.health_targets);
  if (cloudData.user_prefs) storage.setUserPrefs(cloudData.user_prefs);
  if (cloudData.lift_prs) storage.setLifts(cloudData.lift_prs);

  setSyncCode(code);
  return true;
}

// Debounce helper for pushing data automatically when things change locally
let pushTimeout: ReturnType<typeof setTimeout> | null = null;
export function triggerCloudPush() {
  if (!getSyncCode()) return;
  if (pushTimeout) clearTimeout(pushTimeout);
  pushTimeout = setTimeout(() => {
    pushDataToCloud();
  }, 2000); // 2 second debounce
}

// Listens to local storage changes and triggers push
export function initAutoSync() {
  const storageKeys = [
    "goals_config", 
    "gym_schedule", 
    "daily_logs", 
    "weight_logs", 
    "health_targets", 
    "user_prefs", 
    "lift_prs"
  ];
  
  storageKeys.forEach(key => {
    window.addEventListener(`storage:${key}`, () => {
      triggerCloudPush();
    });
  });
  
  // Try to push immediately on startup if we have a sync code just in case
  triggerCloudPush();
}
