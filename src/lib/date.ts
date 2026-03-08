import { format } from 'date-fns';

export function parseDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type DateFormatPattern = 'date' | 'dateShort' | 'datetime';

export function formatDate(
  iso: string | null | undefined,
  options?: { fallback?: string; pattern?: DateFormatPattern }
): string {
  const fallback = options?.fallback ?? '–';
  const pattern = options?.pattern ?? 'date';
  if (iso == null || iso === '') return fallback;
  const date = parseDate(iso);
  if (!date) return fallback;
  if (pattern === 'datetime') {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (pattern === 'dateShort') return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}
