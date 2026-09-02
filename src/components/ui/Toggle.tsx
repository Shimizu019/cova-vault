import { forwardRef } from 'react';
import { cn } from '@lib/utils';

interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, id, checked, onChange, disabled, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <label className={cn('flex items-center gap-3 cursor-pointer', className)}>
        <span className={cn('toggle', checked && 'toggle-on', !checked && 'toggle-off', disabled && 'opacity-50 cursor-not-allowed')}>
          <span className="toggle-thumb" />
        </span>
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm text-light-text dark:text-dark-text">{label}</span>}
            {description && <span className="text-xs text-light-textMuted dark:text-dark-textMuted">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

Toggle.displayName = 'Toggle';