import { Link, useLocation } from "wouter";
import { LayoutDashboard, Target, Calendar, Heart, Scale, Settings, Trophy, Code2, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/trackers", label: "Trackers", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Mobile nav: first 6 items (drop Settings — accessible from sidebar on desktop)
const mobileNav = navItems.slice(0, 6);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-14 xl:w-52 shrink-0 fixed left-0 top-0 h-full z-40"
        style={{ background: "var(--panel-deep)", borderRight: "1px solid var(--border-light)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 xl:px-5 h-14"
          style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Swords className="w-3.5 h-3.5 text-[var(--primary-foreground)]" />
          </div>
          <span className="hidden xl:block text-sm font-bold text-[var(--text-heading)] tracking-tight">Bankai</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 pt-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  active ? "text-[var(--text-heading)]" : "text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
                )}
                  style={active ? { background: "var(--border-light)" } : {}}>
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
        <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-[11px] font-semibold text-center tracking-wide shadow-sm flex items-center justify-center gap-2">
          <span className="flex items-center justify-center bg-white/20 rounded-full w-4 h-4 text-[9px] font-black">!</span>
          New: Floral Theme & Daily Notes added! Toggle your theme in Settings.
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-2"
        style={{ background: "var(--panel-deep)", borderTop: "1px solid var(--border-light)" }}>
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer",
                active ? "text-[var(--text-heading)]" : "text-[var(--text-dim)]"
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
