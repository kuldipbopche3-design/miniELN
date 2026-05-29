'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-all duration-200 animate-in fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl border border-zinc-200 focus:outline-none transition-all duration-200 animate-in fade-in zoom-in-95 duration-150',
            className
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <Dialog.Title className="text-lg font-semibold text-zinc-900">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-zinc-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-xs p-1 text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100 transition">
              <X className="h-4.5 w-4.5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
