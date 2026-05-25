import { useMemo, useRef, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { useStore } from "@/hooks/use-storage";
import { storage } from "@/lib/storage";
import { useHealthTargets } from "@/hooks/use-storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WEEKS_TO_SHOW = 26; // Last 6 months

export function ActivityHeatmap() {
  const allLogs = useStore("daily_logs", storage.getDailyLogs);
  const targets = useHealthTargets();
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = targets ?? { calories: 2500, protein: 150, water: 8, sleep: 8 };

  // Calculate activity level 0-4 for a given day
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
    // End the grid on the end of the current week (Sunday or Saturday depending on locale, we'll use Monday-Sunday)
    // Actually, date-fns startOfWeek default is Sunday. Let's stick to Sunday-Saturday.
    const endOfCurrentWeek = endOfWeek(today);
    const startOfGrid = subDays(endOfCurrentWeek, (WEEKS_TO_SHOW * 7) - 1);
    
    // We need 7 rows (days of week) and WEEKS_TO_SHOW columns
    const columns: { dateStr: string; level: number }[][] = Array.from({ length: WEEKS_TO_SHOW }, () => []);
    const labels: { text: string; colIndex: number }[] = [];
    
    let currentDate = startOfGrid;
    let lastMonth = -1;

    for (let col = 0; col < WEEKS_TO_SHOW; col++) {
      for (let row = 0; row < 7; row++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        
        // Add month label if it's the first week of a new month
        const month = currentDate.getMonth();
        if (row === 0 && month !== lastMonth) {
          labels.push({ text: format(currentDate, "MMM"), colIndex: col });
          lastMonth = month;
        }

        // Only show future days in the current week as blank/disabled, but we can just use level 0
        const isFuture = currentDate > today;
        
        columns[col].push({
          dateStr,
          level: isFuture ? -1 : getActivityLevel(dateStr)
        });
        
        currentDate = subDays(currentDate, -1); // Add 1 day
      }
    }

    return { grid: columns, monthLabels: labels };
  }, [allLogs, targets]);

  // Scroll to the rightmost edge on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const getLevelColor = (level: number) => {
    switch (level) {
      case -1: return "transparent"; // Future days
      case 0: return "#161616";
      case 1: return "#10b98140";
      case 2: return "#10b98180";
      case 3: return "#10b981cc";
      case 4: return "#10b981";
      default: return "#161616";
    }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "#111", border: "1px solid #1d1d1d" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#444" }}>Consistency</p>
      </div>

      <div className="flex">
        {/* Day labels (Mon, Wed, Fri) */}
        <div className="flex flex-col justify-between pr-3 py-6 text-[9px] font-medium" style={{ color: "#555" }}>
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
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none" // IE
          }}>
          <div className="min-w-max relative pt-4">
            
            {/* Month labels */}
            {monthLabels.map((lbl, i) => (
              <span key={i} className="absolute top-0 text-[10px] font-medium" style={{ color: "#555", left: `${lbl.colIndex * 16}px` }}>
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
                              border: cell.level === 0 ? "1px solid #222" : "none"
                            }}
                          />
                        </TooltipTrigger>
                        {cell.level !== -1 && (
                          <TooltipContent side="top" className="text-xs" style={{ background: "#161616", border: "1px solid #222", color: "#ccc" }}>
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
