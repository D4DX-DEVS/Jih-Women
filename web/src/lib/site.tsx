import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { useApi } from './api';
import { DEFAULT_LANG, isLang, str } from './i18n';
import type { Lang, NavPayload } from './types';

type SiteContextValue = {
  lang: Lang;
  data: NavPayload | null;
  loading: boolean;
  /** Prefixes a path with the active language, e.g. path('/events') → '/ml/events' */
  path: (to: string) => string;
  /** UI string lookup in the active language */
  s: (key: string) => string;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
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
      path: (to: string) => `/${lang}${to.startsWith('/') ? to : `/${to}`}`.replace(/\/$/, '') || `/${lang}`,
      s: (key: string) => str(key, lang),
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
