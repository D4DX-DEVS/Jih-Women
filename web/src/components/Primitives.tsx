import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useSite } from '../lib/site';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full min-w-0 max-w-[1200px] px-4 sm:px-5 lg:px-8 ${className}`}>{children}</div>;
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
    <section id={id} className={`py-14 md:py-20 ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'start',
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: 'start' | 'center';
  invert?: boolean;
}) {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 md:mb-11 md:flex-row md:items-end md:justify-between ${
        align === 'center' ? 'text-center md:text-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'mx-auto w-full min-w-0 max-w-2xl' : 'w-full min-w-0 max-w-2xl'}>
        {eyebrow && (
          <div className={`mb-2.5 eyebrow ${invert ? 'text-magenta-300' : ''}`}>{eyebrow}</div>
        )}
        <h2
          className={`w-full min-w-0 text-[1.45rem] font-semibold leading-[1.25] [overflow-wrap:anywhere] [text-wrap:wrap] sm:text-[1.6rem] md:text-[2.1rem] md:leading-tight ${
            invert ? 'text-white' : 'text-plum-800'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-3 text-[15px] leading-relaxed ${
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
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:opacity-55 disabled:pointer-events-none';
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
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; to?: string }[];
  image?: string;
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

      <Container className="relative py-12 md:py-16">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="opacity-40">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="max-w-[220px] truncate text-white/85 sm:max-w-none">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="w-full min-w-0 max-w-3xl text-[1.55rem] font-semibold leading-[1.25] [overflow-wrap:anywhere] [text-wrap:wrap] sm:text-[1.8rem] md:text-[2.6rem] md:leading-tight">
          {title}
        </h1>
        <Rule className="mt-5" />
        {description && (
          <p className="user-text mt-5 max-w-2xl text-[15px] leading-relaxed text-white/75">
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
