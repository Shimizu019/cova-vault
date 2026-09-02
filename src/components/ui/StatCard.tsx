import { cn } from '@lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1 flex items-center gap-1', trend.positive ? 'text-light-success dark:text-dark-success' : 'text-light-danger dark:text-dark-danger')}>
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-light-textMuted dark:text-dark-textMuted flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}