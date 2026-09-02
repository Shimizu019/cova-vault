import { ReactNode } from 'react';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import { SearchBar } from '@components/ui/SearchBar';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
  };
  className?: string;
}

export function PageHeader({ title, subtitle, actions, search, className }: PageHeaderProps) {
  return (
    <div className={cn('page-header flex-wrap gap-4', className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {search && (
          <div className="w-64 sm:w-80">
            <SearchBar
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}