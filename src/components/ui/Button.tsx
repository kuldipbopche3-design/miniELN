import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            // Variants
            'bg-primary text-white hover:bg-primary-dark focus:ring-primary': variant === 'primary',
            'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500': variant === 'secondary',
            'bg-transparent border border-zinc-200 text-zinc-700 hover:bg-zinc-50 focus:ring-primary': variant === 'outline',
            'bg-transparent text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-400': variant === 'ghost',
            'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500': variant === 'danger',
            
            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-5 py-2.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
