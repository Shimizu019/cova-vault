import { cn } from '@lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-cova-success/15 text-cova-success',
    danger: 'bg-cova-danger/15 text-cova-danger',
    warning: 'bg-cova-warning/15 text-cova-warning',
    info: 'bg-cova-primary/15 text-cova-primary',
    neutral: 'bg-cova-surface border border-cova-border text-cova-textSecondary',
  };

  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

interface AvatarProps {
  initial?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ initial = '?', size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

  return (
    <div
      className={cn(
        'rounded-full bg-cova-primary/20 text-cova-primary font-semibold flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {initial}
    </div>
  );
}