import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  Facebook,
  Instagram,
  Menu,
  Search,
  Sparkles,
  Twitter,
  X,
  Youtube,
} from 'lucide-react';
import { useSite } from '../lib/site';
import { str, t } from '../lib/i18n';
import { buildNavItems, type NavItem } from '../lib/nav';
import { CONTAINER_CLASS } from './Primitives';

/* Same width and padding as every page section, so the edges line up */
const SHELL = CONTAINER_CLASS;

export default function Header() {
  const { lang, data, path } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus the header search as it expands
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

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


  /* Header chrome (desktop nav + mobile drawer) is always shown in English,
     independent of the site's ML/EN toggle — only page content follows it. */
  const items: NavItem[] = useMemo(() => buildNavItems(path, 'en'), [path]);

  /* Mobile menu categories, derived from the same items: every standalone link
     goes under "Main", and each dropdown becomes a category of its own. */
  const menuGroups = useMemo(
    () => [
      {
        label: str('menuMain', 'en'),
        links: items.filter((i) => i.to).map((i) => ({ label: i.label, to: i.to!, icon: i.icon })),
      },
      ...items.filter((i) => i.children?.length).map((i) => ({ label: i.label, links: i.children! })),
    ],
    [items]
  );

  const socials = [
    { href: settings?.social?.facebook, Icon: Facebook, label: 'Facebook' },
    { href: settings?.social?.instagram, Icon: Instagram, label: 'Instagram' },
    { href: settings?.social?.youtube, Icon: Youtube, label: 'YouTube' },
    { href: settings?.social?.twitter, Icon: Twitter, label: 'X' },
  ].filter((x) => Boolean(x.href));

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

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-magenta-500 focus:px-5 focus:py-2 focus:text-sm focus:text-white"
      >
        {str('skipToContent', 'en')}
      </a>

      {/* Announcement bar — always English, independent of the ML/EN toggle; hidden on
          phones, where the header is a single slim bar */}
      <div className="hidden bg-plum-800 text-white md:block">
        <div className={SHELL}>
        <div className="flex h-8 items-center justify-between gap-2 text-[12px] sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-magenta-300" />
              <span className="truncate text-white/80">
                {t(settings?.topBarText, 'en') || t(settings?.tagline, 'en')}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {socials.length > 0 && (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-white/55">{str('followUsShort', 'en')}</span>
                  {/* Each link is a 32px touch area around the same 24px circle */}
                  <div className="flex items-center">
                    {socials.map(({ href, Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="group grid h-8 w-8 place-items-center"
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-magenta-500 text-white transition group-hover:bg-magenta-400">
                          <Icon size={12} />
                        </span>
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
        {/* Logo on the left; navigation and search grouped on the right. One height and
            width on every page (no per-page variants). */}
        <div className="flex h-12 min-w-0 items-center justify-between gap-2 md:h-16 lg:h-20 xl:gap-6">
            <Link
              to={path('/')}
              className="flex shrink-0 items-center"
              aria-label={t(settings?.siteName, 'en') || "Women's Wing Kerala"}
            >
              {/* The bundled mark already carries the full organisation name,
                  so no wordmark text is rendered beside it. */}
              <img
                src="/logo.png"
                alt={t(settings?.siteName, 'en') || "Women's Wing Kerala"}
                className={`w-auto max-w-[60vw] object-contain object-left h-8 md:h-12 lg:h-16`}
              />
            </Link>

            <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-4">
              <nav className="hidden items-center xl:flex 2xl:gap-1">
                {items.map((item) => {
                  const active = isActive(item);
                  const expanded = openMenu === item.label;
                  /* Active item keeps the solid underline; others grow a soft one on hover */
                  const underline = `pointer-events-none absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-center rounded-full transition-transform duration-300 ${
                    active ? 'scale-x-100 bg-magenta-500' : 'scale-x-0 bg-magenta-300 group-hover:scale-x-100'
                  }`;
                  const itemCls = `group relative flex items-center gap-1 whitespace-nowrap px-3.5 py-2 text-[14px] font-medium transition-colors ${
                    active || expanded ? 'text-magenta-500' : 'text-ink/75 hover:text-magenta-500'
                  }`;
                  if (!item.children) {
                    return (
                      <Link key={item.label} to={item.to!} className={itemCls} aria-current={active ? 'page' : undefined}>
                        {item.label}
                        <span className={underline} />
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
                      <button className={itemCls} aria-expanded={expanded} aria-haspopup="true">
                        {item.label}
                        <ChevronDown
                          size={13}
                          className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                        <span className={underline} />
                      </button>
                      {expanded && (
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

              {/* Search: the icon expands sideways into a field in place, with no panel
                  below and no change in header height. On xl it grows within the row (the
                  nav slides left); on smaller screens it overlays the header row leftwards
                  from the icon, so nothing else moves. */}
              <div className="relative h-10 w-10 shrink-0 xl:w-auto">
                <form
                  onSubmit={submitSearch}
                  role="search"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false);
                  }}
                  className={`absolute end-0 top-0 z-20 flex h-10 items-center overflow-hidden rounded-full border transition-[width,background-color,border-color,box-shadow] duration-300 ease-out xl:static ${
                    searchOpen
                      ? 'w-[min(calc(100vw-5rem),22rem)] border-plum-100 bg-white shadow-soft focus-within:border-magenta-200 focus-within:ring-2 focus-within:ring-magenta-100 xl:w-64'
                      : 'w-10 border-transparent bg-magenta-50 hover:bg-magenta-100/70'
                  }`}
                >
                  <button
                    type={searchOpen ? 'submit' : 'button'}
                    onClick={searchOpen ? undefined : () => setSearchOpen(true)}
                    aria-label={str('search', 'en')}
                    aria-expanded={searchOpen}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                      searchOpen ? 'text-ink-faint hover:text-magenta-600' : 'text-magenta-600'
                    }`}
                  >
                    <Search size={17} />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`${str('search', 'en')}...`}
                    aria-label={str('search', 'en')}
                    tabIndex={searchOpen ? 0 : -1}
                    className={`min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none transition-opacity duration-200 placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden ${
                      searchOpen ? 'opacity-100 delay-100' : 'pointer-events-none opacity-0'
                    }`}
                  />
                  {searchOpen && (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      aria-label={str('close', 'en')}
                      className="me-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-magenta-50 hover:text-magenta-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                aria-label={str('menu', 'en')}
                /* Tablets only: phones use the bottom navigation bar (BottomNav) */
                className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-plum-800 transition hover:bg-magenta-50 md:grid xl:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer — portaled above page content; always rendered in English */}
      {mobileOpen &&
        createPortal(
          <div key={lang} className="fixed inset-0 z-[100] xl:hidden">
            <div
              className="absolute inset-0 bg-plum-950/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 end-0 z-10 flex w-[88%] max-w-sm animate-fade-in flex-col bg-mist shadow-2xl">
              {/* Compact top: the organisation mark, close and site search */}
              <div className="shrink-0 border-b border-plum-100 bg-white px-4 pb-3 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={path('/')}
                    className="min-w-0"
                    aria-label={t(settings?.siteName, 'en') || str('home', 'en')}
                  >
                    <img src="/logo.png" alt="" className="h-10 w-auto max-w-full object-contain object-left" />
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label={str('close', 'en')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-plum-50 text-plum-800 transition hover:bg-magenta-50 hover:text-magenta-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form
                  onSubmit={submitSearch}
                  role="search"
                  className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-plum-100 bg-mist px-3 focus-within:border-magenta-300"
                >
                  <Search size={16} className="shrink-0 text-ink-faint" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={str('searchPlaceholder', 'en')}
                    aria-label={str('search', 'en')}
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
                  />
                </form>
              </div>

              {/* Categorised listing: standalone links under "Main", then each
                  dropdown from the nav as its own category */}
              <nav aria-label={str('menu', 'en')} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                {menuGroups.map((group) => (
                  <section key={group.label} className="mb-5 last:mb-0">
                    <h3 className="mb-2 px-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      {group.label}
                    </h3>
                    <ul className="divide-y divide-plum-100/70 overflow-hidden rounded-2xl border border-plum-100 bg-white">
                      {group.links.map(({ label, to, icon: Icon }) => {
                        const active = location.pathname === to;
                        return (
                          <li key={to}>
                            <Link
                              to={to}
                              // also closes when tapping the page already open (no route change)
                              onClick={() => setMobileOpen(false)}
                              aria-current={active ? 'page' : undefined}
                              className={`flex min-h-[50px] items-center gap-3 px-3.5 py-2 text-[14.5px] font-medium transition ${
                                active ? 'bg-magenta-50/70 text-magenta-600' : 'text-plum-800 hover:bg-magenta-50/50'
                              }`}
                            >
                              {Icon && (
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-magenta-50 text-magenta-600">
                                  <Icon size={16} />
                                </span>
                              )}
                              <span className="min-w-0 flex-1 leading-snug">{label}</span>
                              <ChevronRight size={16} className="shrink-0 text-ink-faint" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </nav>

              {socials.length > 0 && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-plum-100 bg-white px-4 py-3">
                  <span className="text-[12px] text-ink-muted">{str('followUsShort', 'en')}</span>
                  <div className="flex items-center gap-2">
                    {socials.map(({ href, Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="grid h-9 w-9 place-items-center rounded-full bg-magenta-50 text-magenta-600 transition hover:bg-magenta-500 hover:text-white"
                      >
                        <Icon size={15} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
