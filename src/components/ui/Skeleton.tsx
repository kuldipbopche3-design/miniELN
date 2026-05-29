import React from 'react';
import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-zinc-200/80', className)}
      {...props}
    />
  );
};
