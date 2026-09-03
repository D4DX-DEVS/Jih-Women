import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Twitter,
  UserPlus,
  X,
  Youtube,
} from 'lucide-react';
import { useSite } from '../lib/site';
import { LANGS, str, t, tLang } from '../lib/i18n';
import type { Lang } from '../lib/types';

/* The header needs more room than the 1200px page grid: seven Malayalam
   nav labels plus the logo and the join button do not fit inside it. */
const SHELL = 'mx-auto w-full min-w-0 max-w-[1320px] px-4 sm:px-5 lg:px-8';

type NavLeaf = { label: string; to: string };
type NavItem = { label: string; to?: string; children?: NavLeaf[] };

export default function Header() {
  const { lang, data, path, s } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const pageKey = `${location.pathname.replace(/^\/(ml|en)/, '') || '/'}${location.search}`;

  useEffect(() => {
    // Close overlays on real page navigation only — not when switching ML↔EN on the same page,
    // so the open mobile menu can refresh to the selected language immediately.
    setMobileOpen(false);
    setOpenMenu(null);
    setSearchOpen(false);
  }, [pageKey]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const settings = data?.settings;
  const departments = data?.nav.departments ?? [];
  const programs = data?.nav.programs ?? [];

  const items: NavItem[] = useMemo(
    () => [
      { label: str('home', lang), to: path('/') },
      {
        label: str('aboutUs', lang),
        children: [
          { label: str('ideology', lang), to: path('/who-we-are/ideology') },
          { label: str('ourValues', lang), to: path('/who-we-are/our-values') },
          { label: str('constitution', lang), to: path('/who-we-are/constitution') },
          { label: str('ourLegacy', lang), to: path('/who-we-are/our-legacy') },
          { label: str('leaders', lang), to: path('/leaders') },
        ],
      },
      {
        label: str('departments', lang),
        children: [
          ...departments
            .map((d) => ({
              label: tLang(d.title, lang),
              to: path(`/departments/${d.slug}`),
            }))
            .filter((c) => Boolean(c.label)),
          { label: str('viewAll', lang), to: path('/departments') },
        ],
      },
      {
        label: str('programs', lang),
        children: [
          ...programs
            .map((p) => ({
              label: tLang(p.title, lang),
              to: path(`/programs/${p.slug}`),
            }))
            .filter((c) => Boolean(c.label)),
          { label: str('viewAll', lang), to: path('/programs') },
        ],
      },
      { label: str('events', lang), to: path('/events') },
      {
        label: str('mediaNews', lang),
        children: [
          { label: str('news', lang), to: path('/media/news') },
          { label: str('pressReleases', lang), to: path('/media/press-release') },
          { label: str('statements', lang), to: path('/media/statement') },
          { label: str('interviews', lang), to: path('/media/interview') },
          { label: str('speeches', lang), to: path('/media/speech') },
          { label: str('videos', lang), to: path('/media/videos') },
          { label: str('podcasts', lang), to: path('/media/podcasts') },
          { label: str('photoGallery', lang), to: path('/media/gallery') },
          { label: str('downloads', lang), to: path('/media/downloads') },
          { label: str('publications', lang), to: path('/publications') },
          { label: str('externalLinks', lang), to: path('/links') },
        ],
      },
      { label: str('contact', lang), to: path('/contact') },
    ],
    [lang, departments, programs, path]
  );

  const socials = [
    { href: settings?.social?.facebook, Icon: Facebook, label: 'Facebook' },
    { href: settings?.social?.instagram, Icon: Instagram, label: 'Instagram' },
    { href: settings?.social?.youtube, Icon: Youtube, label: 'YouTube' },
    { href: settings?.social?.twitter, Icon: Twitter, label: 'X' },
    { href: settings?.social?.whatsappChannel, Icon: MessageCircle, label: 'WhatsApp' },
    { href: settings?.email ? `mailto:${settings.email}` : '', Icon: Mail, label: 'Email' },
  ].filter((x) => Boolean(x.href));

  const switchLang = (next: Lang) => {
    const rest = location.pathname.replace(/^\/(ml|en)/, '');
    navigate(`/${next}${rest}${location.search}`);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    navigate(`${path('/search')}?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const isActive = (item: NavItem) =>
    item.to
      ? location.pathname === item.to
      : Boolean(item.children?.some((c) => location.pathname === c.to));

  const joinUrl = settings?.joinUrl || path('/contact');
  const joinIsExternal = /^https?:\/\//.test(joinUrl);
  const joinLabel = tLang(settings?.joinLabel, lang) || str('joinUs', lang);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-magenta-500 focus:px-5 focus:py-2 focus:text-sm focus:text-white"
      >
        {s('skipToContent')}
      </a>

      {/* Announcement bar */}
      <div className="bg-plum-800 text-white">
        <div className={SHELL}>
        <div className="flex h-10 items-center justify-between gap-2 text-[12.5px] sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-magenta-300" />
              <span className="truncate text-white/80">
                {t(settings?.topBarText, lang) || t(settings?.tagline, lang)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center rounded-full bg-white/10 p-0.5">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLang(l.code)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      lang === l.code ? 'bg-magenta-500 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {l.short}
                  </button>
                ))}
              </div>

              {socials.length > 0 && (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-white/55">{s('followUsShort')}</span>
                  <div className="flex items-center gap-1.5">
                    {socials.map(({ href, Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="grid h-6 w-6 place-items-center rounded-full bg-magenta-500 text-white transition hover:bg-magenta-400"
                      >
                        <Icon size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 border-b border-plum-100 bg-white/95 shadow-[0_1px_16px_-8px_rgba(44,10,77,0.25)] backdrop-blur">
        <div className={SHELL}>
        <div className="flex h-[74px] min-w-0 items-center justify-between gap-2 lg:h-[84px] xl:gap-5">
            <Link
              to={path('/')}
              className="flex shrink-0 items-center"
              aria-label={t(settings?.siteName, lang) || "Women's Wing Kerala"}
            >
              {/* The bundled mark already carries the full organisation name,
                  so no wordmark text is rendered beside it. */}
              <img
                src="/logo.png"
                alt={t(settings?.siteName, lang) || "Women's Wing Kerala"}
                className="h-9 w-auto object-contain object-left sm:h-10 lg:h-11"
              />
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              {items.map((item) => {
                const active = isActive(item);
                if (!item.children) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to!}
                      className={`relative whitespace-nowrap px-1.5 py-2 text-[12.5px] font-medium transition 2xl:px-3 2xl:text-[13.5px] ${
                        active ? 'text-magenta-500' : 'text-ink/75 hover:text-magenta-500'
                      }`}
                    >
                      {item.label}
                      {active && (
                        <span className="absolute inset-x-1.5 -bottom-0.5 h-0.5 rounded-full bg-magenta-500 2xl:inset-x-3" />
                      )}
                    </Link>
                  );
                }
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(item.label)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      className={`relative flex items-center gap-0.5 whitespace-nowrap px-1.5 py-2 text-[12.5px] font-medium transition 2xl:gap-1 2xl:px-3 2xl:text-[13.5px] ${
                        active || openMenu === item.label
                          ? 'text-magenta-500'
                          : 'text-ink/75 hover:text-magenta-500'
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform ${
                          openMenu === item.label ? 'rotate-180' : ''
                        }`}
                      />
                      {active && (
                        <span className="absolute inset-x-1.5 -bottom-0.5 h-0.5 rounded-full bg-magenta-500 2xl:inset-x-3" />
                      )}
                    </button>
                    {openMenu === item.label && (
                      <div className="no-scrollbar absolute start-0 top-full z-50 max-h-[70vh] w-[248px] overflow-y-auto rounded-2xl border border-plum-100 bg-white pb-2 shadow-lift">
                        <span className="sticky top-0 block h-1 w-full bg-gradient-to-r from-magenta-500 to-plum-500" />
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="block px-4 py-2.5 text-[13px] text-ink/70 transition hover:bg-magenta-50 hover:text-magenta-600"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={s('search')}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-muted transition hover:bg-magenta-50 hover:text-magenta-600"
              >
                <Search size={18} />
              </button>

              {joinIsExternal ? (
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-magenta-500 px-4 py-2.5 text-[13px] font-medium text-white shadow-pink transition hover:bg-magenta-600 sm:inline-flex lg:px-5"
                >
                  <UserPlus size={15} />
                  {joinLabel}
                </a>
              ) : (
                <Link
                  to={joinUrl}
                  className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-magenta-500 px-4 py-2.5 text-[13px] font-medium text-white shadow-pink transition hover:bg-magenta-600 sm:inline-flex lg:px-5"
                >
                  <UserPlus size={15} />
                  {joinLabel}
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(true)}
                aria-label={s('menu')}
                className="grid h-10 w-10 place-items-center rounded-full text-plum-800 transition hover:bg-magenta-50 xl:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-plum-100 bg-white">
            <div className={SHELL}>
              <form onSubmit={submitSearch} className="flex items-center gap-3 py-4">
                <Search size={18} className="shrink-0 text-ink-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={s('searchPlaceholder')}
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label={s('close')}
                  className="text-ink-faint transition hover:text-ink"
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer — portaled above page content; labels follow active lang */}
      {mobileOpen &&
        createPortal(
          <div key={lang} className="fixed inset-0 z-[100] xl:hidden">
            <div
              className="absolute inset-0 bg-plum-950/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 end-0 z-10 flex w-[88%] max-w-sm animate-fade-in flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-plum-100 px-5 py-4">
                <span className="font-display text-base font-semibold text-plum-800">
                  {str('menu', lang)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-full bg-plum-50 p-0.5">
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => switchLang(l.code)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                          lang === l.code
                            ? 'bg-magenta-500 text-white'
                            : 'text-plum-800/55 hover:text-plum-800'
                        }`}
                      >
                        {l.short}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label={str('close', lang)}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-magenta-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {items.map((item) =>
                  item.children ? (
                    <details key={`${lang}-${item.to ?? item.label}`} className="group border-b border-plum-100/70">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[15px] font-medium text-plum-800">
                        {item.label}
                        <ChevronDown size={16} className="opacity-50 transition group-open:rotate-180" />
                      </summary>
                      <div className="pb-3 ps-3">
                        {item.children.map((child) =>
                          child.label ? (
                            <Link
                              key={child.to}
                              to={child.to}
                              className="block py-2 text-[14px] text-ink-muted hover:text-magenta-600"
                            >
                              {child.label}
                            </Link>
                          ) : null
                        )}
                      </div>
                    </details>
                  ) : (
                    <Link
                      key={`${lang}-${item.to}`}
                      to={item.to!}
                      className="block border-b border-plum-100/70 py-3.5 text-[15px] font-medium text-plum-800 hover:text-magenta-600"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>

              <div className="border-t border-plum-100 p-4">
                <Link
                  to={joinUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-magenta-500 px-5 py-3 text-sm font-medium text-white"
                >
                  <UserPlus size={16} />
                  {joinLabel}
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
