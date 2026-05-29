import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'zinc' | 'primary' | 'accent' | 'danger' | 'warning' | 'info';
  styleType?: 'solid' | 'subtle' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'zinc',
  styleType = 'subtle',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none',
        {
          // Zinc colors
          'bg-zinc-900 text-white': variant === 'zinc' && styleType === 'solid',
          'bg-zinc-100 text-zinc-800': variant === 'zinc' && styleType === 'subtle',
          'border border-zinc-200 text-zinc-700': variant === 'zinc' && styleType === 'outline',

          // Primary (Indigo) colors
          'bg-primary text-white': variant === 'primary' && styleType === 'solid',
          'bg-primary-light text-primary-dark': variant === 'primary' && styleType === 'subtle',
          'border border-primary-light text-primary': variant === 'primary' && styleType === 'outline',

          // Accent (Emerald) colors
          'bg-accent text-white': variant === 'accent' && styleType === 'solid',
          'bg-accent-light text-accent-dark': variant === 'accent' && styleType === 'subtle',
          'border border-accent-light text-accent': variant === 'accent' && styleType === 'outline',

          // Danger (Rose/Red) colors
          'bg-rose-600 text-white': variant === 'danger' && styleType === 'solid',
          'bg-rose-50 text-rose-700': variant === 'danger' && styleType === 'subtle',
          'border border-rose-200 text-rose-600': variant === 'danger' && styleType === 'outline',

          // Warning (Amber) colors
          'bg-amber-500 text-white': variant === 'warning' && styleType === 'solid',
          'bg-amber-50 text-amber-700': variant === 'warning' && styleType === 'subtle',
          'border border-amber-200 text-amber-600': variant === 'warning' && styleType === 'outline',

          // Info (Blue) colors
          'bg-blue-600 text-white': variant === 'info' && styleType === 'solid',
          'bg-blue-50 text-blue-700': variant === 'info' && styleType === 'subtle',
          'border border-blue-200 text-blue-600': variant === 'info' && styleType === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
