import { GradientText } from './Primitives';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Download,
  FileText,
  MapPin,
  Play,
  X,
} from 'lucide-react';
import { useSite } from '../lib/site';
import type { ViewMode } from '../lib/view';
import { t } from '../lib/i18n';
import { leaderTermSummary } from '../lib/leaders';
import {
  formatBytes,
  formatDate,
  formatDateRange,
  formatDay,
  isExternalUrl,
  validMedia,
  youtubeId,
  youtubeThumb,
} from '../lib/format';
import type {
  Album,
  Campaign,
  Department,
  DownloadItem,
  ExternalLink,
  Leader,
  MediaItem,
  MediaPost,
  OrgEvent,
  Program,
  Publication,
  VideoItem,
} from '../lib/types';

function Placeholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-plum-50 ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(44,10,77,0.06) 0 8px, transparent 8px 16px)',
      }}
    />
  );
}

/* ---------------- posts ---------------- */

export function PostCard({
  post,
  compact = false,
  small = false,
  view = 'card',
}: {
  post: MediaPost;
  compact?: boolean;
  /** Tablet and desktop only: tighter padding and type, for a four-across listing */
  small?: boolean;
  /** Phones only (see useViewMode): `card` is a small tile for a two-up grid, `list` a compact row */
  view?: ViewMode;
}) {
  const { lang, path, h } = useSite();
  const to = path(`/media/${post.type}/${post.slug}`);
  const row = view === 'list';

  if (compact) {
    return (
      <Link to={to} className="group flex gap-3 py-2.5 sm:gap-4 sm:py-4">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-24 sm:rounded-xl"
            loading="lazy"
          />
        ) : (
          <Placeholder className="h-16 w-20 shrink-0 rounded-lg sm:h-20 sm:w-24 sm:rounded-xl" />
        )}
        <div className="min-w-0">
          <div className="type-overline font-medium tracking-wider text-magenta-500">
            {formatDate(post.publishedAt, lang)}
          </div>
          <h3 className="mt-0.5 line-clamp-2 type-title text-plum-800 transition group-hover:text-magenta-600 sm:mt-1">
            <GradientText>{t(post.title, lang)}</GradientText>
          </h3>
        </div>
      </Link>
    );
  }

  const pic = row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-[4/3]';

  return (
    <Link
      to={to}
      className={`card-hover group flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col ${
        small ? 'sm:rounded-2xl' : 'sm:rounded-2xl'
      } ${row ? 'rounded-xl' : 'flex-col rounded-lg'}`}
    >
      {post.coverImage ? (
        <div className={`relative overflow-hidden sm:aspect-[16/10] ${pic}`}>
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className={`sm:aspect-[16/10] ${pic}`} />
      )}
      <div
        className={`flex min-w-0 flex-1 flex-col sm:justify-start ${small ? 'sm:p-3.5' : 'sm:p-5'} ${
          row ? 'justify-center p-2.5' : 'p-2'
        }`}
      >
        {/* Dates read in English on every card; the title and preview stay in the site language */}
        <div
          className={`type-overline font-medium text-magenta-500 sm:tracking-wider ${
            row ? 'tracking-wider' : 'tracking-normal max-sm:type-micro'
          }`}
        >
          {formatDate(post.publishedAt, 'en')}
        </div>
        <h3
          className={`text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-2 ${
            small ? 'type-title sm:mt-1.5' : 'type-title-lg sm:mt-2'
          } ${row ? 'mt-0.5 line-clamp-2' : 'mt-0.5 line-clamp-3 max-sm:type-tile'}`}
        >
          <GradientText>{t(post.title, lang)}</GradientText>
        </h3>
        {/* A short preview only; the full story is on the detail page */}
        {t(post.excerpt, lang) && (
          <p
            className={`leading-relaxed text-ink-muted sm:line-clamp-2 sm:block ${
              small ? 'type-caption sm:mt-1.5' : 'type-body-sm max-sm:type-caption sm:mt-2'
            } ${row ? 'mt-0.5 line-clamp-1' : 'hidden'}`}
          >
            {t(post.excerpt, lang)}
          </p>
        )}
        <span
          className={`type-caption mt-auto hidden items-center gap-1.5 font-semibold text-magenta-600 sm:inline-flex ${
            small ? 'pt-2.5' : 'pt-4'
          }`}
        >
          {h('readMore')}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- events ---------------- */

/**
 * The event's poster (or, for older records, its cover image), shown whole and undistorted
 * inside a fixed frame, on a soft plain ground.
 * A missing or broken image falls back to a plain date tile, never a broken-image icon;
 * `title` is written on that tile where nothing else names the event.
 */
function EventPoster({
  src,
  alt,
  day,
  month,
  title = '',
  className = '',
}: {
  src: string;
  alt: string;
  day: string;
  month: string;
  title?: string;
  className?: string;
}) {
  // The caller keys this by `src`, so a swapped poster gets a fresh attempt
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`relative flex flex-col items-center justify-center gap-1 overflow-hidden bg-plum-800 text-white ${className}`}
      >
        <span
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <span className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-magenta-500/30 blur-3xl" />
        <Calendar size={22} className="relative text-magenta-300" />
        <span className="relative font-display text-3xl font-bold leading-none sm:text-4xl">{day}</span>
        <span className="relative type-overline font-medium tracking-[0.18em] text-magenta-300">{month}</span>
        {title && (
          <span className="relative mt-1.5 line-clamp-3 px-3 text-center type-caption font-medium leading-snug [overflow-wrap:anywhere]">
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-plum-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <span className="absolute start-2 top-2 flex flex-col items-center rounded-lg bg-plum-800 px-2 py-1 text-white shadow-soft">
        <span className="font-display type-body-sm font-bold leading-none">{day}</span>
        <span className="mt-0.5 type-micro font-medium uppercase tracking-wider text-magenta-300">{month}</span>
      </span>
    </div>
  );
}

/** An event is over once its last day has passed (date-only values are stored at midnight UTC). */
function isPastEvent(event: OrgEvent) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(event.endDate || event.startDate).getTime() < today.getTime();
}

/**
 * Where a click on an event poster goes: the poster's own link (set in the admin) in a new
 * tab when it has one, otherwise the event page. Only http(s) links are followed.
 */
export function EventPosterLink({
  event,
  className = '',
  children,
  ...rest
}: {
  event: OrgEvent;
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
}) {
  const { path } = useSite();
  if (isExternalUrl(event.externalUrl)) {
    return (
      <a href={event.externalUrl} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={path(`/events/${event.slug}`)} className={className} {...rest}>
      {children}
    </Link>
  );
}

/**
 * An event poster opened full size in the lightbox, captioned with the event's title. A
 * poster click opens this and never leaves the page: the poster's own link (externalUrl)
 * is kept in the data but not followed from here.
 */
export function PosterLightbox({ event, onClose }: { event: OrgEvent; onClose: () => void }) {
  const src = event.posterImage || event.coverImage;
  return (
    <Lightbox
      items={[{ url: src, thumbnailUrl: src, caption: event.title, kind: 'image' }]}
      index={0}
      onClose={onClose}
      onIndex={() => {}}
    />
  );
}

/**
 * One event on the Events page: its poster alone, shown whole in a 3:4 frame with the date
 * badge on it and nothing beneath. A click opens the poster full size in the lightbox
 * (an event with no picture links to its page instead). `className` is the card's share
 * of a row. Phones can switch to `list`: a compact row with a small poster beside the
 * details and, for an event that is not over yet, its Register button; there the poster
 * opens the lightbox and the rest of the row links to the event page.
 */
export function EventCard({
  event,
  view = 'card',
  className = '',
}: {
  event: OrgEvent;
  view?: ViewMode;
  className?: string;
}) {
  const { lang, path, s } = useSite();
  const { day, month } = formatDay(event.startDate, lang);
  const [zoomed, setZoomed] = useState(false);

  const name = t(event.title, lang);
  const venue = t(event.venue, lang);
  const src = event.posterImage || event.coverImage;
  const to = path(`/events/${event.slug}`);

  const dateRange = formatDateRange(event.startDate, event.endDate, lang);

  const lightbox = zoomed && <PosterLightbox event={event} onClose={() => setZoomed(false)} />;

  if (view !== 'list') {
    const cardClass = `card-hover group block min-w-0 overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500 sm:rounded-2xl ${className}`;
    const poster = (
      <EventPoster key={src} src={src} alt={name} day={day} month={month} title={name} className="aspect-[3/4] w-full" />
    );
    if (!src) {
      return (
        <EventPosterLink event={event} aria-label={name ? `${name}, ${dateRange}` : dateRange} className={cardClass}>
          {poster}
        </EventPosterLink>
      );
    }
    // The lightbox sits beside the button, not in it: its clicks must not bubble back to the card
    return (
      <>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-haspopup="dialog"
          aria-label={name ? `${name}, ${dateRange}` : dateRange}
          className={`cursor-zoom-in text-start ${cardClass}`}
        >
          {poster}
        </button>
        {lightbox}
      </>
    );
  }

  // Same rule as the event page: an external form wins, otherwise the built-in RSVP form
  const past = isPastEvent(event);
  const externalRegistration = !past && isExternalUrl(event.registrationUrl);
  const builtInRegistration = !past && !externalRegistration && event.registrationEnabled;
  const registerClass =
    'relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-magenta-500 px-3.5 py-1.5 type-caption font-semibold text-white shadow-pink transition hover:bg-magenta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500 focus-visible:ring-offset-2 sm:px-4';

  return (
    <article
      className={`card-hover group relative flex min-w-0 gap-3 rounded-xl border border-plum-100 bg-white p-2 shadow-soft has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-magenta-500 ${className}`}
    >
      {/* z-10 lifts the poster above the row's stretched link, so it opens the lightbox */}
      {src ? (
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-haspopup="dialog"
          aria-label={name || dateRange}
          className="relative z-10 w-20 shrink-0 cursor-zoom-in self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500"
        >
          <EventPoster key={src} src={src} alt={name} day={day} month={month} className="aspect-[3/4] w-full rounded-lg" />
        </button>
      ) : (
        <EventPoster
          key={src}
          src={src}
          alt={name}
          day={day}
          month={month}
          className="aspect-[3/4] w-20 shrink-0 self-start rounded-lg"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col py-0.5 pe-1">
        {/* after:inset-0 stretches the link over the whole card. An untitled poster has no
            heading: its link is named by the date instead. */}
        {name ? (
          <h3 className="type-title-lg text-plum-800 transition group-hover:text-magenta-600">
            <EventPosterLink event={event} className="outline-none after:absolute after:inset-0 after:content-['']">
              <span className="line-clamp-2 [overflow-wrap:anywhere]">
                <GradientText>{name}</GradientText>
              </span>
            </EventPosterLink>
          </h3>
        ) : (
          <EventPosterLink
            event={event}
            aria-label={dateRange}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          />
        )}

        <ul className={`type-caption space-y-0.5 text-ink-muted ${name ? 'mt-1' : ''}`}>
          <li className="flex items-start gap-2">
            <Calendar size={14} className="mt-0.5 shrink-0 text-magenta-500" />
            <span>{dateRange}</span>
          </li>
          {event.timeLabel && (
            <li className="flex items-start gap-2">
              <Clock size={14} className="mt-0.5 shrink-0 text-magenta-500" />
              <span>{event.timeLabel}</span>
            </li>
          )}
          {venue && (
            <li className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-magenta-500" />
              <span className="line-clamp-2 [overflow-wrap:anywhere]">{venue}</span>
            </li>
          )}
        </ul>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-2">
          <span className="inline-flex items-center gap-1.5 type-caption font-semibold text-magenta-600">
            {s('viewDetails')}
            <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          {externalRegistration && (
            <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className={registerClass}>
              {s('registerNow')}
            </a>
          )}
          {builtInRegistration && (
            <Link to={to} className={registerClass}>
              {s('registerNow')}
            </Link>
          )}
        </div>
      </div>
      {lightbox}
    </article>
  );
}

/* ---------------- campaigns ---------------- */

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { lang, path } = useSite();
  return (
    <Link
      to={path(`/campaigns/${campaign.slug}`)}
      className="card-hover group relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-xl bg-plum-800 p-3 text-white shadow-soft sm:min-h-[220px] sm:rounded-2xl sm:p-5"
    >
      {campaign.coverImage && (
        <img
          src={campaign.coverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-plum-900 via-plum-900/55 to-transparent" />
      <div className="relative">
        {campaign.hashtag && (
          <span className="mb-1.5 inline-block rounded-full bg-magenta-500 px-2.5 py-0.5 type-meta font-semibold sm:mb-2 sm:px-3 sm:py-1">
            {campaign.hashtag}
          </span>
        )}
        <h3 className="type-subheading max-sm:type-title-lg"><GradientText light>{t(campaign.title, lang)}</GradientText></h3>
        {t(campaign.summary, lang) && (
          <p className="mt-1 line-clamp-2 type-body-sm text-white/75 max-sm:type-caption sm:mt-2">{t(campaign.summary, lang)}</p>
        )}
      </div>
    </Link>
  );
}

/* ---------------- departments & programmes ---------------- */

export function DepartmentCard({
  department,
  view = 'card',
}: {
  department: Pick<Department, '_id' | 'slug' | 'title' | 'tagline' | 'coverImage' | 'logoUrl'>;
  /** Phones only (see useViewMode): `card` is a small tile for a two-up grid, `list` a compact row */
  view?: ViewMode;
}) {
  const { lang, path, s } = useSite();
  const row = view === 'list';
  const pic = row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-[4/3]';
  return (
    <Link
      to={path(`/departments/${department.slug}`)}
      className={`card-hover group flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-2xl ${
        row ? 'rounded-xl' : 'flex-col rounded-lg'
      }`}
    >
      {department.coverImage ? (
        <div className={`relative overflow-hidden sm:aspect-[16/9] ${pic}`}>
          <img
            src={department.coverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className={`sm:aspect-[16/9] ${pic}`} />
      )}
      <div className={`flex min-w-0 flex-1 flex-col sm:justify-start sm:p-5 ${row ? 'justify-center p-2.5' : 'p-2'}`}>
        {department.logoUrl && (
          <img src={department.logoUrl} alt="" className="mb-3 hidden h-10 w-auto object-contain sm:block" />
        )}
        <h3
          className={`type-title-lg text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-none ${
            row ? '' : 'line-clamp-3 max-sm:type-tile'
          }`}
        >
          <GradientText>{t(department.title, 'en')}</GradientText>
        </h3>
        {t(department.tagline, lang) && (
          <p
            className={`type-body-sm leading-relaxed text-ink-muted max-sm:type-caption sm:mt-2 sm:line-clamp-3 sm:block ${
              row ? 'mt-0.5 line-clamp-2' : 'hidden'
            }`}
          >
            {t(department.tagline, lang)}
          </p>
        )}
        <span
          className={`type-caption items-center font-semibold text-magenta-600 sm:mt-4 sm:inline-flex sm:gap-1.5 ${
            row ? 'mt-1.5 inline-flex gap-1' : 'hidden'
          }`}
        >
          {s('viewDetails')}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function ProgramCard({
  program,
  view = 'card',
}: {
  program: Pick<Program, '_id' | 'slug' | 'title' | 'tagline' | 'logoUrl'>;
  /** Phones only (see useViewMode): `card` is a small tile for a two-up grid, `list` a compact row */
  view?: ViewMode;
}) {
  const { lang, path, s } = useSite();
  const row = view === 'list';
  // The card always opens the programme page; a programme's own website is linked
  // below its content there, never opened straight from the card.
  const cardClass = `card-hover group relative flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-2xl ${
    row ? 'rounded-xl' : 'flex-col rounded-lg'
  }`;
  const card = (
    <>
      {program.logoUrl ? (
        /* The programme's logo (its only managed image), whole and centred; multiply
           lets white or near-white logo backgrounds melt into the card */
        <div
          className={`flex items-center justify-center overflow-hidden border-plum-100/70 bg-white sm:aspect-[16/9] sm:border-b sm:border-e-0 sm:p-6 ${
            row ? 'w-[7.5rem] shrink-0 self-stretch border-e p-3 sm:w-auto sm:self-auto' : 'aspect-[4/3] border-b p-3'
          }`}
        >
          <img
            src={program.logoUrl}
            alt=""
            loading="lazy"
            className="h-auto max-h-full w-auto max-w-full object-contain mix-blend-multiply brightness-[1.04] transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <Placeholder
          className={`sm:aspect-[16/9] ${row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-[4/3]'}`}
        />
      )}
      <div className={`flex min-w-0 flex-1 flex-col sm:justify-start sm:p-5 ${row ? 'justify-center p-2.5' : 'p-2'}`}>
        {/* Programme names and labels are always English; the tagline follows the site language */}
        <h3
          className={`type-title-lg text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-none ${
            row ? '' : 'line-clamp-2 max-sm:type-tile'
          }`}
        >
          <GradientText>{t(program.title, 'en')}</GradientText>
        </h3>
        {t(program.tagline, lang) && (
          <p
            className={`type-body-sm leading-relaxed text-ink-muted max-sm:type-caption sm:mt-2 sm:line-clamp-3 sm:block ${
              row ? 'mt-0.5 line-clamp-2' : 'hidden'
            }`}
          >
            {t(program.tagline, lang)}
          </p>
        )}
        <span
          className={`type-caption items-center font-semibold text-magenta-600 sm:mt-4 sm:inline-flex sm:gap-1.5 ${
            row ? 'mt-1.5 inline-flex gap-1' : 'hidden'
          }`}
        >
          {s('viewDetails')}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </>
  );

  return (
    <Link to={path(`/programs/${program.slug}`)} className={cardClass}>
      {card}
    </Link>
  );
}

/* ---------------- leaders ---------------- */

export function LeaderCard({
  leader,
  view = 'card',
  className = '',
  shownPeriod = '',
  shownPeriodOnPhones = '',
}: {
  leader: Leader;
  view?: ViewMode;
  /** Sizing from the listing that lays the cards out (its share of a row) */
  className?: string;
  /** The period in the heading above the card; not repeated when it is the leader's only one */
  shownPeriod?: string;
  /** As `shownPeriod`, for a heading shown above the card on phones only; the card still
      shows the period from `sm` */
  shownPeriodOnPhones?: string;
}) {
  const { lang } = useSite();
  // Name and designation are empty when neither language has one, so no blank line is drawn
  const name = t(leader.name, lang);
  const designation = t(leader.designation, lang);
  const { district, periods } = leaderTermSummary(leader, lang, { name, shownPeriod });
  const periodsOnPhones = shownPeriodOnPhones
    ? leaderTermSummary(leader, lang, { name, shownPeriod: shownPeriodOnPhones }).periods
    : periods;
  // A card with nothing to say below the photo (e.g. a poster with only its year, which
  // the heading already shows) has no empty text panel
  const textOnPhones = Boolean(name || designation || district || periodsOnPhones);
  // A past committee is often saved with only its group poster; that stands in for the photo
  const photo = leader.photo || leader.posterImage;

  if (view === 'list') {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-plum-100 bg-white p-3 shadow-soft ${className}`}>
        {photo ? (
          <img
            src={photo}
            alt={name}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-full object-cover object-top ring-2 ring-white"
          />
        ) : (
          <Placeholder className="h-16 w-16 shrink-0 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          {name && (
            <h3 className="type-title-lg font-semibold text-plum-800 [overflow-wrap:anywhere]">
              <GradientText>{name}</GradientText>
            </h3>
          )}
          {designation && (
            <p className={`${name ? 'mt-0.5 ' : ''}type-body-sm leading-snug text-ink-muted`}>{designation}</p>
          )}
          {(district || periodsOnPhones) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 type-caption font-medium text-magenta-600">
              {district && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="shrink-0" aria-hidden="true" />
                  {district}
                </span>
              )}
              {periodsOnPhones && <span>{periodsOnPhones}</span>}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-hover group flex flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft hover:border-magenta-200 sm:rounded-2xl ${className}`}>
      {photo ? (
        <div className="card-sheen aspect-[4/5] bg-mist-deep">
          <img
            src={photo}
            alt={name}
            loading="lazy"
            /* Portrait frame; anchored to the top so faces stay in view when a photo isn't 4:5 */
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className="card-sheen aspect-[4/5]" />
      )}
      {(textOnPhones || periods) && (
        <div
          className={`card-rule flex flex-1 flex-col items-center px-2.5 py-3 text-center sm:px-4 sm:py-5 ${
            textOnPhones ? '' : 'max-sm:hidden'
          }`}
        >
          {name && (
            <h3 className="type-title-lg font-semibold text-plum-800 [overflow-wrap:anywhere]">
              <GradientText>{name}</GradientText>
            </h3>
          )}
          {designation && (
            <p className={`${name ? 'mt-1 ' : ''}type-body-sm leading-snug text-ink-muted`}>{designation}</p>
          )}
          {district && (
            <p className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-magenta-50 px-2.5 py-0.5 type-caption font-semibold text-magenta-600">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">{district}</span>
            </p>
          )}
          {periods && (
            <p className={`mt-2 type-caption font-medium tracking-wide text-plum-600 ${periodsOnPhones ? '' : 'max-sm:hidden'}`}>
              {periods}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- media ---------------- */

export function VideoCard({
  item,
  onPlay,
  view = 'card',
}: {
  item: VideoItem;
  onPlay?: (item: VideoItem) => void;
  /** Phones only (see useViewMode): `card` is a small tile for a two-up grid, `list` a compact
      row (thumbnail left); `stack` is the full-width stacked card used inside swipe rows */
  view?: ViewMode | 'stack';
}) {
  const { lang } = useSite();
  const thumb = item.thumbnailUrl || youtubeThumb(item.youtubeUrl);
  const isPodcast = item.kind === 'podcast';
  const list = view === 'list';
  const tile = view === 'card';

  return (
    <button
      onClick={() => onPlay?.(item)}
      className={`card-hover group w-full overflow-hidden border border-plum-100 bg-white text-start shadow-soft sm:rounded-2xl ${
        list ? 'flex items-center rounded-xl sm:block' : tile ? 'rounded-lg' : 'rounded-2xl'
      }`}
    >
      <div className={`relative aspect-video overflow-hidden bg-plum-900 ${list ? 'w-36 shrink-0 sm:w-auto' : ''}`}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Placeholder className="h-full w-full" />
        )}
        <span className="absolute inset-0 grid place-items-center">
          <span
            className={`grid place-items-center rounded-full bg-white/95 text-magenta-600 shadow-lift transition group-hover:scale-110 sm:h-14 sm:w-14 ${
              list ? 'h-8 w-8' : tile ? 'h-8 w-8' : 'h-10 w-10'
            }`}
          >
            <Play size={tile ? 14 : 17} className="ms-0.5" fill="currentColor" />
          </span>
        </span>
        {item.durationLabel && (
          <span
            className={`type-meta absolute rounded-md bg-ink/80 font-medium text-white sm:bottom-3 sm:end-3 sm:px-2 sm:py-0.5 ${
              tile ? 'bottom-1 end-1 px-1 py-px max-sm:type-micro' : 'bottom-2 end-2 px-1.5 py-0.5'
            }`}
          >
            {item.durationLabel}
          </span>
        )}
      </div>
      <div className={`min-w-0 sm:p-5 ${list ? 'flex-1 p-2.5 sm:flex-none' : tile ? 'p-2' : 'p-3'}`}>
        <div
          className={`type-overline font-medium text-magenta-500 sm:tracking-wider ${
            tile ? 'tracking-normal max-sm:type-micro' : 'tracking-wider'
          }`}
        >
          {isPodcast ? 'Podcast' : formatDate(item.publishedAt, lang)}
        </div>
        <h3
          className={`type-title text-plum-800 sm:mt-1.5 sm:line-clamp-2 ${
            tile ? 'mt-0.5 line-clamp-2 max-sm:type-tile' : 'mt-1 line-clamp-2'
          }`}
        >
          <GradientText>{t(item.title, lang)}</GradientText>
        </h3>
      </div>
    </button>
  );
}

export function VideoPlayerModal({ item, onClose }: { item: VideoItem; onClose: () => void }) {
  const { lang, s } = useSite();
  const id = item.youtubeId || youtubeId(item.youtubeUrl);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] grid animate-fade-in place-items-center overflow-y-auto bg-ink/85 p-3 sm:p-4" onClick={onClose}>
      <div className="my-auto w-full min-w-0 max-w-3xl animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3 text-white sm:gap-4">
          <h3 className="min-w-0 flex-1 type-subheading"><GradientText light>{t(item.title, lang)}</GradientText></h3>
          <button onClick={onClose} aria-label="Close" className="shrink-0 opacity-70 hover:opacity-100">
            <X size={22} />
          </button>
        </div>
        {id ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
              title={t(item.title, lang)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : item.audioUrl ? (
          <div className="rounded-2xl bg-white p-6">
            <audio controls autoPlay src={item.audioUrl} className="w-full" />
            {t(item.description, lang) && (
              <p className="mt-4 type-body-sm leading-relaxed text-ink-muted">{t(item.description, lang)}</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center type-body-sm text-ink-muted">{s('videoUnavailable')}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- gallery ---------------- */

export function AlbumCard({ album, view = 'card' }: { album: Album; view?: ViewMode }) {
  const { lang, path, s } = useSite();
  const meta = `${album.eventDate ? formatDate(album.eventDate, lang) : ''}${
    album.itemCount ? ` · ${album.itemCount} ${s('photos')}` : ''
  }`;

  if (view === 'list') {
    return (
      <Link
        to={path(`/media/gallery/${album.slug}`)}
        className="card-hover group flex items-center overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft"
      >
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden bg-plum-800">
          {album.coverImage ? (
            <img src={album.coverImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Placeholder className="absolute inset-0 h-full w-full" />
          )}
        </div>
        <div className="min-w-0 flex-1 p-2.5">
          <h3 className="line-clamp-2 type-title text-plum-800">
            <GradientText>{t(album.title, lang)}</GradientText>
          </h3>
          {meta && <p className="mt-0.5 type-meta text-ink-muted">{meta}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={path(`/media/gallery/${album.slug}`)}
      className="card-hover group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-plum-800 p-2.5 text-white shadow-soft sm:rounded-2xl sm:p-5"
    >
      {album.coverImage ? (
        <img
          src={album.coverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Placeholder className="absolute inset-0 h-full w-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-plum-900 via-plum-900/40 to-transparent" />
      <div className="relative">
        <h3 className="type-title-lg line-clamp-2 max-sm:type-title"><GradientText light>{t(album.title, lang)}</GradientText></h3>
        {meta && <p className="mt-0.5 line-clamp-1 type-meta text-white/70 sm:mt-1">{meta}</p>}
      </div>
    </Link>
  );
}

export function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const { lang, s } = useSite();
  const item = items[index];
  // A lone picture (a poster) has nothing to step to: no arrows, no counter
  const single = items.length <= 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, items.length, onClose, onIndex]);

  // Focus starts on the close button and goes back to whatever opened the viewer
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => {
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);

  if (!item) return null;

  // Portalled to <body>: a transformed or clipping ancestor (a Reveal, a card) cannot trap
  // the fixed overlay, and it stacks above the sticky header (z-50)
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(item.caption, lang) || undefined}
      className="fixed inset-0 z-[70] flex flex-col bg-ink/90 p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* A click or tap anywhere off the picture closes the viewer (the backdrop's onClick) */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {/* Wraps the picture exactly, so the close button sits on its top corner. The caps are
            in viewport units (screen less the padding and the row below): it never overflows */}
        <div className="relative min-h-24 min-w-24" onClick={(e) => e.stopPropagation()}>
          {item.kind === 'video' ? (
            <video
              src={item.url}
              controls
              autoPlay
              className="block max-h-[min(80vh,calc(100dvh-6rem))] max-w-[calc(100vw-2rem)] rounded-xl"
            />
          ) : (
            /* key: the pop (fade + slight scale) replays for each photo */
            <img
              key={index}
              src={item.url}
              alt=""
              className="block max-h-[min(80vh,calc(100dvh-6rem))] max-w-[calc(100vw-2rem)] animate-pop-in rounded-xl object-contain"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={s('close')}
            autoFocus
            className="absolute end-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-white ring-1 ring-white/40 backdrop-blur-sm transition hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:end-3 sm:top-3 sm:h-10 sm:w-10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 pt-3 text-white/70">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index - 1 + items.length) % items.length);
          }}
          className={`rounded-full border border-white/25 px-4 py-1.5 type-body-sm hover:bg-white/10 ${single ? 'invisible' : ''}`}
        >
          ←
        </button>
        <span className="line-clamp-1 text-center type-body-sm">
          {t(item.caption, lang)} {!single && <span className="opacity-50">({index + 1}/{items.length})</span>}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index + 1) % items.length);
          }}
          className={`rounded-full border border-white/25 px-4 py-1.5 type-body-sm hover:bg-white/10 ${single ? 'invisible' : ''}`}
        >
          →
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * A poster in the side column of a `ContentPanel`. It is shown whole at its own shape
 * (never cropped or stretched) and a click opens it full size in the lightbox. If the
 * file cannot be loaded, `fallback` (e.g. the logo) takes its place: no broken image
 * and no empty frame.
 */
export function PanelPoster({ src, alt, fallback = null }: { src: string; alt: string; fallback?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt}
        className="group mx-auto block w-full max-w-[240px] overflow-hidden rounded-lg border border-plum-100 bg-white shadow-soft sm:max-w-[300px] sm:rounded-xl lg:max-w-none"
      >
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </button>
      {open && (
        <Lightbox
          items={[{ url: src, thumbnailUrl: src, caption: { ml: '', en: '' }, kind: 'image' }]}
          index={0}
          onClose={() => setOpen(false)}
          onIndex={() => {}}
        />
      )}
    </>
  );
}

export function GalleryGrid({ items: all }: { items: MediaItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  // Entries without a file are never drawn, so the grid and the lightbox count the same photos
  const items = validMedia(all);
  if (!items.length) return null;

  return (
    <>
      <div className="gallery-grid">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-mist-deep shadow-soft sm:rounded-2xl"
          >
            {item.kind === 'video' ? (
              <>
                <video src={item.url} className="h-full w-full object-cover" muted />
                <span className="absolute inset-0 grid place-items-center bg-ink/25">
                  <Play size={22} className="text-white" fill="currentColor" />
                </span>
              </>
            ) : (
              <img
                src={item.thumbnailUrl || item.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      )}
    </>
  );
}

/* ---------------- publications, downloads, links ---------------- */

export function PublicationCard({ publication, view = 'card' }: { publication: Publication; view?: ViewMode }) {
  const { lang, path } = useSite();
  const row = view === 'list';
  /* Phones: `card` is a tall cover over its title (two to a row); `list` is a compact row.
     From sm both are the cover-beside-text card. */
  const cover = row
    ? 'h-24 w-[4.5rem] sm:h-32 sm:w-24'
    : 'aspect-[3/4] w-full sm:aspect-auto sm:h-32 sm:w-24';
  return (
    <Link
      to={path(`/publications/${publication.slug}`)}
      className={`card-hover group flex border border-plum-100 bg-white shadow-soft sm:flex-row sm:gap-4 sm:rounded-2xl sm:p-4 ${
        row ? 'gap-3 rounded-xl p-2.5' : 'flex-col gap-1.5 rounded-lg p-2'
      }`}
    >
      {publication.coverImage ? (
        <img
          src={publication.coverImage}
          alt=""
          loading="lazy"
          className={`shrink-0 rounded-md object-cover shadow-soft sm:rounded-xl ${cover}`}
        />
      ) : (
        <div className={`grid shrink-0 place-items-center rounded-md bg-magenta-50 text-plum-300 sm:rounded-xl ${cover}`}>
          <FileText size={26} />
        </div>
      )}
      <div className={`min-w-0 flex-1 sm:py-1 ${row ? 'py-1' : ''}`}>
        <span className={`type-overline font-medium tracking-wider text-magenta-500 sm:inline ${row ? '' : 'hidden'}`}>
          {publication.type}
        </span>
        <h3
          className={`type-title line-clamp-2 text-plum-800 transition group-hover:text-magenta-600 sm:mt-1 ${
            row ? 'mt-0.5' : 'max-sm:type-tile'
          }`}
        >
          <GradientText>{t(publication.title, lang)}</GradientText>
        </h3>
        {t(publication.author, lang) && (
          <p className={`type-caption text-ink-muted sm:mt-1 sm:block ${row ? 'mt-0.5' : 'hidden'}`}>
            {t(publication.author, lang)}
          </p>
        )}
      </div>
    </Link>
  );
}

export function DownloadRow({ item }: { item: DownloadItem }) {
  const { lang, s } = useSite();
  return (
    <a
      href={item.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2.5 rounded-xl border border-plum-100 bg-white p-2.5 shadow-soft transition hover:border-magenta-300 sm:gap-4 sm:rounded-2xl sm:p-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-magenta-50 text-magenta-600 sm:h-12 sm:w-12 sm:rounded-xl">
        <FileText size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate type-title text-plum-800">
          <GradientText>{t(item.title, lang)}</GradientText>
        </span>
        {t(item.description, lang) && (
          <span className="mt-0.5 block line-clamp-1 type-caption text-ink-muted">
            {t(item.description, lang)}
          </span>
        )}
      </span>
      <span className="hidden shrink-0 type-meta text-ink-faint sm:block">
        {formatBytes(item.sizeBytes)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-magenta-500 px-2.5 py-1.5 type-meta font-semibold text-white transition group-hover:bg-magenta-600 sm:px-4 sm:py-2">
        <Download size={14} />
        <span className="hidden sm:inline">{s('download')}</span>
      </span>
    </a>
  );
}

export function LinkCard({ link }: { link: ExternalLink }) {
  const { lang } = useSite();
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="card-hover group flex items-start gap-3 rounded-2xl border border-plum-100 bg-white p-3 shadow-soft sm:gap-4 sm:rounded-2xl sm:p-5"
    >
      {link.logoUrl ? (
        <img src={link.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain sm:h-12 sm:w-12 sm:rounded-xl" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-magenta-50 font-display text-base font-bold text-magenta-600 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
          {(t(link.title, lang) || '?').charAt(0)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 type-title text-plum-800 transition group-hover:text-magenta-600">
          <GradientText>{t(link.title, lang)}</GradientText>
          <ArrowUpRight size={15} className="opacity-60" />
        </span>
        {t(link.description, lang) && (
          <span className="mt-0.5 block type-caption leading-relaxed text-ink-muted sm:mt-1">
            {t(link.description, lang)}
          </span>
        )}
      </span>
    </a>
  );
}
