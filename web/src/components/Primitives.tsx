import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes } from '../lib/format';
import type { Attachment, Lang } from '../lib/types';

/**
 * The site's one content width: top bar, header, page banners, page content and
 * footer all use it, so their left and right edges line up on every screen size.
 */
export const CONTAINER_CLASS = 'mx-auto w-full min-w-0 max-w-[1280px] px-4 sm:px-5 lg:px-8';

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
    <section id={id} className={`py-10 md:py-14 ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

/**
 * SectionHeading whose label, heading, description and logo come from the
 * admin-managed section content (Titles & Headings), falling back to the
 * built-in text passed in when a value is empty.
 */
export function ManagedSectionHeading({
  sectionKey,
  eyebrow,
  title,
  description,
  ...rest
}: Parameters<typeof SectionHeading>[0] & { sectionKey: string }) {
  const { section } = useSite();
  const content = section(sectionKey, { label: eyebrow, heading: title, description });
  return (
    <SectionHeading
      {...rest}
      eyebrow={content.label || undefined}
      title={content.heading}
      description={content.description || undefined}
      logo={content.logo || undefined}
    />
  );
}

/** A section's single admin-managed logo, sized to sit beside its heading. */
export function SectionLogo({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden="true" className="h-7 w-auto max-w-[120px] shrink-0 object-contain" />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  logo,
  align = 'start',
  invert = false,
  size = 'md',
}: {
  eyebrow?: string;
  title: string;
  /** Admin-managed section logo; shown before the eyebrow when set */
  logo?: string;
  description?: string;
  action?: ReactNode;
  align?: 'start' | 'center';
  invert?: boolean;
  /** `sm` sits under a smaller page title (programme pages) */
  size?: 'md' | 'sm';
}) {
  return (
    <div
      className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${
        size === 'sm' ? 'mb-4 md:mb-5' : 'mb-6 md:mb-8'
      } ${align === 'center' ? 'text-center md:text-center' : ''}`}
    >
      <div className={align === 'center' ? 'mx-auto w-full min-w-0 max-w-2xl' : 'w-full min-w-0 max-w-2xl'}>
        {(eyebrow || logo) && (
          <div
            className={`mb-2 flex items-center gap-2 eyebrow ${align === 'center' ? 'justify-center' : ''} ${
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
          className={`w-full min-w-0 font-semibold leading-[1.25] [overflow-wrap:anywhere] [text-wrap:wrap] md:leading-tight ${
            size === 'sm'
              ? 'text-[1.2rem] sm:text-[1.3rem] md:text-[1.45rem]'
              : 'text-[1.3rem] sm:text-[1.45rem] md:text-[1.75rem]'
          } ${invert ? 'text-white' : 'text-plum-800'}`}
        >
          <GradientText light={invert}>{title}</GradientText>
        </h2>
        {description && (
          <p
            className={`mt-2 text-[14.5px] leading-relaxed ${
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

/** Small magenta rule used under headings in the reference design. */
export function Rule({ className = '' }: { className?: string }) {
  return <span className={`block h-[3px] w-12 rounded-full bg-magenta-500 ${className}`} />;
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
    sm: 'px-4 py-2 text-[13px]',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-[15px]',
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
  compact = false,
  titleSize = 'lg',
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; to?: string }[];
  image?: string;
  /** Thinner band for text pages (Who We Are); same look, less height */
  compact?: boolean;
  /** `md` scales the title fluidly from ~22px (phones) to ~34px (desktop) */
  titleSize?: 'lg' | 'md';
}) {
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

      <Container className={`relative ${compact ? 'py-5 sm:py-6 md:py-7' : 'py-8 sm:py-10 md:py-16'}`}>
        {breadcrumb && breadcrumb.length > 0 && (
          /* Tablet and desktop only: phones go straight to the title (no gap left behind) */
          <nav className={`${compact ? 'mb-2' : 'mb-4'} hidden flex-wrap items-center gap-2 text-xs text-white/55 md:flex`}>
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
        <h1
          className={`w-full min-w-0 max-w-3xl font-semibold leading-[1.25] [overflow-wrap:anywhere] md:leading-tight ${
            titleSize === 'md'
              ? 'text-[clamp(1.375rem,1rem+1.6vw,2.125rem)] [text-wrap:balance]'
              : 'text-[1.55rem] [text-wrap:wrap] sm:text-[1.8rem] md:text-[2.6rem]'
          }`}
        >
          {/* The banner is dark, so the title uses the light version of the heading style */}
          <GradientText light>{title}</GradientText>
        </h1>
        <Rule className={compact ? 'mt-3' : 'mt-5'} />
        {description && (
          <p
            className={`user-text ${compact ? 'mt-3' : 'mt-5'} max-w-2xl leading-relaxed text-white/75 ${
              titleSize === 'md' ? 'text-[14px] md:text-[15px]' : 'text-[15px]'
            }`}
          >
            {description}
          </p>
        )}
      </Container>
    </header>
  );
}

export function Loading({ label }: { label?: string }) {
  const { s } = useSite();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-faint">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-magenta-100 border-t-magenta-500" />
      <span className="text-sm">{label ?? s('loading')}</span>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { s } = useSite();
  return (
    <div className="rounded-3xl border border-dashed border-plum-200 bg-white/70 py-16 text-center">
      <p className="text-sm text-ink-faint">{message ?? s('nothingHere')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { s } = useSite();
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/70 py-14 text-center">
      <p className="font-medium text-red-800">{s('errorTitle')}</p>
      <p className="mt-1 text-sm text-red-700/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          {s('retry')}
        </button>
      )}
    </div>
  );
}

export function RichText({ html, className = '' }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={`prose-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
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
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-plum-200 px-5 py-2 text-sm font-medium transition hover:border-magenta-500 hover:text-magenta-600 disabled:opacity-40"
      >
        {s('previous')}
      </button>
      <span className="text-sm text-ink-muted">
        {page} / {pages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        className="rounded-full border border-plum-200 px-5 py-2 text-sm font-medium transition hover:border-magenta-500 hover:text-magenta-600 disabled:opacity-40"
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
      className={`relative overflow-hidden rounded-2xl border border-plum-100 bg-gradient-to-b from-white to-[#fbf8fd] shadow-soft ${className}`}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-magenta-500 via-magenta-400 to-plum-500" aria-hidden="true" />
      <span
        className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-magenta-100/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className={`relative grid ${
          aside ? (asideStart ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_280px]') : ''
        }`}
      >
        <div className={`min-w-0 p-5 pt-6 sm:p-7 sm:pt-8 md:p-9 md:pt-10 ${aside && asideStart ? 'lg:order-2' : ''}`}>
          {children}
        </div>
        {aside && (
          <aside
            className={`min-w-0 border-t border-plum-100 bg-plum-50/40 p-5 sm:p-7 lg:border-t-0 ${
              asideStart ? 'lg:order-1 lg:border-e' : 'lg:border-s'
            }`}
          >
            <div className="space-y-6 lg:sticky lg:top-24">{aside}</div>
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
    <section className={`border-t border-plum-100/80 pt-7 first:border-t-0 first:pt-0 [&+&]:mt-7 md:pt-8 md:[&+&]:mt-8 ${className}`}>
      {title && (
        <header className="mb-4 flex min-w-0 items-center gap-3">
          <span className="grid h-9 min-w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-magenta-50 to-plum-50 px-1.5 text-[12.5px] font-semibold text-magenta-600 ring-1 ring-inset ring-magenta-100">
            {badge ? badge : Icon ? <Icon size={17} strokeWidth={2.1} /> : <span className="h-1.5 w-1.5 rounded-full bg-magenta-500" />}
          </span>
          <h2 className="user-text min-w-0 font-display text-[1.1rem] font-semibold leading-snug text-plum-800 md:text-[1.25rem]">
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
    <h3 className="mb-3 flex items-center gap-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.14em] text-plum-700">
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
            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition hover:bg-magenta-50/70"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-magenta-50 text-magenta-600 transition group-hover:bg-magenta-500 group-hover:text-white">
              <Download size={15} />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-ink/85">
              {t(file.title, lang) || file.url.split('/').pop()}
            </span>
            {file.sizeBytes > 0 && <span className="shrink-0 text-[11px] text-ink-faint">{formatBytes(file.sizeBytes)}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A person (leader, speaker) as an avatar + name row, without a box of its own. */
export function PersonRow({ name, role, photo }: { name: string; role?: string; photo?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-soft" />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-magenta-50 to-plum-50 font-display text-lg font-semibold text-magenta-600 ring-2 ring-white">
          {(name || '?').charAt(0)}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate font-display text-[15px] font-semibold text-plum-800">{name}</div>
        {role && <div className="truncate text-[13px] text-ink-muted">{role}</div>}
      </div>
    </div>
  );
}
