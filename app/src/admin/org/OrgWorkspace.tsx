import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Images,
  LayoutDashboard,
  Link2,
  Mail,
  Megaphone,
  Menu,
  Network,
  Newspaper,
  Send,
  Settings,
  Target,
  Users,
  Video,
  X,
} from 'lucide-react';
import { apiJson, isAuthError } from '../shared/api';
import { SectionCard, Spinner } from '../shared/ui';
import { sectionPreviewUrl } from './preview';
import CollectionManager from './CollectionManager';
import ContactInbox from './ContactInbox';
import EventRsvpManager from './EventRsvpManager';
import NewsletterManager from './NewsletterManager';
import SiteSettingsManager from './SiteSettingsManager';
import {
  ALBUMS,
  CAMPAIGNS,
  FOCUS_AREAS,
  DEPARTMENTS,
  DOWNLOADS,
  EVENTS,
  EXTERNAL_LINKS,
  LEADERS,
  MEDIA_POSTS,
  PAGES,
  PROGRAMS,
  PUBLICATIONS,
  SLIDERS,
  VIDEOS,
} from './collections';
import type { CollectionConfig } from './CollectionManager';

type Stats = Record<string, number>;

type EntryKind = 'collection' | 'overview' | 'settings' | 'contact' | 'rsvps' | 'newsletter';

type NavEntry = {
  key: string;
  label: string;
  kind: EntryKind;
  Icon: typeof LayoutDashboard;
  config?: CollectionConfig;
  badge?: keyof Stats;
  /** Counts that represent unattended work; surfaced on a collapsed group. */
  alert?: boolean;
};

/** `key` is stable and safe to persist; `title` is display copy and may change. */
type NavGroup = { key: string; title: string; entries: NavEntry[] };

/* Always visible, above the accordion — these are destinations, not a content
   collection, so hiding them behind a group would only add a click. */
const PINNED: NavEntry[] = [
  { key: 'overview', label: 'Dashboard', kind: 'overview', Icon: LayoutDashboard },
  { key: 'site-settings', label: 'Site Settings', kind: 'settings', Icon: Settings },
];

const NAV: NavGroup[] = [
  {
    key: 'home',
    title: 'Home page',
    entries: [
      { key: SLIDERS.key, label: SLIDERS.label, kind: 'collection', config: SLIDERS, badge: 'sliders', Icon: Images },
      { key: FOCUS_AREAS.key, label: FOCUS_AREAS.label, kind: 'collection', config: FOCUS_AREAS, badge: 'focusAreas', Icon: Target },
      { key: CAMPAIGNS.key, label: CAMPAIGNS.label, kind: 'collection', config: CAMPAIGNS, badge: 'campaigns', Icon: Megaphone },
    ],
  },
  {
    key: 'organisation',
    title: 'Organisation',
    entries: [
      { key: PAGES.key, label: 'Who We Are', kind: 'collection', config: PAGES, badge: 'pages', Icon: FileText },
      { key: DEPARTMENTS.key, label: DEPARTMENTS.label, kind: 'collection', config: DEPARTMENTS, badge: 'departments', Icon: Network },
      { key: PROGRAMS.key, label: PROGRAMS.label, kind: 'collection', config: PROGRAMS, badge: 'programs', Icon: BookOpen },
      { key: LEADERS.key, label: LEADERS.label, kind: 'collection', config: LEADERS, badge: 'leaders', Icon: Users },
    ],
  },
  {
    key: 'events',
    title: 'Events',
    entries: [
      { key: EVENTS.key, label: EVENTS.label, kind: 'collection', config: EVENTS, badge: 'events', Icon: CalendarDays },
      { key: 'event-rsvps', label: 'Registrations', kind: 'rsvps', badge: 'eventRsvps', alert: true, Icon: ClipboardList },
    ],
  },
  {
    key: 'media',
    title: 'Media centre',
    entries: [
      { key: MEDIA_POSTS.key, label: MEDIA_POSTS.label, kind: 'collection', config: MEDIA_POSTS, badge: 'mediaPosts', Icon: Newspaper },
      { key: VIDEOS.key, label: VIDEOS.label, kind: 'collection', config: VIDEOS, badge: 'videos', Icon: Video },
      { key: ALBUMS.key, label: ALBUMS.label, kind: 'collection', config: ALBUMS, badge: 'albums', Icon: Images },
      { key: DOWNLOADS.key, label: DOWNLOADS.label, kind: 'collection', config: DOWNLOADS, badge: 'downloads', Icon: Download },
    ],
  },
  {
    key: 'library',
    title: 'Library & links',
    entries: [
      { key: PUBLICATIONS.key, label: PUBLICATIONS.label, kind: 'collection', config: PUBLICATIONS, badge: 'publications', Icon: BookMarked },
      { key: EXTERNAL_LINKS.key, label: EXTERNAL_LINKS.label, kind: 'collection', config: EXTERNAL_LINKS, badge: 'links', Icon: Link2 },
    ],
  },
  {
    key: 'inbox',
    title: 'Inbox',
    entries: [
      { key: 'contact', label: 'Contact Messages', kind: 'contact', badge: 'unreadMessages', alert: true, Icon: Mail },
      { key: 'newsletter', label: 'Newsletter', kind: 'newsletter', badge: 'subscribers', Icon: Send },
    ],
  },
];

const ALL_ENTRIES: NavEntry[] = [...PINNED, ...NAV.flatMap((g) => g.entries)];

const GROUP_OF: Record<string, string> = Object.fromEntries(
  NAV.flatMap((g) => g.entries.map((e) => [e.key, g.key]))
);

const STORAGE_KEY = 'org_admin_section';
const GROUPS_KEY = 'org_admin_nav_groups';

/** Reads persisted group expansion, discarding anything that no longer exists. */
function readOpenGroups(active: string): string[] {
  const valid = new Set(NAV.map((g) => g.key));
  const owning = GROUP_OF[active];
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const kept = parsed.filter((k): k is string => typeof k === 'string' && valid.has(k));
        // The group holding the current section is always open, so the active
        // item can never be hidden inside a collapsed group on load.
        return owning && !kept.includes(owning) ? [...kept, owning] : kept;
      }
    }
  } catch {
    // A corrupt value must not blank the navigation.
  }
  return owning ? [owning] : [NAV[0].key];
}

type Props = {
  token: string;
  onToast: (message: string, kind?: 'success' | 'error') => void;
  onLogout: () => void;
};

export default function OrgWorkspace({ token, onToast, onLogout }: Props) {
  const [active, setActive] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || 'overview'
  );
  const [stats, setStats] = useState<Stats | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    readOpenGroups(localStorage.getItem(STORAGE_KEY) || 'overview')
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiJson<Stats>('/api/admin/cms/stats', { token });
      setStats(data);
    } catch (err) {
      if (isAuthError(err)) onLogout();
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadStats();
  }, [loadStats, active]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active);
  }, [active]);

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  // The drawer is a full-screen overlay; leaving the page scrollable behind it
  // lets a touch drag scroll the content instead of the nav.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const entry = useMemo(
    () => ALL_ENTRIES.find((e) => e.key === active) ?? PINNED[0],
    [active]
  );

  const select = useCallback((key: string) => {
    setActive(key);
    setDrawerOpen(false);
    // Opening a section from the dashboard or the drawer must also reveal it in
    // the rail, otherwise the sidebar shows no active item.
    const group = GROUP_OF[key];
    if (group) setOpenGroups((prev) => (prev.includes(group) ? prev : [...prev, group]));
  }, []);

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const nav = (
    <SideNav
      active={active}
      stats={stats}
      openGroups={openGroups}
      onSelect={select}
      onToggleGroup={toggleGroup}
    />
  );

  return (
    <div className="mx-auto flex max-w-[1560px] flex-col gap-5 px-4 py-5 md:px-6 lg:flex-row">
      {/* Below lg the rail would push ~900px of links above the content, so it
          is replaced by a sticky trigger that opens the nav as an overlay. */}
      <div
        className="sticky z-30 -mx-4 border-b border-[#e6e8f0] bg-white/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6 lg:hidden"
        style={{ top: 'var(--admin-header-h)' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex w-full items-center gap-2.5 text-left"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e6e8f0] text-foreground/60">
            <Menu size={16} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Section
            </span>
            <span className="admin-display block truncate text-[13.5px] font-semibold">
              {entry.label}
            </span>
          </span>
          <AlertTotal stats={stats} />
        </button>
      </div>

      {drawerOpen && (
        <>
          <div className="side-scrim lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="side-drawer p-2.5 lg:hidden" role="dialog" aria-label="Sections">
            <div className="mb-1 flex items-center justify-between px-2 py-1.5">
              <span className="admin-display text-[13.5px] font-semibold">Sections</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-foreground/40 transition hover:bg-black/5"
              >
                <X size={16} />
              </button>
            </div>
            {nav}
          </div>
        </>
      )}

      <aside className="hidden shrink-0 lg:block lg:w-[236px]">
        <div
          className="side-nav slim-scroll p-2.5 lg:sticky lg:overflow-y-auto"
          style={{
            top: 'calc(var(--admin-header-h) + 14px)',
            maxHeight: 'calc(100vh - var(--admin-header-h) - 28px)',
          }}
        >
          {nav}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {entry.kind === 'overview' ? (
          <Overview stats={stats} onOpen={select} />
        ) : entry.kind === 'settings' ? (
          <SiteSettingsManager token={token} onToast={onToast} onLogout={onLogout} />
        ) : entry.kind === 'contact' ? (
          <ContactInbox token={token} onToast={onToast} onLogout={onLogout} />
        ) : entry.kind === 'rsvps' ? (
          <EventRsvpManager token={token} onToast={onToast} onLogout={onLogout} />
        ) : entry.config ? (
          <CollectionManager
            key={entry.config.key}
            config={entry.config}
            token={token}
            onToast={onToast}
            onLogout={onLogout}
          />
        ) : (
          <NewsletterManager token={token} onToast={onToast} onLogout={onLogout} />
        )}
      </main>
    </div>
  );
}

/** Total of the counts that represent unattended work, for the mobile trigger. */
function AlertTotal({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const total = ALL_ENTRIES.filter((e) => e.alert && e.badge).reduce(
    (sum, e) => sum + (stats[e.badge as string] ?? 0),
    0
  );
  if (total <= 0) return null;
  return <span className="side-count side-count-alert ms-auto">{total}</span>;
}

function SideNav({
  active,
  stats,
  openGroups,
  onSelect,
  onToggleGroup,
}: {
  active: string;
  stats: Stats | null;
  openGroups: string[];
  onSelect: (key: string) => void;
  onToggleGroup: (key: string) => void;
}) {
  const renderLink = (e: NavEntry) => {
    const count = e.badge && stats ? stats[e.badge] : undefined;
    const isActive = active === e.key;
    return (
      <button
        key={e.key}
        onClick={() => onSelect(e.key)}
        aria-current={isActive ? 'page' : undefined}
        className={`side-link ${isActive ? 'side-link-active' : ''}`}
      >
        <e.Icon size={15} strokeWidth={2} />
        <span className="cell-truncate">{e.label}</span>
        {count !== undefined && count > 0 && (
          <span className={`side-count ${e.alert ? 'side-count-alert' : ''}`}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <nav className="space-y-0.5">
      {PINNED.map(renderLink)}

      <div className="!mt-2 space-y-0.5 border-t border-[#eef0f6] pt-2">
        {NAV.map((group) => {
          const open = openGroups.includes(group.key);
          const panelId = `side-group-${group.key}`;
          // While collapsed, surface any unattended work inside the group —
          // otherwise the accordion would hide the only new-work signal.
          const pending = stats
            ? group.entries
                .filter((e) => e.alert && e.badge)
                .reduce((sum, e) => sum + (stats[e.badge as string] ?? 0), 0)
            : 0;

          return (
            <div key={group.key}>
              <button
                onClick={() => onToggleGroup(group.key)}
                aria-expanded={open}
                aria-controls={panelId}
                className="side-group"
              >
                <span>{group.title}</span>
                {!open && pending > 0 && (
                  <span className="side-count side-count-alert ms-auto">{pending}</span>
                )}
                <ChevronRight size={13} className="side-group-caret" />
              </button>

              <div id={panelId} className="side-group-panel" data-open={open}>
                <div>
                  <div className="space-y-0.5 py-0.5 ps-1.5">{group.entries.map(renderLink)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

const OVERVIEW_TILES: { key: string; label: string; target: string }[] = [
  { key: 'sliders', label: 'Home slides', target: 'sliders' },
  { key: 'focusAreas', label: 'Focus areas', target: 'focus-areas' },
  { key: 'campaigns', label: 'Campaigns', target: 'campaigns' },
  { key: 'pages', label: 'Pages', target: 'pages' },
  { key: 'departments', label: 'Departments', target: 'departments' },
  { key: 'programs', label: 'Programmes', target: 'programs' },
  { key: 'leaders', label: 'Leaders', target: 'leaders' },
  { key: 'upcomingEvents', label: 'Upcoming events', target: 'events' },
  { key: 'mediaPosts', label: 'News & statements', target: 'media-posts' },
  { key: 'videos', label: 'Videos & podcasts', target: 'videos' },
  { key: 'albums', label: 'Albums', target: 'albums' },
  { key: 'publications', label: 'Publications', target: 'publications' },
  { key: 'downloads', label: 'Downloads', target: 'downloads' },
];

function Overview({ stats, onOpen }: { stats: Stats | null; onOpen: (key: string) => void }) {
  const siteUrl = sectionPreviewUrl('overview');

  if (!stats) {
    return (
      <div className="text-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="admin-display text-[22px] font-semibold leading-tight">
            Organisation Website
          </h2>
          <p className="mt-1 text-[13px] text-foreground/55">
            Everything published on the Women&rsquo;s Wing website is managed from here.
          </p>
        </div>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noreferrer" className="preview-btn">
            <ExternalLink size={14} />
            View website
          </a>
        )}
      </div>

      {(stats.unreadMessages > 0 || stats.eventRsvps > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onOpen('contact')}
            className="glass p-4 text-left transition hover:border-[#e6187e]/40"
          >
            <div className="text-[11px] uppercase tracking-wider text-foreground/45">
              Unread messages
            </div>
            <div className="admin-display mt-1.5 text-[26px] font-semibold text-[#e6187e]">
              {stats.unreadMessages ?? 0}
            </div>
          </button>
          <button
            onClick={() => onOpen('event-rsvps')}
            className="glass p-4 text-left transition hover:border-[#e6187e]/40"
          >
            <div className="text-[11px] uppercase tracking-wider text-foreground/45">
              Event registrations
            </div>
            <div className="admin-display mt-1.5 text-[26px] font-semibold">
              {stats.eventRsvps ?? 0}
            </div>
          </button>
        </div>
      )}

      <SectionCard title="Content" description="Click any tile to manage that section.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {OVERVIEW_TILES.map((tile) => (
            <button
              key={tile.key}
              onClick={() => onOpen(tile.target)}
              className="rounded-xl border border-[#e6e8f0] bg-[#f8f9fc] p-4 text-left transition hover:border-[#e6187e]/40 hover:bg-white"
            >
              <div className="admin-display text-[22px] font-semibold">{stats[tile.key] ?? 0}</div>
              <div className="mt-0.5 text-[12px] text-foreground/55">{tile.label}</div>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
