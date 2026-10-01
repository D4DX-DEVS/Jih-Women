import type { Lang } from './types';

/* Dates always read in English ("17 August 2026"), whatever the site language;
   only the content itself follows the ML/EN toggle. The language argument is
   kept so callers need no changes. */
const DATE_LOCALE = 'en-IN';

export function formatDate(value: string | undefined, _lang?: Lang): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateRange(start?: string, end?: string, lang: Lang = 'ml'): string {
  const from = formatDate(start, lang);
  if (!end) return from;
  const to = formatDate(end, lang);
  if (!to || to === from) return from;
  return `${from} – ${to}`;
}

export function formatDay(value: string | undefined, _lang?: Lang) {
  if (!value) return { day: '', month: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { day: '', month: '' };
  return {
    day: new Intl.DateTimeFormat(DATE_LOCALE, { day: '2-digit' }).format(d),
    month: new Intl.DateTimeFormat(DATE_LOCALE, { month: 'short' }).format(d),
  };
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** Extracts the 11-character video id from any common YouTube URL shape. */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeThumb(url: string): string {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

export function whatsappHref(number: string): string {
  const digits = (number || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}`;
}

/** True for an absolute http(s) URL — anything else must not be rendered as an outbound link. */
export function isExternalUrl(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? '');
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}
