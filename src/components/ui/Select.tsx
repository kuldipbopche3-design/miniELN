import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-zinc-50 appearance-none pr-8 cursor-pointer',
              {
                'border-rose-500 focus:border-rose-500 focus:ring-rose-500': !!error,
              },
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
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

Select.displayName = 'Select';
