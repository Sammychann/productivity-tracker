import { useMemo, useRef, useEffect, useState } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import { useStore, useHealthTargets } from "@/hooks/use-storage";
import { storage } from "@/lib/storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";

export function ActivityHeatmap() {
  const allLogs = useStore("daily_logs", storage.getDailyLogs);
  const targets = useHealthTargets();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Extract all years that have data
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    Object.keys(allLogs).forEach(dateStr => {
      years.add(parseInt(dateStr.substring(0, 4)));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allLogs, currentYear]);

  const t = targets ?? { calories: 2500, protein: 150, water: 8, sleep: 8 };

  const getActivityLevel = (dateStr: string) => {
    const log = allLogs[dateStr];
    if (!log) return 0;
    
    let score = 0;
    if (log.completedGoals && log.completedGoals.length > 0) score++;
    if (log.protein >= t.protein) score++;
    if (log.water >= t.water) score++;
    if (log.calories >= t.calories) score++;
    
    return Math.min(score, 4);
  };

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    
    const gridStart = startOfWeek(yearStart);
    const gridEnd = endOfWeek(yearEnd);

    const columns: { dateStr: string; level: number }[][] = [];
    const labels: { text: string; colIndex: number }[] = [];
    
    let currentDate = gridStart;
    let colIndex = 0;
    let lastMonth = -1;

    while (currentDate <= gridEnd) {
      const col = [];
      for (let row = 0; row < 7; row++) {
        // Break if we somehow exceed the loop, though we go exactly week by week
        if (currentDate > gridEnd) break;

        const dateStr = format(currentDate, "yyyy-MM-dd");
        const month = currentDate.getMonth();
        
        if (row === 0 && month !== lastMonth) {
          // Avoid bunching labels up at the very start if Jan 1st is mid-week
          if (!(colIndex === 0 && currentDate.getDate() > 7)) {
            labels.push({ text: format(currentDate, "MMM"), colIndex });
            lastMonth = month;
          }
        }

        const isFuture = currentDate > today;
        const isWrongYear = currentDate.getFullYear() !== selectedYear;
        
        col.push({
          dateStr,
          level: (isFuture || isWrongYear) ? -1 : getActivityLevel(dateStr)
        });
        
        currentDate = addDays(currentDate, 1);
      }
      columns.push(col);
      colIndex++;
    }

    return { grid: columns, monthLabels: labels };
  }, [allLogs, targets, selectedYear, currentYear]);

  // Scroll to the rightmost edge on mount or year change
  useEffect(() => {
    if (scrollRef.current) {
      // Small delay to allow render
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }, 50);
    }
  }, [selectedYear]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case -1: return "transparent"; // Future or out-of-year days
      case 0: return "var(--panel-hover)";
      case 1: return "#10b98140";
      case 2: return "#10b98180";
      case 3: return "#10b981cc";
      case 4: return "#10b981";
      default: return "var(--panel-hover)";
    }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--panel)", border: "1px solid var(--border-s)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Consistency</p>
        
        {/* Sleek Native Select for Year */}
        <div className="relative">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="appearance-none bg-transparent text-[11px] font-semibold tracking-wider outline-none cursor-pointer pr-4"
            style={{ color: "var(--text-secondary)", WebkitAppearance: "none" }}
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr} style={{ background: "var(--panel)", color: "var(--text-heading)" }}>
                {yr}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} />
        </div>
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-between pr-3 py-6 text-[9px] font-medium shrink-0" style={{ color: "var(--text-dim)" }}>
          <span className="h-3 leading-3">Sun</span>
          <span className="h-3 leading-3">Tue</span>
          <span className="h-3 leading-3">Thu</span>
          <span className="h-3 leading-3">Sat</span>
        </div>

        {/* Scrollable grid */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden pb-2 snap-x scrollbar-hide"
          style={{ 
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none", 
            msOverflowStyle: "none" 
          }}>
          <div className="min-w-max relative pt-4">
            
            {/* Month labels */}
            {monthLabels.map((lbl, i) => (
              <span key={i} className="absolute top-0 text-[10px] font-medium" style={{ color: "var(--text-dim)", left: `${lbl.colIndex * 16}px` }}>
                {lbl.text}
              </span>
            ))}

            <TooltipProvider delayDuration={100}>
              <div className="flex gap-1">
                {grid.map((col, cIdx) => (
                  <div key={cIdx} className="flex flex-col gap-1 snap-end">
                    {col.map((cell, rIdx) => (
                      <Tooltip key={cell.dateStr}>
                        <TooltipTrigger asChild>
                          <div 
                            className="w-3 h-3 rounded-[3px] transition-colors"
                            style={{ 
                              background: getLevelColor(cell.level),
                              border: cell.level === 0 ? "1px solid var(--border-strong)" : "none"
                            }}
                          />
                        </TooltipTrigger>
                        {cell.level !== -1 && (
                          <TooltipContent side="top" className="text-xs" style={{ background: "var(--panel-hover)", border: "1px solid var(--border-strong)", color: "#ccc" }}>
                            {format(new Date(cell.dateStr + "T12:00:00"), "MMM d, yyyy")}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>

          </div>
        </div>
      </div>
    </div>
  );
}
