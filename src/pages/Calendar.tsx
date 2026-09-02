import { useState } from 'react';
import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { formatDate, formatRelativeTime } from '@lib/utils';
import { Task } from '@lib/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
} from 'lucide-react';

export function Calendar() {
  const { tasks } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tasksWithDates = tasks.filter(t => t.dueDate);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasksWithDates.filter(t => t.dueDate?.split('T')[0] === dateStr);
  };

  const today = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const weeks = [];
  let week = [];
  
  for (let i = 0; i < startDay; i++) {
    week.push({ day: prevMonthEnd - startDay + i + 1, currentMonth: false });
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    week.push({ day, currentMonth: true, date });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  
  for (let i = 1; week.length < 7; i++) {
    week.push({ day: i, currentMonth: false });
  }
  if (week.length > 0) weeks.push(week);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="View your tasks and deadlines"
        actions={
          <Button variant="secondary">
            <CalendarIcon className="w-4 h-4" />
            Today
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-light-textMuted dark:text-dark-textMuted py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="contents">
                {week.map(({ day, currentMonth, date }, dayIndex) => {
                  const isToday = date && date.toDateString() === today.toDateString();
                  const isSelected = date && selectedDate?.toDateString() === date.toDateString();
                  const dayTasks = date ? getTasksForDate(date) : [];
                  
                  return (
                    <button
                      key={dayIndex}
                      onClick={() => date && setSelectedDate(date)}
                      disabled={!currentMonth}
                      className={cn(
                        'relative aspect-square p-1.5 rounded-lg text-sm transition-colors',
                        !currentMonth && 'text-light-textMuted dark:text-dark-textMuted',
                        currentMonth && 'hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover text-light-text dark:text-dark-text',
                        isToday && 'bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary font-semibold',
                        isSelected && 'ring-2 ring-light-primary dark:ring-dark-primary'
                      )}
                    >
                      <span className="font-medium">{day}</span>
                      {dayTasks.length > 0 && (
                        <div className="mt-1 space-y-0.5 max-h-16 overflow-y-auto">
                          {dayTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="text-xs truncate bg-light-primary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary px-1 py-0.5 rounded">
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-light-textMuted dark:text-dark-textMuted text-center">
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

            {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <span className="text-sm text-light-textMuted dark:text-dark-textMuted">
                {getTasksForDate(selectedDate).length} task{getTasksForDate(selectedDate).length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {(() => {
              const dayTasks = getTasksForDate(selectedDate);
              return dayTasks.length === 0 ? (
                <div className="text-center py-4 text-light-textMuted dark:text-dark-textMuted">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-light-surfaceHover dark:bg-dark-surfaceHover rounded-lg">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        task.status === 'done' && 'bg-light-successLight dark:bg-dark-successLight',
                        task.status === 'in_progress' && 'bg-light-warningLight dark:bg-dark-warningLight',
                        task.status === 'todo' && 'bg-light-surface dark:bg-dark-surface'
                      )}>
                        <CheckSquare className={cn('w-4 h-4', task.status === 'done' ? 'text-light-success dark:text-dark-success' : 'text-light-textMuted dark:text-dark-textMuted')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', task.status === 'done' ? 'line-through text-light-textMuted dark:text-dark-textMuted' : 'text-light-text dark:text-dark-text')}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-light-textMuted dark:text-dark-textMuted">
                          {task.priority && <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>{task.priority}</Badge>}
                          {task.category && <Badge variant="neutral">{task.category}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}