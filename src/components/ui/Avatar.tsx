import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name?: string | null) => {
  if (!name) return 'bg-zinc-100 text-zinc-700';
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  const colors = [
    'bg-indigo-100 text-indigo-700 border border-indigo-200',
    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'bg-sky-100 text-sky-700 border border-sky-200',
    'bg-amber-100 text-amber-700 border border-amber-200',
    'bg-rose-100 text-rose-700 border border-rose-200',
    'bg-violet-100 text-violet-700 border border-violet-200',
  ];
  return colors[charCode % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, className, size = 'md' }) => {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full items-center justify-center font-semibold select-none',
        {
          'h-8 w-8 text-xs': size === 'sm',
          'h-10 w-10 text-sm': size === 'md',
          'h-12 w-12 text-base': size === 'lg',
        },
        src ? 'bg-zinc-100' : colorClass,
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
