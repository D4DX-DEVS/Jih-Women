import { GradientText } from './Primitives';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowUpRight,
  Calendar,
  Download,
  FileText,
  MapPin,
  Play,
  X,
} from 'lucide-react';
import { useSite } from '../lib/site';
import type { ViewMode } from '../lib/view';
import { t } from '../lib/i18n';
import {
  formatBytes,
  formatDate,
  formatDay,
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
  view = 'card',
}: {
  post: MediaPost;
  compact?: boolean;
  /** Phones only (see useViewMode): `card` is a small tile for a three-up grid, `list` a compact row */
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
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-magenta-500 sm:text-[11px]">
            {formatDate(post.publishedAt, lang)}
          </div>
          <h3 className="mt-0.5 line-clamp-2 font-display text-[13.5px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:mt-1 sm:text-[15px]">
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
      className={`card-hover group flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-3xl ${
        row ? 'rounded-xl' : 'flex-col rounded-lg'
      }`}
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
        className={`flex min-w-0 flex-1 flex-col sm:justify-start sm:p-5 ${row ? 'justify-center p-2.5' : 'p-1.5'}`}
      >
        {/* Dates read in English on every card; the title and preview stay in the site language */}
        <div
          className={`font-medium uppercase text-magenta-500 sm:text-[11px] sm:tracking-wider ${
            row ? 'text-[10.5px] tracking-wider' : 'text-[9px] tracking-normal'
          }`}
        >
          {formatDate(post.publishedAt, 'en')}
        </div>
        <h3
          className={`font-display font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:mt-2 sm:line-clamp-2 sm:text-lg sm:leading-snug ${
            row ? 'mt-0.5 line-clamp-2 text-[13px] leading-snug' : 'mt-0.5 line-clamp-3 text-[11px] leading-tight'
          }`}
        >
          <GradientText>{t(post.title, lang)}</GradientText>
        </h3>
        {/* A short preview only; the full story is on the detail page */}
        {t(post.excerpt, lang) && (
          <p
            className={`leading-relaxed text-ink-muted sm:mt-2 sm:line-clamp-2 sm:block sm:text-sm ${
              row ? 'mt-0.5 line-clamp-1 text-[11.5px]' : 'hidden'
            }`}
          >
            {t(post.excerpt, lang)}
          </p>
        )}
        <span className="mt-auto hidden items-center gap-1.5 pt-4 text-[13px] font-semibold text-magenta-600 sm:inline-flex">
          {h('readMore')}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- events ---------------- */

export function EventCard({ event, view = 'card' }: { event: OrgEvent; view?: ViewMode }) {
  const { lang, path, s } = useSite();
  const { day, month } = formatDay(event.startDate, lang);
  const row = view === 'list';

  return (
    <Link
      to={path(`/events/${event.slug}`)}
      className={`card-hover group flex min-w-0 border border-plum-100 bg-white shadow-soft sm:flex-row sm:gap-5 sm:rounded-3xl sm:p-5 ${
        row ? 'gap-2.5 rounded-xl p-2' : 'flex-col gap-1.5 rounded-lg p-2'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center bg-plum-800 text-white sm:h-[74px] sm:w-[70px] sm:flex-col sm:gap-0 sm:self-auto sm:rounded-2xl sm:px-0 sm:py-0 ${
          row ? 'h-10 w-10 flex-col rounded-lg' : 'gap-1 self-start rounded-md px-2 py-1'
        }`}
      >
        <span className={`font-display font-bold leading-none sm:text-2xl ${row ? 'text-[15px]' : 'text-[13px]'}`}>{day}</span>
        <span className="text-[9px] uppercase tracking-wide text-magenta-300 sm:mt-1 sm:text-[11px]">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className={`font-display font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-2 sm:text-[17px] sm:leading-snug ${
            row ? 'line-clamp-2 text-[13px] leading-snug' : 'line-clamp-3 text-[11px] leading-tight'
          }`}
        >
          <GradientText>{t(event.title, lang)}</GradientText>
        </h3>
        <div className={`text-ink-muted sm:mt-2 sm:space-y-1 sm:text-[13px] ${row ? 'mt-0.5 space-y-0 text-[11.5px]' : 'mt-1 space-y-0 text-[10px]'}`}>
          {event.timeLabel && (
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="shrink-0 text-magenta-500" />
              <span className={row ? '' : 'truncate'}>{event.timeLabel}</span>
            </div>
          )}
          {t(event.venue, lang) && (
            <div className={`items-center gap-1.5 sm:flex ${row ? 'flex' : 'hidden'}`}>
              <MapPin size={13} className="shrink-0 text-magenta-500" />
              <span className="line-clamp-1">{t(event.venue, lang)}</span>
            </div>
          )}
        </div>
        {event.registrationEnabled && (
          <span className="mt-3 hidden rounded-full bg-magenta-500/12 px-3 py-1 text-[11px] font-semibold text-magenta-500 sm:inline-block">
            {s('registerNow')}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ---------------- campaigns ---------------- */

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { lang, path } = useSite();
  return (
    <Link
      to={path(`/campaigns/${campaign.slug}`)}
      className="card-hover group relative flex min-h-[170px] flex-col justify-end overflow-hidden rounded-2xl bg-plum-800 p-4 text-white shadow-soft sm:min-h-[260px] sm:rounded-3xl sm:p-6"
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
          <span className="mb-1.5 inline-block rounded-full bg-magenta-500 px-2.5 py-0.5 text-[10.5px] font-semibold sm:mb-2 sm:px-3 sm:py-1 sm:text-[11px]">
            {campaign.hashtag}
          </span>
        )}
        <h3 className="font-display text-base font-semibold leading-snug sm:text-xl"><GradientText light>{t(campaign.title, lang)}</GradientText></h3>
        {t(campaign.summary, lang) && (
          <p className="mt-1 line-clamp-2 text-[12.5px] text-white/75 sm:mt-2 sm:text-sm">{t(campaign.summary, lang)}</p>
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
  /** Phones only (see useViewMode): `card` is a small tile for a three-up grid, `list` a compact row */
  view?: ViewMode;
}) {
  const { lang, path, s } = useSite();
  const row = view === 'list';
  const pic = row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-[4/3]';
  return (
    <Link
      to={path(`/departments/${department.slug}`)}
      className={`card-hover group flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-3xl ${
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
      <div className={`flex min-w-0 flex-1 flex-col sm:justify-start sm:p-6 ${row ? 'justify-center p-2.5' : 'p-1.5'}`}>
        {department.logoUrl && (
          <img src={department.logoUrl} alt="" className="mb-3 hidden h-10 w-auto object-contain sm:block" />
        )}
        <h3
          className={`font-display font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-none sm:text-lg sm:leading-normal ${
            row ? 'text-[13.5px]' : 'line-clamp-3 text-[11px] leading-tight'
          }`}
        >
          <GradientText>{t(department.title, 'en')}</GradientText>
        </h3>
        {t(department.tagline, lang) && (
          <p
            className={`leading-relaxed text-ink-muted sm:mt-2 sm:line-clamp-3 sm:block sm:text-sm ${
              row ? 'mt-0.5 line-clamp-2 text-[11.5px]' : 'hidden'
            }`}
          >
            {t(department.tagline, lang)}
          </p>
        )}
        <span
          className={`items-center font-semibold text-magenta-600 sm:mt-4 sm:inline-flex sm:gap-1.5 sm:text-[13px] ${
            row ? 'mt-1.5 inline-flex gap-1 text-[11.5px]' : 'hidden'
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
  program: Pick<Program, '_id' | 'slug' | 'title' | 'tagline' | 'logoUrl' | 'externalUrl' | 'externalLabel'>;
  /** Phones only (see useViewMode): `card` is a small tile for a three-up grid, `list` a compact row */
  view?: ViewMode;
}) {
  const { lang, path, s } = useSite();
  const row = view === 'list';
  return (
    <Link
      to={path(`/programs/${program.slug}`)}
      className={`card-hover group relative flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-3xl ${
        row ? 'rounded-xl' : 'flex-col rounded-lg'
      }`}
    >
      {program.logoUrl ? (
        /* The programme's logo (its only managed image), whole and centred; multiply
           lets white or near-white logo backgrounds melt into the card */
        <div
          className={`flex items-center justify-center overflow-hidden border-plum-100/70 bg-white sm:aspect-[16/9] sm:border-b sm:border-e-0 sm:p-8 ${
            row ? 'w-[7.5rem] shrink-0 self-stretch border-e p-3 sm:w-auto sm:self-auto' : 'aspect-square border-b p-2'
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
          className={`sm:aspect-[16/9] ${row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-square'}`}
        />
      )}
      <div className={`flex min-w-0 flex-1 flex-col sm:justify-start sm:p-6 ${row ? 'justify-center p-2.5' : 'p-1.5'}`}>
        {/* Programme names and labels are always English; the tagline follows the site language */}
        <h3
          className={`font-display font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:line-clamp-none sm:text-[1.05rem] sm:leading-snug md:text-[1.1rem] ${
            row ? 'text-[13.5px] leading-snug' : 'line-clamp-2 text-[11px] leading-tight'
          }`}
        >
          <GradientText>{t(program.title, 'en')}</GradientText>
        </h3>
        {t(program.tagline, lang) && (
          <p
            className={`leading-relaxed text-ink-muted sm:mt-2 sm:line-clamp-3 sm:block sm:text-sm ${
              row ? 'mt-0.5 line-clamp-2 text-[11.5px]' : 'hidden'
            }`}
          >
            {t(program.tagline, lang)}
          </p>
        )}
        <span
          className={`items-center font-semibold text-magenta-600 sm:mt-4 sm:inline-flex sm:gap-1.5 sm:text-[13px] ${
            row ? 'mt-1.5 inline-flex gap-1 text-[11.5px]' : 'hidden'
          }`}
        >
          {program.externalUrl ? t(program.externalLabel, 'en') || s('visitWebsite') : s('viewDetails')}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- leaders ---------------- */

export function LeaderCard({ leader, view = 'card' }: { leader: Leader; view?: ViewMode }) {
  const { lang } = useSite();

  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-plum-100 bg-white p-2.5 shadow-soft">
        {leader.photo ? (
          <img
            src={leader.photo}
            alt={t(leader.name, lang)}
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2 ring-white"
          />
        ) : (
          <Placeholder className="h-12 w-12 shrink-0 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[13.5px] font-semibold leading-snug text-plum-800 [overflow-wrap:anywhere]">
            <GradientText>{t(leader.name, lang)}</GradientText>
          </h3>
          {t(leader.designation, lang) && (
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{t(leader.designation, lang)}</p>
          )}
        </div>
        {leader.termLabel && (
          <span className="shrink-0 text-[10.5px] uppercase tracking-wider text-magenta-500">{leader.termLabel}</span>
        )}
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-lg border border-plum-100 bg-white shadow-soft sm:rounded-2xl">
      {leader.photo ? (
        <div className="aspect-square overflow-hidden bg-mist-deep sm:aspect-[4/5]">
          <img
            src={leader.photo}
            alt={t(leader.name, lang)}
            loading="lazy"
            /* Portrait frame; anchored to the top so faces stay in view when a photo isn't 4:5 */
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <Placeholder className="aspect-square sm:aspect-[4/5]" />
      )}
      <div className="p-1.5 text-center sm:p-4">
        <h3 className="font-display text-[11px] font-semibold leading-tight text-plum-800 [overflow-wrap:anywhere] sm:text-[15px] sm:leading-snug">
          <GradientText>{t(leader.name, lang)}</GradientText>
        </h3>
        {t(leader.designation, lang) && (
          <p className="mt-0.5 text-[10px] leading-tight text-ink-muted sm:mt-1 sm:text-[13px] sm:leading-snug">{t(leader.designation, lang)}</p>
        )}
        {leader.termLabel && (
          <p className="mt-2 hidden text-[11px] uppercase tracking-wider text-magenta-500 sm:block">{leader.termLabel}</p>
        )}
      </div>
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
  /** Phones only (see useViewMode): `card` is a small tile for a three-up grid, `list` a compact
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
      className={`card-hover group w-full overflow-hidden border border-plum-100 bg-white text-start shadow-soft sm:rounded-3xl ${
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
              list ? 'h-8 w-8' : tile ? 'h-6 w-6' : 'h-10 w-10'
            }`}
          >
            <Play size={tile ? 11 : 17} className="ms-0.5" fill="currentColor" />
          </span>
        </span>
        {item.durationLabel && (
          <span
            className={`absolute rounded-md bg-ink/80 font-medium text-white sm:bottom-3 sm:end-3 sm:px-2 sm:py-0.5 sm:text-[11px] ${
              tile ? 'bottom-1 end-1 px-1 py-px text-[9px]' : 'bottom-2 end-2 px-1.5 py-0.5 text-[10.5px]'
            }`}
          >
            {item.durationLabel}
          </span>
        )}
      </div>
      <div className={`min-w-0 sm:p-5 ${list ? 'flex-1 p-2.5 sm:flex-none' : tile ? 'p-1.5' : 'p-3'}`}>
        <div
          className={`font-medium uppercase text-magenta-500 sm:text-[11px] sm:tracking-wider ${
            tile ? 'text-[9px] tracking-normal' : 'text-[10.5px] tracking-wider'
          }`}
        >
          {isPodcast ? 'Podcast' : formatDate(item.publishedAt, lang)}
        </div>
        <h3
          className={`font-display font-semibold text-plum-800 sm:mt-1.5 sm:line-clamp-2 sm:text-[15px] sm:leading-snug ${
            tile ? 'mt-0.5 line-clamp-2 text-[11px] leading-tight' : 'mt-1 line-clamp-2 text-[13.5px] leading-snug'
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
          <h3 className="min-w-0 flex-1 font-display text-base font-semibold leading-snug sm:text-lg"><GradientText light>{t(item.title, lang)}</GradientText></h3>
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
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{t(item.description, lang)}</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-muted">{s('videoUnavailable')}</div>
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
          <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-snug text-plum-800">
            <GradientText>{t(album.title, lang)}</GradientText>
          </h3>
          {meta && <p className="mt-0.5 text-[11px] text-ink-muted">{meta}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={path(`/media/gallery/${album.slug}`)}
      className="card-hover group relative flex aspect-square flex-col justify-end overflow-hidden rounded-lg bg-plum-800 p-1.5 text-white shadow-soft sm:aspect-[4/3] sm:rounded-3xl sm:p-5"
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
        <h3 className="line-clamp-2 font-display text-[10.5px] font-semibold leading-tight sm:text-[17px] sm:leading-snug"><GradientText light>{t(album.title, lang)}</GradientText></h3>
        <p className="mt-1 hidden text-xs text-white/70 sm:block">{meta}</p>
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
  const { lang } = useSite();
  const item = items[index];

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

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink/90 p-4 animate-fade-in" onClick={onClose}>
      <div className="flex justify-end">
        <button onClick={onClose} aria-label="Close" className="p-2 text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {item.kind === 'video' ? (
          <video src={item.url} controls autoPlay className="max-h-[80vh] max-w-full rounded-xl" />
        ) : (
          /* key: the pop (fade + slight scale) replays for each photo */
          <img key={index} src={item.url} alt="" className="max-h-[80vh] max-w-full animate-pop-in rounded-xl object-contain" />
        )}
      </div>
      <div className="flex items-center justify-between gap-4 pt-3 text-white/70">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index - 1 + items.length) % items.length);
          }}
          className="rounded-full border border-white/25 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          ←
        </button>
        <span className="line-clamp-1 text-center text-sm">
          {t(item.caption, lang)} <span className="opacity-50">({index + 1}/{items.length})</span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index + 1) % items.length);
          }}
          className="rounded-full border border-white/25 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          →
        </button>
      </div>
    </div>
  );
}

export function GalleryGrid({ items }: { items: MediaItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-mist-deep sm:rounded-2xl"
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
  /* Phones: `card` is a tall cover over its title (three to a row); `list` is a compact row.
     From sm both are the cover-beside-text card. */
  const cover = row
    ? 'h-24 w-[4.5rem] sm:h-32 sm:w-24'
    : 'aspect-[3/4] w-full sm:aspect-auto sm:h-32 sm:w-24';
  return (
    <Link
      to={path(`/publications/${publication.slug}`)}
      className={`card-hover group flex border border-plum-100 bg-white shadow-soft sm:flex-row sm:gap-4 sm:rounded-3xl sm:p-4 ${
        row ? 'gap-3 rounded-xl p-2.5' : 'flex-col gap-1 rounded-lg p-1.5'
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
        <span className={`text-[10.5px] font-medium uppercase tracking-wider text-magenta-500 sm:inline sm:text-[11px] ${row ? '' : 'hidden'}`}>
          {publication.type}
        </span>
        <h3
          className={`line-clamp-2 font-display font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:mt-1 sm:text-[15px] sm:leading-snug ${
            row ? 'mt-0.5 text-[13px] leading-snug' : 'text-[11px] leading-tight'
          }`}
        >
          <GradientText>{t(publication.title, lang)}</GradientText>
        </h3>
        {t(publication.author, lang) && (
          <p className={`text-ink-muted sm:mt-1 sm:block sm:text-[13px] ${row ? 'mt-0.5 text-[11.5px]' : 'hidden'}`}>
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
        <span className="block truncate font-display text-[13px] font-semibold text-plum-800 sm:text-[15px]">
          <GradientText>{t(item.title, lang)}</GradientText>
        </span>
        {t(item.description, lang) && (
          <span className="mt-0.5 block line-clamp-1 text-[11.5px] text-ink-muted sm:text-[13px]">
            {t(item.description, lang)}
          </span>
        )}
      </span>
      <span className="hidden shrink-0 text-xs text-ink-faint sm:block">
        {formatBytes(item.sizeBytes)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-magenta-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition group-hover:bg-magenta-600 sm:px-4 sm:py-2 sm:text-[12px]">
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
      className="card-hover group flex items-start gap-3 rounded-2xl border border-plum-100 bg-white p-3 shadow-soft sm:gap-4 sm:rounded-3xl sm:p-5"
    >
      {link.logoUrl ? (
        <img src={link.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain sm:h-12 sm:w-12 sm:rounded-xl" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-magenta-50 font-display text-base font-bold text-magenta-600 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
          {(t(link.title, lang) || '?').charAt(0)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display text-[13.5px] font-semibold text-plum-800 transition group-hover:text-magenta-600 sm:text-[15px]">
          <GradientText>{t(link.title, lang)}</GradientText>
          <ArrowUpRight size={15} className="opacity-60" />
        </span>
        {t(link.description, lang) && (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-muted sm:mt-1 sm:text-[13px]">
            {t(link.description, lang)}
          </span>
        )}
      </span>
    </a>
  );
}
