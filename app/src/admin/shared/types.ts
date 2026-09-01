/** Bilingual text stored on every CMS document. Malayalam is mandatory. */
export type Localized = { ml: string; en: string };

export type Attachment = {
  title: Localized;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type MediaItem = {
  url: string;
  thumbnailUrl: string;
  caption: Localized;
  kind: 'image' | 'video';
};

export type Person = {
  name: Localized;
  designation: Localized;
  photo: string;
};

export type Bullet = { text: Localized };

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type Toast = { id: number; message: string; kind: 'success' | 'error' };

export const emptyLocalized = (): Localized => ({ ml: '', en: '' });

export const LANGUAGES: { code: keyof Localized; label: string; required: boolean }[] = [
  { code: 'ml', label: 'Malayalam', required: true },
  { code: 'en', label: 'English', required: false },
];

/** Reads a bilingual value with Malayalam fallback. */
export function text(value: Localized | undefined, lang: keyof Localized = 'ml'): string {
  if (!value) return '';
  return value[lang] || value.ml || value.en || '';
}
