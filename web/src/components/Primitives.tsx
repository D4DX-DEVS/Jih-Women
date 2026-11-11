import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Download, LayoutGrid, List, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes } from '../lib/format';
import { parseSections } from '../lib/sections';
import { useViewMode } from '../lib/view';
import type { Attachment, Lang } from '../lib/types';
import SectionTabs from './SectionTabs';
import LazyHtml from './LazyHtml';

/**
 * The site's one content width: top bar, header, page banners, page content and
 * footer all use it, so their left and right edges line up on every screen size.
 */
export const CONTAINER_CLASS = 'mx-auto w-full min-w-0 max-w-[1200px] px-3 sm:px-5 lg:px-8';

/**
 * The site's one vertical rhythm: the space above and below every page section
 * (phones / from `sm` / from `md`), so sections sit the same distance apart everywhere.
 */
export const SECTION_Y = 'py-5 sm:py-8 md:py-10';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${CONTAINER_CLASS} ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = '',
  tone = 'mist',
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'mist' | 'white' | 'deep' | 'plum';
  id?: string;
}) {
  const tones = {
    mist: 'bg-mist',
    white: 'bg-white',
    deep: 'bg-mist-deep',
    plum: 'bg-plum-800 text-white',
  };
  return (
    <section id={id} className={`${SECTION_Y} ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

/**
 * SectionHeading whose label, heading, description and logo come from the
 * admin-managed section content (Titles & Headings), falling back to the
 * built-in text passed in when a value is empty. `hideEyebrow` leaves the label out
 * (stored or built-in), for a heading whose label only repeats the page title.
 */
export function ManagedSectionHeading({
  sectionKey,
  eyebrow,
  title,
  description,
  hideEyebrow = false,
  ...rest
}: Parameters<typeof SectionHeading>[0] & { sectionKey: string; hideEyebrow?: boolean }) {
  const { section } = useSite();
  const content = section(sectionKey, { label: eyebrow, heading: title, description });
  return (
    <SectionHeading
      {...rest}
      eyebrow={hideEyebrow ? undefined : content.label || undefined}
      title={content.heading}
      description={content.description || undefined}
      logo={content.logo || undefined}
    />
  );
}

/** A section's single admin-managed logo, sized to sit beside its heading. */
export function SectionLogo({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden="true" className="h-5 w-auto max-w-[96px] shrink-0 object-contain sm:h-7 sm:max-w-[120px]" />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  logo,
  align = 'start',
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  /** Admin-managed section logo; shown before the eyebrow when set */
  logo?: string;
  description?: string;
  action?: ReactNode;
  align?: 'start' | 'center';
  invert?: boolean;
}) {
  return (
    /* One heading size and one gap below it on every page */
    <div
      className={`mb-3 flex flex-col gap-2 sm:mb-5 sm:gap-3 md:mb-6 md:flex-row md:items-end md:justify-between ${
        align === 'center' ? 'text-center md:text-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'mx-auto w-full min-w-0 max-w-2xl' : 'w-full min-w-0 max-w-2xl'}>
        {(eyebrow || logo) && (
          <div
            className={`mb-1 flex items-center gap-2 eyebrow sm:mb-2 ${align === 'center' ? 'justify-center' : ''} ${
              invert ? 'text-magenta-300' : ''
            }`}
          >
            {logo && <SectionLogo src={logo} />}
            {eyebrow && <span className={invert ? 'h-px w-5 shrink-0 bg-current opacity-70' : 'brand-rule-start w-7'} />}
            {eyebrow && <span className={invert ? 'text-brand-gradient-light' : 'text-brand-gradient'}>{eyebrow}</span>}
            {eyebrow && align === 'center' && (
              <span className={invert ? 'h-px w-5 shrink-0 bg-plum-300 opacity-70' : 'brand-rule-end w-7'} />
            )}
          </div>
        )}
        <h2
          className={`type-heading-sm w-full min-w-0 [overflow-wrap:anywhere] [text-wrap:wrap] ${
            invert ? 'text-white' : 'text-plum-800'
          }`}
        >
          <GradientText light={invert}>{title}</GradientText>
        </h2>
        {description && (
          <p
            className={`mt-1 type-body leading-relaxed sm:mt-2 ${
              invert ? 'text-white/70' : 'text-ink-muted'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Heading text in the site's multi-colour heading style (the brand gradient with its
 * slow shimmer — the same treatment as the section labels). Wraps only the words, so
 * the full colour sweep shows on short headings and every wrapped line keeps it.
 * `light` is the version for dark backgrounds (banners, photo overlays).
 */
export function GradientText({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <span className={light ? 'text-brand-gradient-light' : 'text-brand-gradient'}>{children}</span>;
}

/**
 * Phones only: the Cards / List switch for a listing screen, shown as a single writing
 * icon with no visible text. A tap switches between the two layouts (pressed = list);
 * screen readers hear "List". It only changes the layout, never the content. The choice
 * is remembered and shared by every listing; tablets and desktop always show cards, so
 * it is hidden there.
 *
 * `icons` shows the switch as two icon-only buttons side by side (grid / list), the
 * active one filled; each is named for screen readers and has a tooltip.
 */
export function ViewToggle({ icons = false, className = 'mb-2.5' }: { icons?: boolean; className?: string }) {
  const { s } = useSite();
  const { mode, setMode } = useViewMode();
  const list = mode === 'list';
  if (icons) {
    const options = [
      { value: 'card' as const, label: s('cardView'), Icon: LayoutGrid },
      { value: 'list' as const, label: s('listView'), Icon: List },
    ];
    return (
      <div className={`flex justify-end sm:hidden ${className}`}>
        <div role="group" aria-label="View" className="inline-flex rounded-full border border-plum-100 bg-white p-0.5 shadow-soft">
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              aria-label={label}
              title={label}
              className={`grid h-8 w-8 place-items-center rounded-full transition active:scale-95 ${
                mode === value ? 'bg-magenta-500 text-white shadow-pink' : 'text-ink-muted'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex justify-end sm:hidden ${className}`}>
      <button
        type="button"
        onClick={() => setMode(list ? 'card' : 'list')}
        aria-pressed={list}
        aria-label={s('listView')}
        title={list ? s('cardView') : s('listView')}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border shadow-soft transition active:scale-95 ${
          list ? 'border-magenta-500 bg-magenta-500 text-white shadow-pink' : 'border-plum-100 bg-white text-magenta-600'
        }`}
      >
        <PenLine size={15} />
      </button>
    </div>
  );
}

/** Small magenta rule used under headings in the reference design. */
export function Rule({ className = '' }: { className?: string }) {
  return <span className={`block h-0.5 w-9 rounded-full bg-magenta-500 sm:h-[3px] sm:w-12 ${className}`} />;
}

/** A text link to an admin-managed target: `to` is a site path, `href` a full URL (opens in a new tab). */
export function ManagedLink({
  to,
  href,
  className,
  children,
}: {
  to?: string;
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

export function Button({
  to,
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = '',
}: {
  to?: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'light' | 'plum';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.97] disabled:opacity-55 disabled:pointer-events-none';
  const sizes = {
    sm: 'type-caption px-3.5 py-1.5 sm:px-4 sm:py-2',
    md: 'type-body-sm px-4 py-2 sm:px-6 sm:py-3',
    lg: 'type-body-lg px-5 py-2.5 sm:px-8 sm:py-3.5',
  };
  const variants = {
    primary: 'bg-magenta-500 text-white hover:bg-magenta-600 shadow-pink',
    outline: 'border border-magenta-500/30 text-magenta-600 hover:bg-magenta-50',
    ghost: 'text-magenta-600 hover:bg-magenta-50',
    light: 'border border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-plum-800',
    plum: 'bg-plum-700 text-white hover:bg-plum-600',
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  image,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; to?: string }[];
  image?: string;
}) {
  /* One banner on every page: the same padding and the same title size (no per-page variants) */
  return (
    <header className="relative overflow-hidden bg-plum-800 text-white">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-plum-900 via-plum-800/90 to-plum-800/55" />
        </>
      )}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <span className="absolute -end-24 -top-24 h-64 w-64 rounded-full bg-magenta-500/25 blur-3xl" />

      <Container className="relative py-3 sm:py-6 md:py-7">
        {breadcrumb && breadcrumb.length > 0 && (
          /* Tablet and desktop only: phones go straight to the title (no gap left behind) */
          <nav className={`mb-2 hidden flex-wrap items-center gap-2 type-meta leading-4 text-white/55 md:flex`}>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="opacity-40">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="-my-2 inline-block py-2 transition hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="min-w-0 text-white/85 [overflow-wrap:anywhere]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="type-display-sm w-full min-w-0 max-w-3xl [overflow-wrap:anywhere] [text-wrap:balance]">
          {/* The banner is dark, so the title uses the light version of the heading style */}
          <GradientText light>{title}</GradientText>
        </h1>
        <Rule className="mt-2 sm:mt-3" />
        {description && (
          <p className="user-text type-body mt-2 max-w-2xl leading-relaxed text-white/75 sm:mt-3">
            {description}
          </p>
        )}
      </Container>
    </header>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { s } = useSite();
  return (
    <div className="rounded-2xl border border-dashed border-plum-200 bg-white/70 py-8 text-center sm:rounded-2xl sm:py-16">
      <p className="type-body-sm text-ink-faint">{message ?? s('nothingHere')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { s } = useSite();
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 py-8 text-center sm:rounded-2xl sm:py-14">
      <p className="type-title font-medium text-red-800">{s('errorTitle')}</p>
      <p className="mt-1 type-body-sm text-red-700/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-full border border-red-300 px-4 py-1.5 type-body-sm font-medium text-red-800 hover:bg-red-100 sm:mt-4 sm:px-5 sm:py-2"
        >
          {s('retry')}
        </button>
      )}
    </div>
  );
}

export function RichText({ html, className = '' }: { html: string; className?: string }) {
  // Section-wise content (set up in the admin panel) shows as one button per section
  const sections = useMemo(() => parseSections(html), [html]);
  if (!html) return null;
  if (sections) return <SectionTabs content={sections} />;
  // Long bodies load a piece at a time as the reader scrolls
  return <LazyHtml html={html} className={`prose-content ${className}`} />;
}

/**
 * Renders a headline where *asterisk-wrapped* words are highlighted.
 * Editors write "Building a *Better Society*" in the admin panel.
 */
export function Highlighted({
  text,
  className = 'text-magenta-400',
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
          <span key={i} className={`${className} break-words [overflow-wrap:anywhere]`}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i} className="break-words [overflow-wrap:anywhere]">
            {part}
          </span>
        )
      )}
    </>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  const { s } = useSite();
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 sm:mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-plum-200 px-4 py-1.5 type-body-sm font-medium transition hover:border-magenta-500 hover:text-magenta-600 disabled:opacity-40 sm:px-5 sm:py-2"
      >
        {s('previous')}
      </button>
      <span className="type-body-sm text-ink-muted">
        {page} / {pages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        className="rounded-full border border-plum-200 px-4 py-1.5 type-body-sm font-medium transition hover:border-magenta-500 hover:text-magenta-600 disabled:opacity-40 sm:px-5 sm:py-2"
      >
        {s('next')}
      </button>
    </div>
  );
}

/* ───────────────────────── detail-page content card ───────────────────────── */

/**
 * The one content card of a detail page: everything the page has to say sits in
 * here, split into `PanelSection`s by dividers rather than separate boxes. A thin
 * brand-gradient bar runs along the top; an optional side column (logo, facts,
 * downloads, actions) is set off by a divider line and a slightly tinted background.
 */
export function ContentPanel({
  children,
  aside,
  asideStart = false,
  className = '',
}: {
  children: ReactNode;
  aside?: ReactNode;
  /** Put the side column before the content on wide screens (e.g. a book cover) */
  asideStart?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-clip rounded-xl border border-plum-100 bg-gradient-to-b from-white to-[#fbf8fd] shadow-soft sm:rounded-2xl ${className}`}
    >
      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r sm:h-1 from-magenta-500 via-magenta-400 to-plum-500" aria-hidden="true" />
      <span
        className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-magenta-100/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className={`relative grid ${
          aside ? (asideStart ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_280px]') : ''
        }`}
      >
        <div className={`min-w-0 p-3.5 pt-4 sm:p-7 sm:pt-8 md:p-9 md:pt-10 ${aside && asideStart ? 'lg:order-2' : ''}`}>
          {children}
        </div>
        {aside && (
          <aside
            className={`min-w-0 border-t border-plum-100 bg-plum-50/40 p-3.5 sm:p-7 lg:border-t-0 ${
              asideStart ? 'lg:order-1 lg:border-e' : 'lg:border-s'
            }`}
          >
            <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">{aside}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * One part of a `ContentPanel`: an icon chip and heading, then its content. Sections
 * after the first are separated by a divider line.
 */
export function PanelSection({
  title,
  icon: Icon,
  badge,
  children,
  className = '',
}: {
  title?: string;
  icon?: LucideIcon;
  /** A short number/label shown in the chip instead of an icon (e.g. "01") */
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-plum-100/80 pt-4 first:border-t-0 first:pt-0 [&+&]:mt-4 sm:pt-7 sm:[&+&]:mt-7 md:pt-8 md:[&+&]:mt-8 ${className}`}>
      {title && (
        <header className="mb-2.5 flex min-w-0 items-center gap-2.5 sm:mb-4 sm:gap-3">
          <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-magenta-50 to-plum-50 px-1.5 type-meta font-semibold text-magenta-600 ring-1 ring-inset ring-magenta-100 max-sm:[&_svg]:h-3.5 max-sm:[&_svg]:w-3.5 sm:h-9 sm:min-w-9 sm:rounded-xl">
            {badge ? badge : Icon ? <Icon size={17} strokeWidth={2.1} /> : <span className="h-1.5 w-1.5 rounded-full bg-magenta-500" />}
          </span>
          <h2 className="user-text min-w-0 type-subheading text-plum-800">
            <GradientText>{title}</GradientText>
          </h2>
        </header>
      )}
      {children}
    </section>
  );
}

/** A small heading for the side column of a `ContentPanel`. */
export function PanelAsideHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 font-sans type-overline sm:mb-3 font-semibold tracking-[0.14em] text-plum-700">
      <span className="h-px w-4 bg-magenta-400" aria-hidden="true" />
      <GradientText>{children}</GradientText>
    </h3>
  );
}

/** Downloadable files as a plain list (no box of its own). */
export function DownloadList({ files, lang }: { files: Attachment[]; lang: Lang }) {
  return (
    <ul className="divide-y divide-plum-100/80">
      {files.map((file, i) => (
        <li key={i}>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 type-body-sm transition hover:bg-magenta-50/70 sm:gap-3 sm:py-2.5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-magenta-50 text-magenta-600 transition group-hover:bg-magenta-500 group-hover:text-white sm:h-8 sm:w-8">
              <Download size={15} />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-ink/85">
              {t(file.title, lang) || file.url.split('/').pop()}
            </span>
            {file.sizeBytes > 0 && <span className="shrink-0 type-meta text-ink-faint">{formatBytes(file.sizeBytes)}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A person (leader, speaker) as an avatar + name row, without a box of its own. */
export function PersonRow({ name, role, photo }: { name: string; role?: string; photo?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-soft sm:h-14 sm:w-14" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-magenta-50 to-plum-50 font-display text-base font-semibold text-magenta-600 ring-2 ring-white sm:h-14 sm:w-14 sm:text-lg">
          {(name || '?').charAt(0)}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate type-title text-plum-800">{name}</div>
        {role && <div className="truncate type-caption text-ink-muted">{role}</div>}
      </div>
    </div>
  );
}
