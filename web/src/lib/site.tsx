import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useParams } from 'react-router';
import { useApi } from './api';
import { DEFAULT_LANG, isLang, str } from './i18n';
import type { Lang, Localized, NavPayload } from './types';

function resolveLang(pathname: string, paramLang: string | undefined): Lang {
  if (isLang(paramLang)) return paramLang;
  const prefix = pathname.split('/').filter(Boolean)[0];
  if (isLang(prefix)) return prefix;
  return DEFAULT_LANG;
}

function langPath(lang: Lang, to: string): string {
  return `/${lang}${to.startsWith('/') ? to : `/${to}`}`.replace(/\/$/, '') || `/${lang}`;
}

type SiteContextValue = {
  lang: Lang;
  data: NavPayload | null;
  loading: boolean;
  /** Prefixes a path with the active language, e.g. path('/events') → '/ml/events' */
  path: (to: string) => string;
  /** UI string (button, label, heading, message). UI chrome is always English;
      only the admin-managed content follows the ML/EN toggle. */
  s: (key: string) => string;
  /** UI string for a heading; headings always read in English, whatever the language */
  h: (key: string) => string;
  /** Admin-managed page title (English); falls back to the built-in UI string of the same key */
  pageTitle: (key: string) => string;
  /** Admin-managed section heading block, each field falling back to `defaults`.
      Label and heading are English; the description follows the active language. */
  section: (key: string, defaults?: SectionDefaults) => ResolvedSection;
  /** Turns an admin-entered link into props for Button / anchors: a site path (with or
      without a language prefix) becomes `to`, a full URL becomes `href`. */
  link: (url: string) => { to?: string; href?: string };
};

type SectionDefaults = { label?: string; heading?: string; description?: string };
type ResolvedSection = { label: string; heading: string; description: string; logo: string; linkUrl: string };

/* Managed text is read in the active language only — a missing English value
   uses the built-in English default rather than showing the Malayalam text. */
function managed(value: Localized | undefined, lang: Lang): string {
  return value?.[lang]?.trim() ?? '';
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const { pathname } = useLocation();
  const lang: Lang = resolveLang(pathname, params.lang);
  const { data, loading } = useApi<NavPayload>('/api/site/bootstrap');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const name = data?.settings?.siteName;
    if (name) {
      document.title = lang === 'ml' ? name.ml || name.en : name.en || name.ml;
    }
  }, [data, lang]);

  const value = useMemo<SiteContextValue>(
    () => ({
      lang,
      data,
      loading,
      path: (to: string) => langPath(lang, to),
      s: (key: string) => str(key, 'en'),
      h: (key: string) => str(key, 'en'),
      pageTitle: (key: string) =>
        managed(data?.settings?.content?.pages?.[key]?.title, 'en') || str(key, 'en'),
      section: (key: string, defaults: SectionDefaults = {}) => {
        const content = data?.settings?.content?.sections?.[key];
        return {
          // Labels are English; a label entered only in Malayalam is shown as written
          label: managed(content?.label, 'en') || managed(content?.label, 'ml') || defaults.label || '',
          // Headings are English; a heading entered only in Malayalam is shown as written
          heading: managed(content?.heading, 'en') || managed(content?.heading, 'ml') || defaults.heading || '',
          description: managed(content?.description, lang) || defaults.description || '',
          logo: content?.logo?.trim() || '',
          linkUrl: content?.linkUrl?.trim() || '',
        };
      },
      link: (url: string) => {
        const target = url.trim();
        if (/^(https?:|mailto:|tel:)/i.test(target)) return { href: target };
        // A path saved with its own language prefix still follows the visitor's language
        return { to: langPath(lang, target.replace(/^\/(ml|en)(?=\/|$)/, '')) };
      },
    }),
    [lang, data, loading]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}
