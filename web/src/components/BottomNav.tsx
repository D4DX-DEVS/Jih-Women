import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { ChevronRight, LayoutGrid, X } from 'lucide-react';
import { useSite } from '../lib/site';
import { str, t } from '../lib/i18n';
import { buildBottomTabs, buildNavItems, type NavLeaf } from '../lib/nav';

/**
 * Phone navigation (below md): an app-style bar fixed to the bottom of the screen
 * with the four main destinations and a "More" tab that opens the rest of the site
 * navigation in a bottom sheet. Tablets and desktop keep the header navigation.
 * Like the rest of the site chrome, labels are always English.
 */
export default function BottomNav() {
  const { lang, path, data } = useSite();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = useMemo(() => buildBottomTabs(path, 'en'), [path]);

  /* "More": everything in the main navigation that is not already a tab, grouped
     like the header menu (standalone links first, then each dropdown) */
  const groups = useMemo(() => {
    const tabPaths = new Set(tabs.map((tab) => tab.to));
    const items = buildNavItems(path, 'en');
    const keep = (links: NavLeaf[]) => links.filter((l) => !tabPaths.has(l.to));
    return [
      { label: str('menuMain', 'en'), links: keep(items.filter((i) => i.to).map((i) => ({ label: i.label, to: i.to!, icon: i.icon }))) },
      ...items.filter((i) => i.children?.length).map((i) => ({ label: i.label, links: keep(i.children!) })),
    ].filter((g) => g.links.length);
  }, [path, tabs]);

  const activeTab = tabs.findIndex((tab) => tab.match(pathname));
  const moreActive = activeTab === -1 && groups.some((g) => g.links.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`)));
  // Position of the sliding highlight: a tab, "More" (index 4) when on one of its pages
  const indicator = moreOpen ? tabs.length : activeTab !== -1 ? activeTab : moreActive ? tabs.length : -1;

  // Close the sheet on navigation, and lock page scroll while it is open
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const cell = 'relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0 pt-1 pb-0.5 text-[10px] font-medium leading-none transition-colors';

  return (
    <>
      <nav
        aria-label={str('menu', 'en')}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-plum-100/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgba(44,10,77,0.28)] backdrop-blur md:hidden"
      >
        <div className="relative mx-auto flex h-14 max-w-md px-1.5">
          {/* Sliding highlight behind the current tab: a soft pill plus a gradient bar on top */}
          {indicator !== -1 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-1.5 flex w-[calc((100%-0.75rem)/5)] justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateX(${indicator * 100}%)` }}
            >
              <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-gradient-to-r from-magenta-500 to-plum-500" />
              <span className="mt-1 h-7 w-11 rounded-2xl bg-gradient-to-br from-magenta-50 to-plum-50" />
            </span>
          )}

          {tabs.map((tab, i) => {
            const active = i === activeTab && !moreOpen;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`${cell} ${active ? 'text-magenta-600' : 'text-ink-muted active:text-magenta-600'}`}
              >
                <span className={`grid h-7 w-11 place-items-center transition-transform duration-300 ${active ? '-translate-y-px scale-110' : ''}`}>
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                </span>
                <span className={`max-w-full truncate px-0.5 ${active ? 'text-brand-gradient font-semibold' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={`${cell} ${moreOpen || moreActive ? 'text-magenta-600' : 'text-ink-muted active:text-magenta-600'}`}
          >
            <span className={`grid h-7 w-11 place-items-center transition-transform duration-300 ${moreOpen || moreActive ? '-translate-y-px scale-110' : ''}`}>
              {moreOpen ? <X size={18} strokeWidth={2.3} /> : <LayoutGrid size={18} strokeWidth={moreActive ? 2.3 : 1.9} />}
            </span>
            <span className={`max-w-full truncate px-0.5 ${moreOpen || moreActive ? 'text-brand-gradient font-semibold' : ''}`}>More</span>
          </button>
        </div>
      </nav>

      {moreOpen &&
        createPortal(
          <div key={lang} className="fixed inset-0 z-[45] md:hidden" role="dialog" aria-modal="true" aria-label="More">
            <div className="absolute inset-0 animate-fade-in bg-plum-950/45" onClick={() => setMoreOpen(false)} aria-hidden="true" />
            {/* Sheet sits just above the bar, which stays visible to close it again */}
            <div className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-h-[calc(100dvh-6rem)] animate-sheet-up overflow-y-auto overscroll-contain rounded-t-2xl bg-mist px-3 pb-3 pt-2 shadow-2xl">
              <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-plum-200" aria-hidden="true" />
              <div className="mb-3 flex items-center justify-between">
                <img src="/logo.png" alt={t(data?.settings?.siteName, 'en') || ''} className="h-7 w-auto object-contain object-left" />
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label={str('close', 'en')}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-plum-800 shadow-soft transition active:scale-95"
                >
                  <X size={17} />
                </button>
              </div>
              {groups.map((group) => (
                <section key={group.label} className="mb-3 last:mb-0">
                  <h3 className="mb-1.5 px-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em]">
                    <span className="text-brand-gradient">{group.label}</span>
                  </h3>
                  <ul className="grid grid-cols-2 gap-1.5">
                    {group.links.map(({ label, to, icon: Icon }) => {
                      const active = pathname === to || pathname.startsWith(`${to}/`);
                      return (
                        <li key={to}>
                          <Link
                            to={to}
                            onClick={() => setMoreOpen(false)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[12.5px] font-medium transition active:scale-[0.98] ${
                              active ? 'border-magenta-200 bg-magenta-50/70 text-magenta-600' : 'border-plum-100 bg-white text-plum-800'
                            }`}
                          >
                            {Icon && (
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-magenta-50 to-plum-50 text-magenta-600">
                                <Icon size={15} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1 leading-snug">{label}</span>
                            <ChevronRight size={14} className="shrink-0 text-ink-faint" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
