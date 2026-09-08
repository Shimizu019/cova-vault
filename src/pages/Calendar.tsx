import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useTaskStore } from '@store';
import { toLocalDateString } from '@lib/utils';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type Task = import('@lib/types').Task;

const PRIORITY_BARS: Record<Task['priority'], string> = {
  low: 'bg-cova-success',
  medium: 'bg-cova-warning',
  high: 'bg-cova-danger',
};

export function Calendar() {
  const { tasks } = useTaskStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const calDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        const key = t.dueDate.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cova-primary" aria-hidden="true" />
            Calendar
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Tasks by due date &mdash; {MONTHS[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size='icon' onClick={prev} aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-cova-text w-40 text-center">{MONTHS[month]} {year}</span>
          <Button variant="ghost" size='icon' onClick={next} aria-label="Next month"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7">
          {DAYS.map((d) => <div key={d} className="px-1 sm:px-2 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-cova-textMuted uppercase border-b border-cova-border">{d}</div>)}
          {calDays.map((day, i) => {
            if (!day) return <div key={'e'+i} className="min-h-[64px] sm:min-h-[96px] border-b border-r border-cova-border/50" />;
            const key = toLocalDateString(day);
            const dayTasks = tasksByDate[key] || [];
            return (
              <div key={key} className={`min-h-[64px] sm:min-h-[96px] border-b border-r border-cova-border/50 p-1 sm:p-1.5 ${isToday(day) ? 'bg-cova-primary/5' : ''}`}>
                <span className={`inline-flex w-5 h-5 sm:w-6 sm:h-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 ${isToday(day) ? 'bg-cova-primary text-white' : 'text-cova-textSecondary'}`}>
                  {day.getDate()}
                </span>
                <div className="space-y-0.5 hidden sm:block">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className={'text-[10px] px-1 py-0.5 rounded truncate font-medium text-white ' + PRIORITY_BARS[t.priority]} title={t.title}>{t.title}</div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[10px] text-cova-textMuted px-1">+{dayTasks.length - 3} more</div>}
                </div>
                {/* Mobile: just show a dot if there are tasks */}
                <div className="sm:hidden">
                  {dayTasks.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cova-primary mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}