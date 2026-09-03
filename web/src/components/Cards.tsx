import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Calendar, Download, FileText, MapPin, Play, X } from 'lucide-react';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes, formatDate, formatDay, youtubeId, youtubeThumb } from '../lib/format';
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

export function PostCard({ post, compact = false }: { post: MediaPost; compact?: boolean }) {
  const { lang, path, s } = useSite();
  const to = path(`/media/${post.type}/${post.slug}`);

  if (compact) {
    return (
      <Link to={to} className="group flex gap-4 py-4">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="h-20 w-24 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <Placeholder className="h-20 w-24 shrink-0 rounded-xl" />
        )}
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-magenta-500">
            {formatDate(post.publishedAt, lang)}
          </div>
          <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
            {t(post.title, lang)}
          </h3>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
    >
      {post.coverImage ? (
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className="aspect-[16/10]" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-magenta-500">
          {formatDate(post.publishedAt, lang)}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
          {t(post.title, lang)}
        </h3>
        {t(post.excerpt, lang) && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {t(post.excerpt, lang)}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-magenta-600">
          {s('readMore')}
          <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- events ---------------- */

export function EventCard({ event }: { event: OrgEvent }) {
  const { lang, path, s } = useSite();
  const { day, month } = formatDay(event.startDate, lang);

  return (
    <Link
      to={path(`/events/${event.slug}`)}
      className="card-hover group flex min-w-0 gap-4 rounded-3xl border border-plum-100 bg-white p-4 shadow-soft sm:gap-5 sm:p-5"
    >
      <div className="flex h-[64px] w-[60px] shrink-0 flex-col items-center justify-center rounded-2xl bg-plum-800 text-white sm:h-[74px] sm:w-[70px]">
        <span className="font-display text-2xl font-bold leading-none">{day}</span>
        <span className="mt-1 text-[11px] uppercase tracking-wide text-magenta-300">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
          {t(event.title, lang)}
        </h3>
        <div className="mt-2 space-y-1 text-[13px] text-ink-muted">
          {event.timeLabel && (
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="shrink-0 text-magenta-500" />
              {event.timeLabel}
            </div>
          )}
          {t(event.venue, lang) && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-magenta-500" />
              <span className="line-clamp-1">{t(event.venue, lang)}</span>
            </div>
          )}
        </div>
        {event.registrationEnabled && (
          <span className="mt-3 inline-block rounded-full bg-magenta-500/12 px-3 py-1 text-[11px] font-semibold text-magenta-500">
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
      className="card-hover group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-3xl bg-plum-800 p-6 text-white shadow-soft"
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
          <span className="mb-2 inline-block rounded-full bg-magenta-500 px-3 py-1 text-[11px] font-semibold">
            {campaign.hashtag}
          </span>
        )}
        <h3 className="font-display text-xl font-semibold leading-snug">{t(campaign.title, lang)}</h3>
        {t(campaign.summary, lang) && (
          <p className="mt-2 line-clamp-2 text-sm text-white/75">{t(campaign.summary, lang)}</p>
        )}
      </div>
    </Link>
  );
}

/* ---------------- departments & programmes ---------------- */

export function DepartmentCard({ department }: { department: Pick<Department, '_id' | 'slug' | 'title' | 'tagline' | 'coverImage' | 'logoUrl'> }) {
  const { lang, path, s } = useSite();
  return (
    <Link
      to={path(`/departments/${department.slug}`)}
      className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
    >
      {department.coverImage ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={department.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className="aspect-[16/9]" />
      )}
      <div className="flex flex-1 flex-col p-6">
        {department.logoUrl && (
          <img src={department.logoUrl} alt="" className="mb-3 h-10 w-auto object-contain" />
        )}
        <h3 className="font-display text-lg font-semibold text-plum-800 transition group-hover:text-magenta-600">
          {t(department.title, lang)}
        </h3>
        {t(department.tagline, lang) && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {t(department.tagline, lang)}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-magenta-600">
          {s('viewDetails')}
          <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export function ProgramCard({ program }: { program: Pick<Program, '_id' | 'slug' | 'title' | 'tagline' | 'coverImage' | 'logoUrl' | 'externalUrl' | 'externalLabel'> }) {
  const { lang, path, s } = useSite();
  return (
    <Link
      to={path(`/programs/${program.slug}`)}
      className="card-hover group relative flex flex-col overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
    >
      {program.coverImage ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={program.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <Placeholder className="aspect-[16/9]" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold text-plum-800 transition group-hover:text-magenta-600">
          {t(program.title, lang)}
        </h3>
        {t(program.tagline, lang) && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {t(program.tagline, lang)}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-magenta-600">
          {program.externalUrl ? t(program.externalLabel, lang) || s('visitWebsite') : s('viewDetails')}
          <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- leaders ---------------- */

export function LeaderCard({ leader }: { leader: Leader }) {
  const { lang } = useSite();
  return (
    <div className="group overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft">
      {leader.photo ? (
        <div className="aspect-[4/5] overflow-hidden bg-mist-deep">
          <img
            src={leader.photo}
            alt={t(leader.name, lang)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <Placeholder className="aspect-[4/5]" />
      )}
      <div className="p-5 text-center">
        <h3 className="font-display text-[16px] font-semibold leading-snug text-plum-800">{t(leader.name, lang)}</h3>
        {t(leader.designation, lang) && (
          <p className="mt-1 text-[13px] text-ink-muted">{t(leader.designation, lang)}</p>
        )}
        {leader.termLabel && (
          <p className="mt-2 text-[11px] uppercase tracking-wider text-magenta-500">{leader.termLabel}</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- media ---------------- */

export function VideoCard({ item, onPlay }: { item: VideoItem; onPlay?: (item: VideoItem) => void }) {
  const { lang } = useSite();
  const thumb = item.thumbnailUrl || youtubeThumb(item.youtubeUrl);
  const isPodcast = item.kind === 'podcast';

  return (
    <button
      onClick={() => onPlay?.(item)}
      className="card-hover group w-full overflow-hidden rounded-3xl border border-plum-100 bg-white text-start shadow-soft"
    >
      <div className="relative aspect-video overflow-hidden bg-plum-900">
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
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-magenta-600 shadow-lift transition group-hover:scale-110">
            <Play size={20} className="ms-0.5" fill="currentColor" />
          </span>
        </span>
        {item.durationLabel && (
          <span className="absolute bottom-3 end-3 rounded-md bg-ink/80 px-2 py-0.5 text-[11px] font-medium text-white">
            {item.durationLabel}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-magenta-500">
          {isPodcast ? 'Podcast' : formatDate(item.publishedAt, lang)}
        </div>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-plum-800">
          {t(item.title, lang)}
        </h3>
      </div>
    </button>
  );
}

export function VideoPlayerModal({ item, onClose }: { item: VideoItem; onClose: () => void }) {
  const { lang } = useSite();
  const id = youtubeId(item.youtubeUrl);

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
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/85 p-3 sm:p-4" onClick={onClose}>
      <div className="my-auto w-full min-w-0 max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3 text-white sm:gap-4">
          <h3 className="min-w-0 flex-1 font-display text-base font-semibold leading-snug sm:text-lg">{t(item.title, lang)}</h3>
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
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-muted">—</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- gallery ---------------- */

export function AlbumCard({ album }: { album: Album }) {
  const { lang, path, s } = useSite();
  return (
    <Link
      to={path(`/media/gallery/${album.slug}`)}
      className="card-hover group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-3xl bg-plum-800 p-5 text-white shadow-soft"
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
        <h3 className="font-display text-[17px] font-semibold leading-snug">{t(album.title, lang)}</h3>
        <p className="mt-1 text-xs text-white/70">
          {album.eventDate ? formatDate(album.eventDate, lang) : ''}
          {album.itemCount ? ` · ${album.itemCount} ${s('photos')}` : ''}
        </p>
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
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink/92 p-4" onClick={onClose}>
      <div className="flex justify-end">
        <button onClick={onClose} aria-label="Close" className="p-2 text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {item.kind === 'video' ? (
          <video src={item.url} controls autoPlay className="max-h-[80vh] max-w-full rounded-xl" />
        ) : (
          <img src={item.url} alt="" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
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
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-mist-deep"
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

export function PublicationCard({ publication }: { publication: Publication }) {
  const { lang, path } = useSite();
  return (
    <Link
      to={path(`/publications/${publication.slug}`)}
      className="card-hover group flex gap-4 rounded-3xl border border-plum-100 bg-white p-4 shadow-soft"
    >
      {publication.coverImage ? (
        <img
          src={publication.coverImage}
          alt=""
          loading="lazy"
          className="h-32 w-24 shrink-0 rounded-xl object-cover shadow-soft"
        />
      ) : (
        <div className="grid h-32 w-24 shrink-0 place-items-center rounded-xl bg-magenta-50 text-plum-300">
          <FileText size={26} />
        </div>
      )}
      <div className="min-w-0 flex-1 py-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-magenta-500">
          {publication.type}
        </span>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
          {t(publication.title, lang)}
        </h3>
        {t(publication.author, lang) && (
          <p className="mt-1 text-[13px] text-ink-muted">{t(publication.author, lang)}</p>
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
      className="group flex items-center gap-4 rounded-2xl border border-plum-100 bg-white p-4 shadow-soft transition hover:border-magenta-300"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-magenta-50 text-magenta-600">
        <FileText size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-plum-800">
          {t(item.title, lang)}
        </span>
        {t(item.description, lang) && (
          <span className="mt-0.5 block line-clamp-1 text-[13px] text-ink-muted">
            {t(item.description, lang)}
          </span>
        )}
      </span>
      <span className="hidden shrink-0 text-xs text-ink-faint sm:block">
        {formatBytes(item.sizeBytes)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-magenta-500 px-4 py-2 text-[12px] font-semibold text-white transition group-hover:bg-magenta-600">
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
      className="card-hover group flex items-start gap-4 rounded-3xl border border-plum-100 bg-white p-5 shadow-soft"
    >
      {link.logoUrl ? (
        <img src={link.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-magenta-50 font-display text-lg font-bold text-magenta-600">
          {(t(link.title, lang) || '?').charAt(0)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-plum-800 transition group-hover:text-magenta-600">
          {t(link.title, lang)}
          <ArrowUpRight size={15} className="opacity-60" />
        </span>
        {t(link.description, lang) && (
          <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">
            {t(link.description, lang)}
          </span>
        )}
      </span>
    </a>
  );
}
