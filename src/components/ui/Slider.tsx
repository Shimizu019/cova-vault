import { cn } from '@lib/utils';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  label?: string;
}

export function Slider({ value, min = 0, max = 100, step = 1, onChange, className, label }: SliderProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-cova-textSecondary">{label}</label>
          <span className="text-sm font-semibold text-cova-text">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider w-full"
        aria-label={label}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-cova-textMuted">{min}</span>
        <span className="text-xs text-cova-textMuted">{max}</span>
      </div>
    </div>
  );
}