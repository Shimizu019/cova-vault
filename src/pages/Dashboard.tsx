import { Key, FileText, CheckSquare, Wallet } from 'lucide-react';
import { useCredentialStore, useNoteStore, useTaskStore, useWalletStore, useSettingsStore } from '@store';
import { BackupBanner } from '@features/dashboard/BackupBanner';
import { MetricCard } from '@features/dashboard/MetricCard';
import { ActivityFeed } from '@features/dashboard/ActivityFeed';
import { formatPHP } from '@lib/utils';

export function Dashboard() {
  const { credentials, activities } = useCredentialStore();
  const { notes } = useNoteStore();
  const { tasks, getOpenTasks } = useTaskStore();
  const { records, getBalance } = useWalletStore();
  const { user } = useSettingsStore();

  const openTasks = getOpenTasks();
  const balance = getBalance();
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Filter activities by type
  const allActivities = activities.slice(0, 10);
  const walletActivities = activities.filter((a) => a.type === 'wallet').slice(0, 5);
  const taskActivities = activities.filter((a) => a.type === 'tasks').slice(0, 5);

  const firstName = user.displayName.split(' ')[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-cova-text">
          Good to see you, {firstName}.
        </h1>
        <p className="text-sm text-cova-textMuted mt-1">
          Here's everything across your Safe Vault.
        </p>
      </div>

      {/* Backup Banner */}
      <BackupBanner />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Credentials"
          value={credentials.length}
          icon={Key}
          color="credentials"
        />
        <MetricCard
          label="Notes"
          value={notes.length}
          icon={FileText}
          color="notes"
        />
        <MetricCard
          label="Open Tasks"
          value={openTasks.length}
          icon={CheckSquare}
          color="tasks"
        />
        <MetricCard
          label={`My Wallet (${monthName})`}
          value={formatPHP(balance)}
          icon={Wallet}
          color="wallet"
        />
      </div>

      {/* Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityFeed title="Recent Activities" activities={allActivities} color="all" />
        <ActivityFeed title="Recent Wallet" activities={walletActivities} color="wallet" />
        <ActivityFeed title="Recent Tasks" activities={taskActivities} color="tasks" />
      </div>
    </div>
  );
}