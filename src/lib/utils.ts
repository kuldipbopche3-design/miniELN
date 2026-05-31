import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(err: any, fallbackMessage: string = 'An unexpected error occurred'): string {
  if (!err) return fallbackMessage;
  
  const message = typeof err === 'string' ? err : err.message || '';
  
  if (message.includes('check constraint "lab_entries_status_check"')) {
    return 'Invalid status selected. Please choose a status allowed by this workspace.';
  }
  if (message.includes('violates check constraint')) {
    return 'The submitted data contains invalid values that violate database requirements.';
  }
  if (message.includes('row-level security policy') || message.includes('violates row-level security')) {
    return 'Access Denied: You do not have permissions to perform this operation in this workspace.';
  }
  if (message.includes('foreign key constraint') || message.includes('violates foreign key')) {
    return 'Referenced record was not found or has been deleted.';
  }
  if (message.includes('unique constraint') || message.includes('duplicate key value')) {
    return 'A record with this information already exists.';
  }
  if (message.includes('JWT expired') || message.includes('invalid JWT') || message.includes('AuthSessionMissing')) {
    return 'Your session has expired. Please log in again.';
  }

  return err.message || fallbackMessage;
}
