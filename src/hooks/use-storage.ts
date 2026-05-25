import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';

export function useStore<T>(key: string, getter: () => T) {
  const [data, setData] = useState<T>(getter());

  useEffect(() => {
    const handleStorageChange = () => setData(getter());
    window.addEventListener(`storage:${key}`, handleStorageChange);
    window.addEventListener("storage:cleared", handleStorageChange);
    return () => {
      window.removeEventListener(`storage:${key}`, handleStorageChange);
      window.removeEventListener("storage:cleared", handleStorageChange);
    };
  }, [key, getter]);

  return data;
}

export function useUserPrefs() {
  return useStore("user_prefs", storage.getUserPrefs);
}

export function useHealthTargets() {
  return useStore("health_targets", storage.getTargets);
}

export function useDailyLog(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const logs = useStore("daily_logs", storage.getDailyLogs);
  return logs[dateStr] || { water: 0, calories: 0, protein: 0, sleep: 0, completedGoals: [] };
}

export function useGoals() {
  return useStore("goals_config", storage.getGoals);
}

export function useSchedule() {
  return useStore("gym_schedule", storage.getSchedule);
}

export function useWeightLogs() {
  return useStore("weight_logs", storage.getWeightLogs);
}

export function useLifts() {
  return useStore("lift_prs", storage.getLifts);
}
