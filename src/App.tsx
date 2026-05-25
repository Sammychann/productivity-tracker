import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import { useUserPrefs } from "@/hooks/use-storage";
import Dashboard from "@/pages/Dashboard";
import DailyGoals from "@/pages/DailyGoals";
import WeeklySchedule from "@/pages/WeeklySchedule";
import HealthTracker from "@/pages/HealthTracker";
import WeightTracker from "@/pages/WeightTracker";
import LiftTracker from "@/pages/LiftTracker";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { pullDataFromCloud } from "@/lib/sync";
import { storage } from "@/lib/storage";
import Auth from "@/pages/Auth";

const queryClient = new QueryClient();

function AppInner() {
  const userPrefs = useUserPrefs();
  const [onboardingDone, setOnboardingDone] = useState(!!userPrefs);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        pullDataFromCloud().then(() => {
          setOnboardingDone(!!storage.getUserPrefs());
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAuthLoading(true);
        pullDataFromCloud().then(() => {
          setOnboardingDone(!!storage.getUserPrefs());
          setAuthLoading(false);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
        <p className="text-white/50 text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={DailyGoals} />
        <Route path="/schedule" component={WeeklySchedule} />
        <Route path="/health" component={HealthTracker} />
        <Route path="/weight" component={WeightTracker} />
        <Route path="/lifts" component={LiftTracker} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
          theme="dark"
          toastOptions={{
            style: {
              background: "#111",
              border: "1px solid #1d1d1d",
              color: "#fff",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
