import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-xs shadow-xs max-w-xl mx-auto my-4 transition duration-200 hover:border-zinc-300">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-primary shadow-xs transition duration-300 hover:scale-105">
        <Icon className="h-6.5 w-6.5 text-primary" />
      </div>
      <h3 className="mt-5 text-base font-bold text-zinc-950 tracking-tight">{title}</h3>
      <p className="mt-2 text-xs text-zinc-550 max-w-xs leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction} className="shadow-xs cursor-pointer">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
