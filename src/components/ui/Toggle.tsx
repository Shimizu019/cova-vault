import { cn } from '@lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, id }: ToggleProps) {
  const inputId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex items-center justify-between gap-3">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <label htmlFor={inputId} className="text-sm font-medium text-cova-text cursor-pointer">{label}</label>}
          {description && <p className="text-xs text-cova-textMuted mt-0.5">{description}</p>}
        </div>
      )}
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn('toggle', checked ? 'toggle-on' : 'toggle-off', disabled && 'opacity-50 cursor-not-allowed')}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}