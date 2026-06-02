import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
}

export function fromNow(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function isOverdue(dueDate?: string | null, status?: string): boolean {
  if (!dueDate || status === 'completed') return false;
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
