import { supabase } from './supabase';
import { storage } from './storage';

// Get the authenticated user ID
async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// Push all local data to Supabase
export async function pushDataToCloud() {
  const userId = await getUserId();
  if (!userId) return;

  const data = {
    goals_config: storage.getGoals(),
    gym_schedule: storage.getSchedule(),
    daily_logs: storage.getDailyLogs(),
    weight_logs: storage.getWeightLogs(),
    health_targets: storage.getTargets(),
    user_prefs: storage.getUserPrefs(),
    trackers: storage.getTrackers(),
  };

  const { error } = await supabase
    .from('sync_data')
    .upsert({ id: userId, data, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Failed to push data to cloud:", error);
  } else {
    console.log("Successfully synced to cloud!");
  }
}

// Pull data from Supabase and overwrite local data
export async function pullDataFromCloud(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from('sync_data')
    .select('data')
    .eq('id', userId)
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
  if (cloudData.trackers) storage.setTrackers(cloudData.trackers);
  if (cloudData.lift_prs) localStorage.setItem("lift_prs", JSON.stringify(cloudData.lift_prs));
  if (cloudData.dsa_problems) localStorage.setItem("dsa_problems", JSON.stringify(cloudData.dsa_problems));

  return true;
}

// Debounce helper for pushing data automatically when things change locally
let pushTimeout: ReturnType<typeof setTimeout> | null = null;
export function triggerCloudPush() {
  if (pushTimeout) clearTimeout(pushTimeout);
  pushTimeout = setTimeout(async () => {
    const userId = await getUserId();
    if (userId) pushDataToCloud();
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
    "trackers"
  ];
  
  storageKeys.forEach(key => {
    window.addEventListener(`storage:${key}`, () => {
      triggerCloudPush();
    });
  });
  
  // Try to push immediately on startup if we have a sync code just in case
  triggerCloudPush();
}
