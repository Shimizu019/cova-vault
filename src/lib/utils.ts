import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

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

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const pastDays = Math.ceil(-diffMs / (1000 * 60 * 60 * 24));
    if (pastDays === 1) return 'Yesterday';
    if (pastDays < 7) return `${pastDays} days ago`;
    return formatDate(d);
  }
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return formatDate(d);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

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
    'heroku.com': 'Heroku',
    'digitalocean.com': 'DigitalOcean',
    'cloudflare.com': 'Cloudflare',
    'atlassian.com': 'Atlassian',
    'jira.com': 'Jira',
    'confluence.com': 'Confluence',
    'zoom.us': 'Zoom',
    'teams.microsoft.com': 'Teams',
    'meet.google.com': 'Google Meet',
  };
  return knownServices[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

export function getServiceColor(name: string): string {
  const colors: Record<string, string> = {
    'Google': '#4285F4',
    'Microsoft': '#0078D4',
    'GitHub': '#181717',
    'AWS': '#FF9900',
    'Discord': '#5865F2',
    'Facebook': '#1877F2',
    'Slack': '#4A154B',
    'Figma': '#F24E1E',
    'Notion': '#000000',
    'Linear': '#5E6AD2',
    'Vercel': '#000000',
    'Netlify': '#00C7B7',
    'Heroku': '#430098',
    'DigitalOcean': '#0080FF',
    'Cloudflare': '#F38020',
    'Atlassian': '#0052CC',
    'Zoom': '#2D8CFF',
    'Teams': '#6264A7',
  };
  return colors[name] || '#6B7280';
}

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

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculatePasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score: Math.min(score, 5), label: labels[Math.min(score, 5)] };
}