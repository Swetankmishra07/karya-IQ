import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return '—';
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatDeadline(deadlineString: string | null | undefined): {
  text: string;
  isOverdue: boolean;
  isSoon: boolean;
} {
  if (!deadlineString) {
    return { text: 'No deadline', isOverdue: false, isSoon: false };
  }
  try {
    const date = typeof deadlineString === 'string' ? parseISO(deadlineString) : new Date(deadlineString);
    const now = new Date();
    const isOverdue = date < now;
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isSoon = !isOverdue && diffHours > 0 && diffHours <= 48;

    let text = format(date, 'MMM d, yyyy');
    if (isToday(date)) text = `Today (${format(date, 'h:mm a')})`;
    else if (isYesterday(date)) text = 'Yesterday';

    return { text, isOverdue, isSoon };
  } catch {
    return { text: 'Invalid date', isOverdue: false, isSoon: false };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getInitials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return '?';
  const clean = nameOrEmail.trim();
  if (clean.includes('@')) {
    const username = clean.split('@')[0];
    return username.slice(0, 2).toUpperCase();
  }
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}
