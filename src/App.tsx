import { Switch, Route, Router as WouterRouter } from "wouter";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import Dashboard from "@/pages/Dashboard";
import DailyGoals from "@/pages/DailyGoals";
import WeeklySchedule from "@/pages/WeeklySchedule";
import HealthTracker from "@/pages/HealthTracker";
import WeightTracker from "@/pages/WeightTracker";
import Trackers from "./pages/Trackers";
import TrackerDetail from "./pages/TrackerDetail";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { pullDataFromCloud, pushDataToCloud } from "@/lib/sync";
import { storage } from "@/lib/storage";
import { useUserPrefs } from "@/hooks/use-storage";

const queryClient = new QueryClient();

/** Apply theme class to <html> reactively */
function ThemeApplier() {
  const prefs = useUserPrefs();
  useEffect(() => {
    const theme = prefs?.theme || "noir";
    document.documentElement.classList.remove("theme-noir", "theme-floral");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [prefs?.theme]);
  return null;
}

/**
 * USER FLOW:
 * 1. App opens → "Loading..." while we check auth
 * 2. No session → Login/Signup screen
 * 3. Session exists, cloud has data → pull data, skip onboarding → Dashboard
 * 4. Session exists, cloud empty, local data exists → push to cloud → Dashboard
 * 5. Session exists, cloud empty, no local data → Onboarding → finish → push to cloud → Dashboard
 */
function AppInner() {
  const [session, setSession] = useState<any>(undefined); // undefined = still loading
  const [ready, setReady] = useState(false); // true once auth + data sync is done
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleSession = async (sess: any) => {
      if (!mounted) return;

      if (!sess) {
        // Not logged in → show Auth screen
        setSession(null);
        setReady(true);
        return;
      }

      setSession(sess);

      // Try pulling cloud data
      const hasCloudData = await pullDataFromCloud();

      if (hasCloudData) {
        // Cloud had data → we've loaded it into localStorage → go to dashboard
        setNeedsOnboarding(false);
      } else if (storage.getUserPrefs()) {
        // No cloud data but local data exists (first login on this device with existing data)
        // Push local data to cloud and go to dashboard
        await pushDataToCloud();
        setNeedsOnboarding(false);
      } else {
        // No cloud data, no local data → brand new user, needs onboarding
        setNeedsOnboarding(true);
      }

      if (mounted) setReady(true);
    };

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Reset state and re-run the flow
      setReady(false);
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleOnboardingComplete = async () => {
    // User just finished onboarding → push their new data to the cloud
    await pushDataToCloud();
    setNeedsOnboarding(false);
  };

  // Still checking auth or syncing data
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p style={{ color: "var(--text-dim)" }} className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show Login/Signup
  if (!session) {
    return <Auth />;
  }

  // Logged in but no data anywhere → Onboarding
  if (needsOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Logged in and data loaded → Dashboard
  return (
    <>
      <ThemeApplier />
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/goals" component={DailyGoals} />
          <Route path="/schedule" component={WeeklySchedule} />
          <Route path="/health" component={HealthTracker} />
          <Route path="/weight" component={WeightTracker} />
          <Route path="/trackers" component={Trackers} />
          <Route path="/trackers/:id" component={TrackerDetail} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppInner />
        </WouterRouter>
        <Toaster
          toastOptions={{
            style: {
              background: "var(--panel)",
              border: "1px solid var(--border-s)",
              color: "var(--text-heading)",
            },
          }}
        />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
