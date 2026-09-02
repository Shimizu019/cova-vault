import { ReactNode } from 'react';
import { cn } from '@lib/utils';

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-3 border-b border-light-border dark:border-dark-border', className)}>
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-light-text dark:text-dark-text">{label}</p>
        {description && (
          <p className="text-xs text-light-textMuted dark:text-dark-textMuted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}