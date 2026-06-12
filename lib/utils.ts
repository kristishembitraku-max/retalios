import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ─── Class Name Utility ───────────────────────────────────────────────────────

/**
 * Merges Tailwind CSS classes intelligently using clsx + tailwind-merge.
 * Handles conditional classes, arrays, and deduplication.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-primary', 'hover:bg-primary/90')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Formats a date string or Date object into a human-readable format.
 * Falls back to a relative time string if the date is within the last 7 days.
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: {
    format?: string;
    relative?: boolean;
    fallback?: string;
  } = {}
): string {
  const { format: formatStr = 'MMM d, yyyy', relative = false, fallback = '—' } = options;

  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return fallback;

    if (relative) {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    }

    return format(dateObj, formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date as a short relative string (e.g. "2h ago", "3d ago").
 */
export function formatRelative(date: string | Date | null | undefined): string {
  return formatDate(date, { relative: true });
}

/**
 * Formats a date for display in table cells: "Jan 12, 2024 at 3:45 PM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, { format: 'MMM d, yyyy \'at\' h:mm a' });
}

/**
 * Formats a date as ISO string for API payloads.
 */
export function toISOString(date: Date = new Date()): string {
  return date.toISOString();
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Truncates a string to a maximum length, appending an ellipsis.
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Converts a string to a URL-safe slug.
 * e.g. "Hello World!" -> "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a camelCase or snake_case string to "Title Case".
 * e.g. "salesAgent" -> "Sales Agent", "sales_agent" -> "Sales Agent"
 */
export function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
    .trim();
}

/**
 * Returns initials from a full name (up to 2 characters).
 * e.g. "John Doe" -> "JD", "Alice" -> "A"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Masks an email for privacy display.
 * e.g. "john.doe@example.com" -> "jo***@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

// ─── Number Utilities ─────────────────────────────────────────────────────────

/**
 * Formats a number with locale-aware thousands separators.
 * e.g. 1234567 -> "1,234,567"
 */
export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Formats a number as a compact string.
 * e.g. 1500 -> "1.5K", 1200000 -> "1.2M"
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Formats a number as a percentage.
 * e.g. 0.75 -> "75%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Clamps a number between a min and max value.
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

// ─── ID & Random Utilities ────────────────────────────────────────────────────

/**
 * Generates a new UUID v4.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generates a short random token (URL-safe, 16 chars by default).
 */
export function generateToken(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

/**
 * Generates a human-readable embed token for bots.
 * Format: "bot_<uuid_without_hyphens>"
 */
export function generateEmbedToken(): string {
  return `bot_${uuidv4().replace(/-/g, '')}`;
}

// ─── Async Utilities ──────────────────────────────────────────────────────────

/**
 * Returns a promise that resolves after the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function up to `maxAttempts` times with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError;
}

// ─── Object Utilities ─────────────────────────────────────────────────────────

/**
 * Removes undefined/null values from a shallow object.
 */
export function cleanObject<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

/**
 * Deep clones a plain object via JSON serialization.
 * Not suitable for objects with functions, Dates as dates, or circular refs.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ─── URL Utilities ────────────────────────────────────────────────────────────

/**
 * Builds a URL with query parameters, filtering out null/undefined values.
 */
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const url = new URL(base, 'http://dummy');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.pathname + (url.search ? url.search : '');
}

/**
 * Returns true if the given string is a valid URL.
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ─── File Utilities ───────────────────────────────────────────────────────────

/**
 * Formats a file size in bytes to a human-readable string.
 * e.g. 1024 -> "1 KB", 1048576 -> "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(1)} ${units[exponent]}`;
}

/**
 * Returns the file extension from a filename or URL.
 * e.g. "document.pdf" -> "pdf"
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}
