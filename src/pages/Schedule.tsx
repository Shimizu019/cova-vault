import { useState, useMemo, Fragment } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { EmptyState } from '@components/ui/Card';
import { useTaskStore } from '@store';
import { formatDate } from '@lib/utils';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6am to 8pm
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function Schedule() {
  const { tasks } = useTaskStore();
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const tasksByDayHour = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = t.dueDate.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isPast = (d: Date) => d < new Date(today.toDateString());

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <Clock className="w-5 h-5 text-cova-primary" aria-hidden="true" />
            Schedule
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Weekly overview of your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevWeek} className="p-2 rounded-lg text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors" aria-label="Previous week"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-cova-text whitespace-nowrap">{formatDate(days[0])} &ndash; {formatDate(days[6])}</span>
          <button type="button" onClick={nextWeek} className="p-2 rounded-lg text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors" aria-label="Next week"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '64px repeat(7, minmax(120px, 1fr))' }}>
          <div className="border-b border-r border-cova-border" />
          {days.map((d) => (
            <div key={d.toISOString()} className={'px-2 py-3 text-center border-b border-r border-cova-border ' + (isToday(d) ? 'bg-cova-primary/5' : '')}>
              <div className="text-xs font-semibold text-cova-textMuted uppercase">{DAY_NAMES[d.getDay()]}</div>
              <div className={'text-lg font-bold mt-0.5 ' + (isToday(d) ? 'text-cova-primary' : isPast(d) ? 'text-cova-textMuted' : 'text-cova-text')}>{d.getDate()}</div>
            </div>
          ))}

          {HOURS.map((h) => (
            <Fragment key={h}>
              <div className="px-2 py-2 text-xs text-cova-textMuted text-right border-r border-cova-border">
                {h > 12 ? h - 12 + 'pm' : h === 12 ? '12pm' : h + 'am'}
              </div>
              {days.map((d) => {
                const key = d.toISOString().split('T')[0];
                const dayTasks = (tasksByDayHour[key] || []).slice(0, 2);
                return (
                  <div key={h + '-' + key} className="min-h-[52px] border-b border-r border-cova-border/50 p-1">
                    {dayTasks.map((t) => (
                      <div key={t.id} className={'text-[10px] px-1 py-0.5 rounded mb-0.5 truncate ' + (t.status === 'done' ? 'bg-cova-success/20 text-cova-success line-through' : 'bg-cova-primary/20 text-cova-primary')}>
                        {t.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}