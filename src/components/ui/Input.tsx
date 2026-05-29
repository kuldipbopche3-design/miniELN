import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-zinc-50',
            {
              'border-rose-500 focus:border-rose-500 focus:ring-rose-500': !!error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
