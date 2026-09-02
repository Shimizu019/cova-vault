import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('input', error && 'input-error', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ className, children, required, ...props }: LabelProps) => (
  <label className={cn('label', className)} {...props}>
    {children}
    {required && <span className="text-cova-danger ml-0.5">*</span>}
  </label>
);