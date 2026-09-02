import type { ComponentType } from 'react';
import { cn } from '@lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: 'credentials' | 'notes' | 'tasks' | 'wallet';
}

const colorClasses: Record<MetricCardProps['color'], { bg: string; icon: string }> = {
  credentials: { bg: 'bg-cova-danger/10', icon: 'text-cova-credentials' },
  notes: { bg: 'bg-cova-success/10', icon: 'text-cova-notes' },
  tasks: { bg: 'bg-cova-tasks/10', icon: 'text-cova-tasks' },
  wallet: { bg: 'bg-cova-success/10', icon: 'text-cova-success' },
};

export function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.icon)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-cova-textMuted font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-cova-text mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}