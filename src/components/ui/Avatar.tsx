import { cn } from '@lib/utils';
import { getInitials, getServiceColor } from '@lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  type?: 'user' | 'service';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

export function Avatar({ name, src, size = 'md', color, type = 'user', className, children, ...props }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const bgColor = color || (type === 'service' && name ? getServiceColor(name) : '#6B7280');
  const initials = name ? getInitials(name) : '';

  if (src) {
    return (
      <div
        className={cn('relative rounded-full overflow-hidden bg-light-border dark:bg-dark-border flex-shrink-0', sizeClass, className)}
        {...props}
      >
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        sizeClass,
        className
      )}
      style={{ backgroundColor: bgColor, color: 'white' }}
      {...props}
    >
      {children || initials}
    </div>
  );
}