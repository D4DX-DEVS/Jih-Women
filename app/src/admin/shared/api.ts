export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const TOKEN_KEY = 'wes_admin_token';

export type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  raw?: boolean;
  formData?: FormData;
};

export async function apiRequest(path: string, opts: ApiOptions = {}): Promise<Response> {
  if (!API_URL) throw new Error('Server URL not configured');
  const headers: Record<string, string> = {};
  if (opts.body !== undefined && !opts.formData) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.formData ? opts.formData : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return res;
}

export type ApiErrorShape = Error & {
  code?: number;
  fields?: Record<string, string>;
};

export async function apiJson<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await apiRequest(path, opts);
  } catch {
    // fetch() only rejects when the request never reached the server
    const err: ApiErrorShape = new Error(
      'Could not reach the server. Check your internet connection and that the backend is running.'
    );
    err.code = 0;
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const err: ApiErrorShape = new Error('Your session has expired. Please sign in again.');
    err.code = 401;
    throw err;
  }

  if (!res.ok) {
    const err: ApiErrorShape = new Error(data.error || 'Something went wrong. Please try again.');
    err.code = res.status;
    if (data.fields && typeof data.fields === 'object') err.fields = data.fields;
    throw err;
  }

  return data as T;
}

export function isAuthError(err: unknown): boolean {
  return (err as ApiErrorShape)?.code === 401;
}

const FIELD_ALIASES: Record<string, string> = {
  fileUrl: 'File',
  imageUrl: 'Image',
  mobileImageUrl: 'Mobile image',
  coverImage: 'Cover image',
  posterImage: 'Poster',
  logoUrl: 'Logo',
  bannerImage: 'Banner image',
  thumbnailUrl: 'Thumbnail',
  audioUrl: 'Audio file',
  youtubeUrl: 'YouTube link',
  externalUrl: 'External link',
  linkUrl: 'Link',
  url: 'Link',
  whatsappNumber: 'WhatsApp number',
  startDate: 'Start date',
  endDate: 'End date',
  publishedAt: 'Publish date',
};

/** Turns a field path such as "title.ml" into "Title (Malayalam)". */
export function humanFieldName(path: string): string {
  const [head, ...rest] = path.split('.');
  const words = head
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim();
  const label =
    FIELD_ALIASES[head] ?? words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  const suffix = rest[0];
  if (suffix === 'ml') return `${label} (Malayalam)`;
  if (suffix === 'en') return `${label} (English)`;
  return label;
}

/**
 * Converts an API failure into a sentence a non-technical editor can act on.
 */
export function describeError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as ApiErrorShape | undefined;
  if (!e) return fallback;

  if (e.fields) {
    const names = Object.keys(e.fields).map(humanFieldName);
    if (names.length === 1) return `${names[0]} is required.`;
    if (names.length > 1) {
      const last = names.pop();
      return `Please fill in ${names.join(', ')} and ${last}.`;
    }
  }

  if (e.code === 0) return e.message;
  if (e.code === 409) return e.message || 'That value is already used. Please choose a different one.';
  if (e.code === 413) return 'That file is too large. Please upload a smaller one.';
  if (e.code === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (e.code && e.code >= 500) return 'The server had a problem saving this. Please try again in a moment.';

  return e.message || fallback;
}

export function formatDate(s?: string, full = false) {
  if (!s) return '—';
  const d = new Date(s);
  if (full) return d.toLocaleString();
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Upload one file to the CMS asset endpoint and return its CDN URLs. */
export async function uploadAsset(
  file: File,
  folder: string,
  token: string
): Promise<{ url: string; thumbnailUrl: string; mimeType: string; sizeBytes: number; kind: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  return apiJson('/api/admin/cms/upload', { method: 'POST', formData: fd, token });
}
