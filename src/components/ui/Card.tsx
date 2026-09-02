import { cn } from '@lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = ({ className, hover, children, ...props }: CardProps) => (
  <div className={cn('card', hover && 'hover:bg-cova-surfaceHover transition-colors', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 border-b border-cova-border', className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 border-t border-cova-border', className)} {...props}>
    {children}
  </div>
);

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 text-center', className)}>
      {icon && <div className="mb-4 text-cova-textMuted">{icon}</div>}
      <h3 className="text-base font-semibold text-cova-text mb-1">{title}</h3>
      {description && <p className="text-sm text-cova-textMuted mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}