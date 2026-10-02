import {
  BookOpen,
  Download,
  History as HistoryIcon,
  Home,
  Images,
  Lightbulb,
  Newspaper,
  Phone,
  ScrollText,
  Sparkles,
  Target,
  Users,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { str } from './i18n';
import type { Lang } from './types';

/** `icon` is shown in the mobile menus only; the desktop nav is text. */
export type NavLeaf = { label: string; to: string; icon?: LucideIcon };
export type NavItem = { label: string; to?: string; icon?: LucideIcon; children?: NavLeaf[] };

/**
 * The site's main navigation (desktop header, tablet drawer and the phone "More"
 * sheet all read from here). `path` turns a route into a language-prefixed path.
 */
export function buildNavItems(path: (to: string) => string, navLang: Lang): NavItem[] {
  return [
    { label: str('home', navLang), to: path('/'), icon: Home },
    {
      label: str('aboutUs', navLang),
      children: [
        { label: str('history', navLang), to: path('/who-we-are/history'), icon: HistoryIcon },
        { label: str('ideology', navLang), to: path('/who-we-are/ideology'), icon: Lightbulb },
        { label: str('objectives', navLang), to: path('/who-we-are/objectives'), icon: Target },
        { label: str('constitution', navLang), to: path('/who-we-are/constitution'), icon: ScrollText },
      ],
    },
    {
      label: str('media', navLang),
      children: [
        { label: str('videos', navLang), to: path('/media/videos'), icon: Video },
        { label: str('photoGallery', navLang), to: path('/media/gallery'), icon: Images },
        { label: str('downloads', navLang), to: path('/media/downloads'), icon: Download },
        { label: str('publications', navLang), to: path('/publications'), icon: BookOpen },
      ],
    },
    { label: str('leaders', navLang), to: path('/leaders'), icon: Users },
    { label: str('contact', navLang), to: path('/contact'), icon: Phone },
  ];
}

/**
 * Phone bottom bar: the four most-used destinations. `match` decides when a tab is
 * the current one (a section's detail pages count too).
 */
export function buildBottomTabs(path: (to: string) => string, navLang: Lang) {
  const strip = (p: string) => p.replace(/^\/(ml|en)/, '') || '/';
  return [
    { label: str('home', navLang), to: path('/'), icon: Home, match: (p: string) => strip(p) === '/' },
    { label: str('programs', navLang), to: path('/programs'), icon: Sparkles, match: (p: string) => strip(p).startsWith('/programs') },
    {
      label: str('news', navLang),
      to: path('/media/news'),
      icon: Newspaper,
      match: (p: string) => /^\/media\/(news|press-release|statement|interview|speech)(\/|$)/.test(strip(p)),
    },
    { label: str('gallery', navLang), to: path('/media/gallery'), icon: Images, match: (p: string) => strip(p).startsWith('/media/gallery') },
  ];
}
