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
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 rounded-xl bg-white/50 backdrop-blur-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-55 hover:scale-105 transition-transform duration-200 text-primary">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">{description}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
