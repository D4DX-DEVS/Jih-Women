/**
 * Maps an admin section (and optionally one record) to the public page that
 * shows it, so every screen can offer a Preview button.
 *
 * Public routes are language-prefixed (`/:lang/...`, see web/src/App.tsx) and
 * every public read filters on `published: true` (backend/routes/site.js), so
 * previewing a draft returns a 404. Callers use `canPreviewRecord` to disable
 * the button rather than sending an editor to a Not Found page.
 */

import type { Doc } from './fields';

/**
 * Public website origin, required — set VITE_SITE_URL (see app/.env.example).
 *
 * Vite inlines this at build time, so the variable must exist on the machine
 * running `npm run build`; setting it on a running server has no effect. There
 * is deliberately no default: if it is unset the Preview buttons are hidden
 * rather than pointing at somewhere wrong. The `?? ''` is a crash guard, not a
 * fallback URL — reading `.replace` off undefined would blank the console.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '');

/** The public site's default language; `/` redirects here. */
const LANG = 'ml';

/**
 * Section-level preview target, as a path under the language prefix.
 * `null` means the section has no public page at all.
 */
const SECTION_PATH: Record<string, string | null> = {
  overview: '',
  'site-settings': '',
  // Slides, focus areas and campaigns all render on the home page; campaigns
  // additionally have detail pages but no index route of their own.
  sliders: '',
  'focus-areas': '',
  campaigns: '',
  pages: '/who-we-are',
  departments: '/departments',
  programs: '/programs',
  leaders: '/leaders',
  events: '/events',
  'event-rsvps': '/events',
  'media-posts': '/media/news',
  videos: '/media/videos',
  albums: '/media/gallery',
  downloads: '/media/downloads',
  publications: '/publications',
  'external-links': '/links',
  contact: '/contact',
  newsletter: null,
};

/** Sections whose records have a standalone public page, keyed by URL prefix. */
const RECORD_PREFIX: Record<string, string> = {
  campaigns: '/campaigns',
  pages: '/who-we-are',
  departments: '/departments',
  programs: '/programs',
  events: '/events',
  albums: '/media/gallery',
  publications: '/publications',
};

function url(path: string): string {
  return `${SITE_URL}/${LANG}${path}`;
}

/** The public URL for a whole section, or null when it has no public page. */
export function sectionPreviewUrl(sectionKey: string): string | null {
  if (!SITE_URL) return null;
  const path = SECTION_PATH[sectionKey];
  return path === null || path === undefined ? null : url(path);
}

/**
 * The public URL for one record, or null when that collection's records have
 * no page of their own (sliders, focus areas, leaders, videos, downloads and
 * external links are all rendered inline on a list page).
 */
export function recordPreviewUrl(sectionKey: string, doc: Doc): string | null {
  if (!SITE_URL) return null;
  const slug = typeof doc.slug === 'string' ? doc.slug : '';
  if (!slug) return null;

  // News/statements live under /media/:type/:slug — the type segment drives the
  // breadcrumb, so it has to come from the document rather than be hardcoded.
  if (sectionKey === 'media-posts') {
    const type = typeof doc.type === 'string' && doc.type ? doc.type : 'news';
    return url(`/media/${type}/${slug}`);
  }

  const prefix = RECORD_PREFIX[sectionKey];
  return prefix ? url(`${prefix}/${slug}`) : null;
}

/**
 * Whether previewing this record would actually resolve. Unpublished records
 * are filtered out by the public API, so the link would land on Not Found.
 */
export function canPreviewRecord(doc: Doc): boolean {
  return doc.published === true;
}
