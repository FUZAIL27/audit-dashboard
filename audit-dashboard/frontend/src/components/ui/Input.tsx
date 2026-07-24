import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          'w-full h-10 px-3 rounded-lg bg-base-800 border border-border text-sm text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal/50 transition-colors',
          error && 'border-severity-critical/60 focus:ring-severity-critical/30',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-severity-critical">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
