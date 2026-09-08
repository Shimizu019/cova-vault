import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combine class names safely with Tailwind-aware merging */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date as "Jan 15, 2024" */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/** Format a Date as a local YYYY-MM-DD string without UTC conversion */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Format a date and time */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a timestamp as "2 hours ago", "Yesterday", etc. */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${diffDay >= 14 ? 's' : ''} ago`;
  return formatDate(d);
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Get initials from a name */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Truncate a string */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/** Get domain from a URL */
export function getDomainFromUrl(url: string): string {
  if (!url) return '';
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Get service name from a URL */
export function getServiceNameFromUrl(url: string): string {
  const domain = getDomainFromUrl(url);
  const knownServices: Record<string, string> = {
    'google.com': 'Google',
    'microsoft.com': 'Microsoft',
    'github.com': 'GitHub',
    'aws.amazon.com': 'AWS',
    'discord.com': 'Discord',
    'facebook.com': 'Facebook',
    'slack.com': 'Slack',
    'figma.com': 'Figma',
    'notion.so': 'Notion',
    'linear.app': 'Linear',
    'vercel.com': 'Vercel',
    'netlify.com': 'Netlify',
    'cloudflare.com': 'Cloudflare',
    'atlassian.com': 'Atlassian',
    'zoom.us': 'Zoom',
  };
  return knownServices[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

/** Format a number as Philippine Peso (₱) */
export function formatPHP(amount: number): string {
  return `₱${new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/** Format generic currency */
export function formatCurrency(amount: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compute password strength score (0..5) and label */
export function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const scoreClamped = Math.min(score, 5);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E'];

  return { score: scoreClamped, label: labels[scoreClamped], color: colors[scoreClamped] };
}

/** Validate a URL */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Mask a password string */
export function maskPassword(password: string, visibleChars = 0): string {
  if (!password) return '';
  if (visibleChars >= password.length) return password;
  if (visibleChars > 0) {
    const hidden = '•'.repeat(password.length - visibleChars);
    return hidden + password.slice(-visibleChars);
  }
  return '•'.repeat(Math.max(password.length, 8));
}

/** Sanitize a string for safe HTML rendering */
export function sanitize(str: string): string {
  return str.replace(/[<>]/g, '');
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Check if value is empty */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
}