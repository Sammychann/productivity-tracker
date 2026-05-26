import { Link, useLocation } from "wouter";
import { LayoutDashboard, Target, Calendar, Heart, Scale, Settings, Trophy, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/lifts", label: "Lifts", icon: Trophy },
  { href: "/dsa", label: "DSA", icon: Code2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Mobile nav: first 7 items (drop Settings — accessible from sidebar on desktop)
const mobileNav = navItems.slice(0, 7);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen" style={{ background: "#0d0d0d" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-14 xl:w-52 shrink-0 fixed left-0 top-0 h-full z-40"
        style={{ background: "#0a0a0a", borderRight: "1px solid #1a1a1a" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 xl:px-5 h-14"
          style={{ borderBottom: "1px solid #1a1a1a" }}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden xl:block text-sm font-bold text-white tracking-tight">FitOS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 pt-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  active ? "text-white" : "text-[#555] hover:text-[#888] hover:bg-white/[0.03]"
                )}
                  style={active ? { background: "#1a1a1a" } : {}}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden xl:block text-sm font-medium">{label}</span>
                  {active && <div className="hidden xl:block ml-auto w-1 h-1 rounded-full bg-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-14 xl:ml-52 min-h-screen pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-2"
        style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a" }}>
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors",
                active ? "text-white" : "text-[#555]"
              )}>
                <Icon className="w-4.5 h-4.5" />
                <span className="text-[9px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
