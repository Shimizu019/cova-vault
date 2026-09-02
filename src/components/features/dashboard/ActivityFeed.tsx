import type { ComponentType } from 'react';
import { cn } from '@lib/utils';
import { formatRelativeTime } from '@lib/utils';
import type { ItemStatus } from '@lib/types';

interface ActivityFeedProps {
  title: string;
  activities: Array<{
    id: string;
    type: ItemStatus;
    title: string;
    detail: string;
    timestamp: string;
  }>;
  color?: 'credentials' | 'notes' | 'tasks' | 'wallet' | 'all';
}

const statusColors: Record<ItemStatus, string> = {
  credentials: 'bg-cova-credentials',
  notes: 'bg-cova-notes',
  tasks: 'bg-cova-tasks',
  wallet: 'bg-cova-notes',
};

export function ActivityFeed({ title, activities, color = 'all' }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, 5);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cova-text">{title}</h3>
        <span className="text-xs text-cova-textMuted">{activities.length} items</span>
      </div>

      {displayActivities.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-cova-textMuted">No activity yet</p>
        </div>
      ) : (
        <div className="divide-y divide-cova-border">
          {displayActivities.map((activity) => {
            const dotColor = color === 'all' ? statusColors[activity.type] : `bg-cova-${color}`;
            return (
              <div
                key={activity.id}
                className="px-5 py-3 flex items-start gap-3 hover:bg-cova-surfaceHover transition-colors"
              >
                <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', dotColor)} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cova-text truncate">{activity.detail}</p>
                  <p className="text-xs text-cova-textMuted mt-0.5">{activity.title}</p>
                </div>
                <span className="text-xs text-cova-textMuted whitespace-nowrap flex-shrink-0">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}