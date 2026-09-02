import { cn } from '@lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover';
}

export const Card = ({ className, variant = 'default', children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        variant === 'hover' ? 'card-hover' : 'card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('px-4 py-3 border-b border-light-border dark:border-dark-border', className)} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('px-4 py-3', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('px-4 py-3 border-t border-light-border dark:border-dark-border flex items-center justify-end gap-2', className)} {...props}>
      {children}
    </div>
  );
};