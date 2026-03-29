// =============================================================
// HEATMAP CALENDAR - GitHub-style expense submission heatmap
// Click day → filter; hover → tooltip; color = amount intensity
// =============================================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfYear, eachDayOfInterval, endOfYear, getDay, isSameDay, startOfWeek, addDays } from 'date-fns';

interface DayData {
  date: Date;
  amount: number;
  count: number;
  expenses: string[];
}

interface HeatmapCalendarProps {
  data?: DayData[];
  onDayClick?: (date: Date) => void;
  year?: number;
}

// Generate mock heatmap data for the current year
function generateMockData(): DayData[] {
  const today = new Date();
  const start = startOfYear(today);
  const end = endOfYear(today);
  const days = eachDayOfInterval({ start, end });
  
  return days.map(date => {
    // Create realistic patterns — weekdays more active, some clusters
    const dow = getDay(date);
    const isWeekend = dow === 0 || dow === 6;
    const isFuture = date > today;
    
    if (isFuture || isWeekend || Math.random() > 0.55) {
      return { date, amount: 0, count: 0, expenses: [] };
    }
    
    const count = Math.floor(Math.random() * 4) + 1;
    const amount = Math.round((Math.random() * 800 + 50) * count);
    return {
      date,
      amount,
      count,
      expenses: Array.from({ length: count }, (_, i) => `Expense #${Math.floor(Math.random() * 9999)}`),
    };
  });
}

function getIntensity(amount: number, maxAmount: number): number {
  if (amount === 0) return 0;
  return Math.min(4, Math.ceil((amount / maxAmount) * 4));
}

const intensityColors = [
  'bg-white/[0.04] border-white/[0.06]',      // 0 — empty
  'bg-indigo-900/60 border-indigo-800/40',     // 1 — low
  'bg-indigo-700/70 border-indigo-600/50',     // 2 — medium
  'bg-indigo-500/80 border-indigo-400/60',     // 3 — high
  'bg-indigo-400 border-indigo-300/80',        // 4 — max
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  data,
  onDayClick,
}) => {
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);

  const mockData = useMemo(() => data || generateMockData(), [data]);

  const maxAmount = useMemo(
    () => Math.max(...mockData.map(d => d.amount), 1),
    [mockData]
  );

  const stats = useMemo(() => {
    const active = mockData.filter(d => d.amount > 0);
    return {
      totalAmount: active.reduce((s, d) => s + d.amount, 0),
      totalCount: active.reduce((s, d) => s + d.count, 0),
      activeDays: active.length,
      streak: (() => {
        let max = 0, cur = 0;
        for (const d of [...mockData].reverse()) {
          if (d.amount > 0) { cur++; max = Math.max(max, cur); }
          else cur = 0;
        }
        return max;
      })(),
    };
  }, [mockData]);

  // Build week grid: group days into columns (weeks)
  const weeks = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    // Start from the Monday of the first week of the year
    const gridStart = startOfWeek(yearStart, { weekStartsOn: 1 });
    const grid: DayData[][] = [];
    let current = gridStart;
    
    while (current <= endOfYear(today)) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = addDays(current, d);
        const found = mockData.find(m => isSameDay(m.date, dayDate));
        week.push(found || { date: dayDate, amount: 0, count: 0, expenses: [] });
      }
      grid.push(week);
      current = addDays(current, 7);
    }
    return grid;
  }, [mockData]);

  // Month label positions
  const monthPositions = useMemo(() => {
    const positions: { month: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        positions.push({ month: MONTHS[m], weekIdx: i });
        lastMonth = m;
      }
    });
    return positions;
  }, [weeks]);

  const handleDayClick = (day: DayData) => {
    if (day.amount === 0) return;
    setSelectedDay(prev => isSameDay(prev!, day.date) ? null : day.date);
    onDayClick?.(day.date);
  };

  const CELL = 10;
  const GAP = 2;
  const CELL_TOTAL = CELL + GAP;

  return (
    <div className="border border-white/5 bg-[#0d0d0d] rounded-2xl p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Expense Calendar</h3>
          <span className="text-xs text-zinc-600">{new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span>Less</span>
          <div className="flex gap-1">
            {intensityColors.map((cls, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-sm border ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Submitted', value: `$${(stats.totalAmount / 1000).toFixed(1)}k` },
          { label: 'Expenses', value: stats.totalCount.toString() },
          { label: 'Active Days', value: stats.activeDays.toString() },
          { label: 'Best Streak', value: `${stats.streak}d` },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-base font-bold text-indigo-400">{s.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid — scrollable on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ minWidth: weeks.length * CELL_TOTAL + 24 }}>
          {/* Month labels */}
          <div className="relative h-5 mb-1 ml-6">
            {monthPositions.map(({ month, weekIdx }) => (
              <span
                key={month}
                className="absolute text-[10px] text-zinc-600 font-medium"
                style={{ left: weekIdx * CELL_TOTAL }}
              >
                {month}
              </span>
            ))}
          </div>

          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1.5" style={{ gap: GAP }}>
              {DAYS.map((label, i) => (
                <div key={i} style={{ height: CELL, width: 20 }}
                  className="flex items-center justify-end">
                  <span className="text-[9px] text-zinc-700 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, di) => {
                    const intensity = getIntensity(day.amount, maxAmount);
                    const isSelected = selectedDay && isSameDay(selectedDay, day.date);
                    const isHovered = hoverDay && isSameDay(hoverDay, day.date);
                    const isFuture = day.date > new Date();

                    return (
                      <motion.div
                        key={di}
                        style={{ width: CELL, height: CELL, borderRadius: 2 }}
                        className={`border cursor-pointer transition-all ${
                          isFuture ? 'opacity-0 pointer-events-none' :
                          isSelected ? 'ring-1 ring-indigo-400 ring-offset-0 scale-110 ' + intensityColors[Math.max(intensity, 1)] :
                          intensityColors[intensity]
                        }`}
                        animate={{ scale: isHovered && !isFuture ? 1.3 : 1 }}
                        transition={{ duration: 0.1 }}
                        onMouseEnter={(e) => {
                          setHoverDay(day.date);
                          if (day.amount > 0) {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltip({ day, x: rect.left + CELL / 2, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => { setHoverDay(null); setTooltip(null); }}
                        onClick={() => handleDayClick(day)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-[#111] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 90, transform: 'translateX(-50%)' }}
          >
            <p className="text-xs font-bold text-white mb-1">
              {format(tooltip.day.date, 'EEEE, MMM d')}
            </p>
            <p className="text-xs text-indigo-400 font-mono font-semibold">
              ${tooltip.day.amount.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {tooltip.day.count} expense{tooltip.day.count !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (() => {
          const d = mockData.find(m => isSameDay(m.date, selectedDay));
          return d && d.amount > 0 ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-2">
                  {format(selectedDay, 'EEEE, MMMM d')} — ${d.amount.toLocaleString()} across {d.count} expenses
                </p>
                <div className="flex gap-2 flex-wrap">
                  {d.expenses.map((e, i) => (
                    <span key={i} className="text-[11px] bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-zinc-400">{e}</span>
                  ))}
                  <button onClick={() => setSelectedDay(null)} className="text-[11px] text-indigo-400 hover:text-indigo-300">× Clear</button>
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>
    </div>
  );
};
