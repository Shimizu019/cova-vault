import { useData } from '@context/DataContext';
import { PageHeader } from '@components/ui/PageHeader';
import { Card, CardContent } from '@components/ui/Card';
import { formatRelativeTime } from '@lib/utils';
import { 
  Database, 
  FileText, 
  CheckSquare, 
  DollarSign,
  FolderKanban,
  Key,
  Trash2,
  Edit,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@lib/utils';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function Activity() {
  const { credentials, notes, tasks, incomeRecords, folders } = useData();

  const buildActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Credentials
    credentials.forEach(c => {
      activities.push({
        id: `cred-created-${c.id}`,
        type: 'credential_created',
        title: 'Created credential',
        detail: c.title,
        time: c.createdAt,
        icon: Database,
        color: 'text-[#3b82f6]',
      });
      if (c.updatedAt !== c.createdAt) {
        activities.push({
          id: `cred-updated-${c.id}`,
          type: 'credential_updated',
          title: 'Updated credential',
          detail: c.title,
          time: c.updatedAt,
          icon: Edit,
          color: 'text-[#3b82f6]',
        });
      }
    });

    // Notes
    notes.forEach(n => {
      activities.push({
        id: `note-created-${n.id}`,
        type: 'note_created',
        title: 'Created note',
        detail: n.title,
        time: n.createdAt,
        icon: FileText,
        color: 'text-[#22c55e]',
      });
      if (n.updatedAt !== n.createdAt) {
        activities.push({
          id: `note-updated-${n.id}`,
          type: 'note_updated',
          title: 'Updated note',
          detail: n.title,
          time: n.updatedAt,
          icon: Edit,
          color: 'text-[#22c55e]',
        });
      }
    });

    // Tasks
    tasks.forEach(t => {
      activities.push({
        id: `task-created-${t.id}`,
        type: 'task_created',
        title: 'Created task',
        detail: t.title,
        time: t.createdAt,
        icon: CheckSquare,
        color: 'text-[#eab308]',
      });
      if (t.status === 'done' && t.updatedAt !== t.createdAt) {
        activities.push({
          id: `task-completed-${t.id}`,
          type: 'task_completed',
          title: 'Completed task',
          detail: t.title,
          time: t.updatedAt,
          icon: CheckSquare,
          color: 'text-[#22c55e]',
        });
      }
    });

    // Income
    incomeRecords.forEach(r => {
      activities.push({
        id: `income-${r.id}`,
        type: r.type === 'income' ? 'income_added' : 'expense_added',
        title: r.type === 'income' ? 'Added income' : 'Added expense',
        detail: r.description,
        time: r.createdAt,
        icon: DollarSign,
        color: r.type === 'income' ? 'text-[#22c55e]' : 'text-[#ef4444]',
      });
    });

    // Folders
    folders.forEach(f => {
      activities.push({
        id: `folder-created-${f.id}`,
        type: 'folder_created',
        title: 'Created folder',
        detail: f.name,
        time: f.createdAt,
        icon: FolderKanban,
        color: 'text-[#8b5cf6]',
      });
    });

    // Sort by time descending
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 50);
  };

  const activities = buildActivities();

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" subtitle="View your vault activity history" />

      <Card className="bg-[#1a1a1a] border border-[#333]">
        <div className="divide-y divide-[#333]">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-[#666]">
              No activity yet
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#222]">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', activity.color + '/20')}>
                    <Icon className={cn('w-4 h-4', activity.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-[#666] truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-[#666] whitespace-nowrap">{formatRelativeTime(activity.time)}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}