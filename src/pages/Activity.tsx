import { useMemo } from 'react';
import { Activity as ActivityIcon, Key, FileText, CheckSquare, Wallet as WalletIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@components/ui/Card';
import { useCredentialStore } from '@store';
import { formatDateTime } from '@lib/utils';
import type { ItemStatus } from '@lib/types';

const TYPE_ICONS: Record<ItemStatus, LucideIcon> = { credentials: Key, notes: FileText, tasks: CheckSquare, wallet: WalletIcon };
const TYPE_COLORS: Record<ItemStatus, string> = { credentials: '#EF4444', notes: '#22C55E', tasks: '#F97316', wallet: '#22C55E' };
const TYPE_LABELS: Record<ItemStatus, string> = { credentials: 'Credential', notes: 'Note', tasks: 'Task', wallet: 'Wallet' };

export function Activity() {
  const { activities } = useCredentialStore();

  const sorted = useMemo(() => [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [activities]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-cova-primary" aria-hidden="true" />
          Activity Log
          <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{activities.length}</span>
        </h1>
        <p className="text-sm text-cova-textMuted mt-1">Recent actions across your vault</p>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<ActivityIcon className="w-16 h-16 text-cova-textMuted" />} title="No activity yet" description="Your actions will appear here as you use the app." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-cova-border">
            {sorted.map((a) => {
              const Icon = TYPE_ICONS[a.type] || Key;
              const color = TYPE_COLORS[a.type] || '#7C3AED';
              return (
                <div key={a.id} className="px-5 py-4 flex items-start gap-3 hover:bg-cova-surfaceHover transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cova-text">{a.detail}</p>
                    <p className="text-xs text-cova-textMuted mt-0.5">{a.title} &middot; <span className="badge badge-neutral">{TYPE_LABELS[a.type]}</span></p>
                  </div>
                  <span className="text-xs text-cova-textMuted whitespace-nowrap flex-shrink-0">{formatDateTime(a.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}