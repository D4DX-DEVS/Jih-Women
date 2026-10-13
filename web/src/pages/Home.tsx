import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Users,
} from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDate, isExternalUrl, youtubeThumb } from '../lib/format';
import {
  Container,
  ErrorState,
  GradientText,
  ManagedSectionHeading,
  Section,
  SectionLogo,
} from '../components/Primitives';
import { HomeSkeleton } from '../components/PageSkeletons';
import {
  CampaignCard,
  Lightbox,
  PostCard,
  PublicationCard,
  VideoPlayerModal,
} from '../components/Cards';
import FocusStrip from '../components/FocusStrip';
import PresidentMessageModal, { type PresidentPopupMode } from '../components/PresidentMessageModal';
import Reveal from '../components/Reveal';
import { useViewMode } from '../lib/view';
import type {
  HomePayload,
  MediaItem,
  MediaPost,
  OrgEvent,
  ProgramBanner,
  ProgramPoster,
  PresidentMessage,
  Slide,
  VideoItem,
} from '../lib/types';

export default function Home() {
  const { h } = useSite();
  const { view } = useViewMode();
  const { data, loading, error, reload } = useApi<HomePayload>('/api/site/home');
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  if (loading) return <HomeSkeleton />;
  if (error) {
    return (
      <Container className="py-20">
        <ErrorState message={error} onRetry={reload} />
      </Container>
    );
  }
  if (!data) return null;

  const { sections, presidentMessage } = data.settings;
  const banners = (data.programBanners ?? []).filter((b) => Boolean(b.logoUrl || b.bannerImage));
  // Programme posters uploaded in the admin share the Programs section with the logo strip
  const posters = (data.programPosters ?? []).filter((p) => Boolean(p.posterImage));
  const showPrograms = sections.programBanners !== false && (banners.length > 0 || posters.length > 0);
  // Event posters managed under Event Poster in the admin. An older backend only sends
  // `upcomingEvents`, so fall back to it rather than showing an empty Events section.
  const eventPosters = (data.eventPosters ?? data.upcomingEvents ?? []).filter((e) =>
    Boolean(e.posterImage || e.coverImage)
  );
  const showPresident =
    sections.presidentMessage !== false && presidentMessage?.enabled !== false && presidentMessage;
  // Focus: shown only while the admin's Focus switch (sections.focusAreas) is on
  const showFocus = sections.focusAreas !== false && (data.focusAreas?.length ?? 0) > 0;

  return (
    <>
      {sections.slider && data.sliders.length > 0 && <Hero slides={data.sliders} />}

      {showPrograms && <ProgramBanners banners={banners} posters={posters} />}

      <section className="bg-mist py-4 sm:py-7 md:py-9">
        <Container className="space-y-5">
          <Reveal>
            <PresidentAndEvents message={showPresident ? presidentMessage : null} events={eventPosters} />
          </Reveal>
          {showFocus && (
            <Reveal>
              <FocusStrip areas={data.focusAreas} />
            </Reveal>
          )}
        </Container>
      </section>

      <section className="bg-white py-4 sm:py-7 md:py-9">
        <Container>
          <Reveal>
            <NewsBand posts={data.updates} />
          </Reveal>
        </Container>
      </section>

      {data.featuredVideos.length > 0 && (
        <section className="border-t border-plum-100/70 bg-white pb-5 pt-4 sm:pb-8 sm:pt-7 md:pb-10 md:pt-9">
          <Container>
            <Reveal>
              <VideoRow videos={data.featuredVideos} onPlay={setPlaying} />
            </Reveal>
          </Container>
        </section>
      )}

      {(data.galleryPhotos?.length ?? 0) > 0 && (
        <section className="border-t border-plum-100/70 bg-white pb-5 pt-4 sm:pb-8 sm:pt-7 md:pb-10 md:pt-9">
          <Container>
            <PhotoGallery photos={data.galleryPhotos!} />
          </Container>
        </section>
      )}

      {sections.campaigns && data.campaigns.length > 0 && (
        <Section tone="white">
          <Container>
            <ManagedSectionHeading sectionKey="homeCampaigns" eyebrow={h('mediaCentre')} title={h('campaigns')} />
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {data.campaigns.map((c, i) => (
                <Reveal key={c._id} delay={Math.min(i, 6) * 60}>
                  <CampaignCard campaign={c} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {sections.featuredArticles && data.featuredArticles.length > 0 && (
        <Section tone="deep">
          <Container>
            <ManagedSectionHeading sectionKey="homeFeaturedArticles" eyebrow={h('media')} title={h('featuredArticles')} />
            <div className={`grid gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 ${view === 'list' ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {data.featuredArticles.map((post, i) => (
                <Reveal key={post._id} delay={Math.min(i, 6) * 60}>
                  <PostCard post={post} view={view} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {sections.publications && data.publications.length > 0 && (
        <Section tone="white">
          <Container>
            <ManagedSectionHeading sectionKey="homePublications" eyebrow={h('publications')} title={h('publications')} />
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {data.publications.map((p, i) => (
                <Reveal key={p._id} delay={Math.min(i, 6) * 60}>
                  <PublicationCard publication={p} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

/* ─────────────────────────── hero slider ─────────────────────────── */

/* Aspect ratio of the uploaded 1920×900 slides; used until the real images load. */
const HERO_FALLBACK_RATIO = 1920 / 900;

function Hero({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Natural width/height of each slide image, as actually loaded (mobile source included)
  const [ratios, setRatios] = useState<Record<number, number>>({});

  /* The hero takes the slides' own proportions at every width so each image is shown
     whole (slides carry their own text and logos). The tallest slide sets the height,
     keeping it steady while slides change; a wider slide is centred with a slim band
     of the hero colour above and below rather than being cropped. */
  const known = Object.values(ratios);
  const heroRatio = known.length ? Math.min(...known) : HERO_FALLBACK_RATIO;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <section
      className="relative isolate overflow-hidden bg-plum-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full">
        {slides.map((item, i) => (
          <div
            key={item._id}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-[900ms] ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={i !== index}
          >
            <picture>
              {item.mobileImageUrl && (
                <source media="(max-width: 640px)" srcSet={item.mobileImageUrl} />
              )}
              <img
                src={item.imageUrl}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                onLoad={(e) => {
                  const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                  if (w && h) setRatios((r) => ({ ...r, [i]: w / h }));
                }}
                /* Slow zoom in and out (5% at most), clipped by the slide; the slide
                   crossfade, arrows and dots sit outside it and stay still */
                className="h-full w-full animate-hero-zoom object-contain will-change-transform"
              />
            </picture>
          </div>
        ))}

        {/* Slides are absolutely positioned, so this spacer keeps the hero's height. */}
        <div
          className="aspect-[var(--hero-ratio)]"
          style={{ '--hero-ratio': heroRatio } as React.CSSProperties}
        />

        {slides.length > 1 && (
          <>
            {/* Arrows sit at the vertical middle at every width: the slides carry their
                own text and logos in the corners, which must stay visible */}
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute start-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-plum-800 shadow-soft transition hover:bg-white sm:start-3 sm:h-9 sm:w-9 sm:bg-white/90 md:start-6 md:h-10 md:w-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute end-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-plum-800 shadow-soft transition hover:bg-white sm:end-3 sm:h-9 sm:w-9 sm:bg-white/90 md:end-6 md:h-10 md:w-10"
            >
              <ChevronRight size={16} />
            </button>

            {/* Each dot sits in a padded button so it stays easy to tap on phones */}
            <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center md:bottom-3 lg:bottom-4">
              {slides.map((item, i) => (
                <button
                  key={item._id}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="group pointer-events-auto grid h-8 place-items-center px-2.5 lg:h-6 lg:px-[3px]"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === index ? 'w-5 bg-magenta-500' : 'w-1.5 bg-white/50 group-hover:bg-white/80'
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────── programme banner strip ─────────────────────── */

/* Fewest logos one marquee copy may hold. Sparse lists are repeated up to this so a
   single copy is wider than the widest strip (1280px container ÷ ~212px per logo),
   otherwise an empty gap would trail the list before the loop restarts. */
const MARQUEE_MIN_TILES = 8;
/* Drift speed of the programme strip, in px per second. */
const MARQUEE_SPEED = 28;
/* How long the drift stays paused after a drag or swipe ends, in ms. */
const MARQUEE_RESUME_DELAY = 1200;
/* Pointer travel (px) before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 6;

function MarqueeArrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  const { s } = useSite();
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={s(dir === 1 ? 'next' : 'previous')}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-plum-100 bg-white text-plum-800 shadow-soft transition hover:border-magenta-200 hover:text-magenta-600 sm:h-8 sm:w-8 md:h-9 md:w-9"
    >
      <Icon size={16} />
    </button>
  );
}

type DragState = {
  id: number;
  startX: number;
  startPos: number;
  lastX: number;
  lastT: number;
  /** px per ms, positive when the strip moves towards later items */
  velocity: number;
  moved: boolean;
};

/**
 * A strip that drifts slowly right to left and can be dragged (mouse) or swiped
 * (touch) either way. The track holds two identical copies of its items and the
 * offset wraps by one copy, so the loop is seamless in both directions. Hover,
 * keyboard focus and dragging pause the drift; it eases back in after a drag, and
 * prefers-reduced-motion turns it off. Spread `viewportProps` on the clipping
 * element (give it `touch-pan-y`), and put `trackRef` on the track.
 */
function useDriftStrip<V extends HTMLElement, T extends HTMLElement>(speedPxPerSec: number, resetKey: unknown) {
  const viewportRef = useRef<V>(null);
  const trackRef = useRef<T>(null);
  /* Offset of the track in px (how far it has moved left), wrapped to one copy. */
  const posRef = useRef(0);
  /* Hover/focus pause the drift; a drag pauses it until `resumeAtRef`. */
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const resumeAtRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  /* Set when a drag ends, so the click that follows doesn't activate an item. */
  const suppressClickRef = useRef(false);
  /* Distance (px) still to travel from arrow clicks and drag flings; eased out. */
  const pendingRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let speed = 0; // current drift speed, eased towards the target so pauses and resumes glide
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const copy = track.scrollWidth / 2;
      // Focusing an item can make the browser scroll the clipped viewport; fold that
      // into the offset and keep the viewport itself unscrolled.
      if (viewport.scrollLeft) {
        posRef.current += viewport.scrollLeft;
        viewport.scrollLeft = 0;
      }
      const dragging = Boolean(dragRef.current?.moved);
      const drifting =
        !dragging && !hoverRef.current && !focusRef.current && now >= resumeAtRef.current && !reduceMotion.matches;
      speed += ((drifting ? speedPxPerSec : 0) - speed) * Math.min(1, dt * 3);
      if (!dragging) {
        let move = speed * dt;
        const pending = pendingRef.current;
        if (pending) {
          const step = Math.abs(pending) < 0.5 ? pending : pending * Math.min(1, dt * 6);
          pendingRef.current -= step;
          move += step;
        }
        posRef.current += move;
      }
      if (copy > 0) {
        // Two identical copies sit side by side, so wrapping by one copy is seamless
        posRef.current = ((posRef.current % copy) + copy) % copy;
        track.style.transform = `translate3d(${-posRef.current}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speedPxPerSec, resetKey]);

  /** Arrow click: shift the strip by one item (+1 shows the next item on the right). */
  const nudge = (dir: 1 | -1) => {
    const item = trackRef.current?.firstElementChild as HTMLElement | null;
    pendingRef.current += dir * (item?.offsetWidth ?? 220);
  };

  const endDrag = (e: React.PointerEvent<V>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;
    e.currentTarget.style.cursor = '';
    suppressClickRef.current = true;
    // Carry on briefly in the direction of the flick, then rest before drifting again
    pendingRef.current = Math.max(-600, Math.min(600, drag.velocity * 250));
    resumeAtRef.current = performance.now() + MARQUEE_RESUME_DELAY;
  };

  const viewportProps = {
    onMouseEnter: () => (hoverRef.current = true),
    onMouseLeave: () => (hoverRef.current = false),
    // Only keyboard focus pauses the drift: pressing an item with the mouse or a
    // finger also focuses it, and that must not stop the strip for good
    onFocus: (e: React.FocusEvent<V>) => (focusRef.current = (e.target as HTMLElement).matches(':focus-visible')),
    onBlur: () => (focusRef.current = false),
    // Drag (mouse) and swipe (touch): the strip follows the pointer
    onPointerDown: (e: React.PointerEvent<V>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      suppressClickRef.current = false;
      pendingRef.current = 0;
      dragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: posRef.current,
        lastX: e.clientX,
        lastT: e.timeStamp,
        velocity: 0,
        moved: false,
      };
    },
    onPointerMove: (e: React.PointerEvent<V>) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        drag.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = 'grabbing';
      }
      posRef.current = drag.startPos - dx;
      const dt = Math.max(1, e.timeStamp - drag.lastT);
      // Smoothed velocity for the fling when the pointer is released
      drag.velocity = drag.velocity * 0.6 + ((drag.lastX - e.clientX) / dt) * 0.4;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture: (e: React.MouseEvent<V>) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  return { viewportRef, trackRef, nudge, viewportProps };
}

/* The strip heading as first shipped and stored in the admin-managed content. The home
   page shows "Highlights" in its place; any other wording an editor sets is shown as written. */
const SHIPPED_STRIP_HEADINGS = new Set(['Programs', 'പദ്ധതികൾ']);

function ProgramBanners({ banners, posters }: { banners: ProgramBanner[]; posters: ProgramPoster[] }) {
  const { path, section, h } = useSite();
  const heading = section('homePrograms', { heading: h('highlights') });
  const title = SHIPPED_STRIP_HEADINGS.has(heading.heading) ? h('highlights') : heading.heading;
  const hasStrip = banners.length > 0;
  const repeat = Math.ceil(MARQUEE_MIN_TILES / Math.max(1, banners.length));
  const loop = Array.from({ length: repeat }, () => banners).flat();

  const { viewportRef, trackRef, nudge, viewportProps } = useDriftStrip<HTMLDivElement, HTMLUListElement>(
    MARQUEE_SPEED,
    banners.length
  );

  /** One programme logo; `hidden` marks a repeated copy (not focusable or announced). */
  const renderTile = (banner: ProgramBanner, hidden = false) => {
    // A bare logo, no tile: fixed box, image contained so nothing is cropped or stretched
    const cls =
      'group flex h-9 w-[22vw] max-w-[88px] items-center justify-center rounded-lg sm:h-16 sm:w-[160px] sm:max-w-none lg:h-[72px] lg:w-[180px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta-400';
    const inner = (
      <img
        src={banner.logoUrl || banner.bannerImage}
        alt={hidden ? '' : t(banner.title, 'en')}
        loading="lazy"
        draggable={false}
        /* multiply + a touch of brightness lets white or near-white logo backgrounds
           melt into the white strip; transparent logos are unaffected */
        className="h-auto max-h-full w-auto max-w-full object-contain mix-blend-multiply brightness-[1.04] transition duration-300 group-hover:scale-105"
      />
    );
    const tabIndex = hidden ? -1 : undefined;
    return isExternalUrl(banner.externalUrl) ? (
      <a href={banner.externalUrl} target="_blank" rel="noopener noreferrer" className={cls} tabIndex={tabIndex} draggable={false}>
        {inner}
      </a>
    ) : (
      <Link to={path(`/programs/${banner.slug}`)} className={cls} tabIndex={tabIndex} draggable={false}>
        {inner}
      </Link>
    );
  };

  return (
    <section className="border-b border-plum-100/70 bg-white py-2.5 sm:py-5 md:py-6">
      <Container>
        <div className="mb-1.5 flex items-center justify-center gap-2 eyebrow sm:mb-4 sm:gap-3">
          {heading.logo && <SectionLogo src={heading.logo} />}
          <span className="brand-rule-start w-6 sm:w-10" />
          <span className="text-brand-gradient">{title}</span>
          <span className="brand-rule-end w-6 sm:w-10" />
        </div>
        {/* The row drifts slowly right to left; it can be dragged (mouse) or swiped
            (touch) either way, and the arrows jump it a tile at a time. Two copies of the
            (repeated) list sit side by side and the offset wraps by one copy width, so the
            loop is seamless in both directions. Hover, focus and dragging pause the drift;
            reduced-motion users get no drift. */}
        {hasStrip && (
          <div className="flex items-center gap-1.5 md:gap-3">
            <MarqueeArrow dir={-1} onClick={() => nudge(-1)} />
            <div
              ref={viewportRef}
              // Edges fade out so logos glide in and out instead of being sliced off
              className="min-w-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
              {...viewportProps}
            >
              <ul ref={trackRef} className="flex w-max will-change-transform">
                {[0, 1].map((copy) =>
                  loop.map((banner, i) => {
                    const hidden = copy === 1 || i >= banners.length;
                    return (
                      <li key={`${copy}-${i}`} className="shrink-0 px-2 sm:px-5 lg:px-4" aria-hidden={hidden || undefined}>
                        {renderTile(banner, hidden)}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
            <MarqueeArrow dir={1} onClick={() => nudge(1)} />
          </div>
        )}
        {posters.length > 0 && (
          <div className={hasStrip ? 'mt-4 sm:mt-7' : 'mt-2 sm:mt-0'}>
            <ProgramPosterGrid posters={posters} />
          </div>
        )}
      </Container>
    </section>
  );
}

/* Programme posters managed under Highlights in the admin. Each is shown whole — contained
   in a 4:5 frame, never cropped or stretched — with the programme name and short
   description beneath; it links to the programme page (or its external site). */
function ProgramPosterGrid({ posters }: { posters: ProgramPoster[] }) {
  const { lang, path } = useSite();

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {posters.map((poster) => {
        const name = t(poster.title, lang);
        const blurb = poster.tagline ? t(poster.tagline, lang) : '';
        const cls =
          'group flex h-full flex-col overflow-hidden rounded-xl border border-plum-100/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-magenta-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta-400';
        const body = (
          <>
            {/* The image fills the frame absolutely: a percentage height would not resolve
                against an aspect-ratio box, and a tall poster would stretch the card. */}
            <span className="relative block aspect-[4/5] w-full overflow-hidden bg-mist">
              <img
                src={poster.posterImage}
                alt={name}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
              />
            </span>
            <span className="block px-2.5 py-2 sm:px-3.5 sm:py-3">
              <span className="line-clamp-2 block font-display text-[12.5px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:text-[14.5px]">
                {name}
              </span>
              {blurb && (
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-ink-muted sm:text-[12.5px]">
                  {blurb}
                </span>
              )}
            </span>
          </>
        );
        return (
          <li key={poster._id} className="min-w-0">
            {isExternalUrl(poster.externalUrl) ? (
              <a href={poster.externalUrl} target="_blank" rel="noopener noreferrer" className={cls}>
                {body}
              </a>
            ) : (
              <Link to={path(`/programs/${poster.slug}`)} className={cls}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ────────────────────── president's message ────────────────────── */

function Eyebrow({ children, logo }: { children: React.ReactNode; logo?: string }) {
  // Malayalam text keeps normal letter spacing (wide tracking breaks its letter joins)
  const malayalam = typeof children === 'string' && /[ഀ-ൿ]/.test(children);
  return (
    <div className={`flex items-center gap-2 eyebrow ${malayalam ? '!tracking-normal' : ''}`}>
      {logo && <SectionLogo src={logo} />}
      <span className="brand-rule-start w-7" />
      {/* A long Malayalam label may wrap on phones: keep its lines close together */}
      <span className={`text-brand-gradient ${malayalam ? 'min-w-0 leading-snug' : ''}`}>{children}</span>
      <span className="brand-rule-end w-7" />
    </div>
  );
}

/** How long the pointer must rest on the president's message before it floats open */
const HOVER_OPEN_MS = 150;

/* President's message (left) beside the event posters (right), as one card; stacked on
   narrower screens. Either part is left out when it has nothing to show. */
function PresidentAndEvents({ message, events }: { message: PresidentMessage | null; events: OrgEvent[] }) {
  const { lang, section, h } = useSite();
  // How the full message is showing: floating while the pointer is over it, or pinned (modal)
  const [popup, setPopup] = useState<PresidentPopupMode | null>(null);
  const [hovered, setHovered] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // After a close, a pointer still resting on the message must not reopen it: hovering is
  // off until the pointer has been somewhere else
  const armed = useRef(true);
  const rearm = useRef<((e: PointerEvent) => void) | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const isOpen = popup !== null;

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      if (rearm.current) document.removeEventListener('pointermove', rearm.current);
    },
    []
  );

  // While the popup is up it covers the message, so remember where the pointer is
  useEffect(() => {
    if (!isOpen) return;
    const track = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('pointermove', track, { passive: true });
    return () => document.removeEventListener('pointermove', track);
  }, [isOpen]);

  const overTrigger = (x: number, y: number) => {
    const r = triggerRef.current?.getBoundingClientRect();
    return Boolean(r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  };

  // Touch has no hover: a tap pins the popup instead (see the button's onClick)
  const hoverIn = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    pointer.current = { x: e.clientX, y: e.clientY };
    setHovered(true);
    if (popup !== null || !armed.current) return;
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setPopup((p) => p ?? 'hover'), HOVER_OPEN_MS);
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    setHovered(false);
    window.clearTimeout(openTimer.current);
  };
  const pin = () => {
    window.clearTimeout(openTimer.current);
    setPopup('pinned');
  };
  const closePopup = () => {
    window.clearTimeout(openTimer.current);
    setPopup(null);
    if (rearm.current) document.removeEventListener('pointermove', rearm.current);
    rearm.current = null;
    const p = pointer.current;
    // Pointer elsewhere (it left, so the popup closed): hovering stays live
    armed.current = !(p && overTrigger(p.x, p.y));
    if (armed.current) return;
    const onMove = (e: PointerEvent) => {
      if (overTrigger(e.clientX, e.clientY)) return;
      armed.current = true;
      document.removeEventListener('pointermove', onMove);
      rearm.current = null;
    };
    rearm.current = onMove;
    document.addEventListener('pointermove', onMove);
  };
  const president = section('homePresident', { label: h('presidentMessage') });
  const label = president.label;
  const heading = message ? t(message.heading, 'en') || label : '';
  const body = message ? t(message.message, lang) : '';
  const name = message ? t(message.name, lang) : '';
  const designation = message ? t(message.designation, lang) : '';

  if (!message && events.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-magenta-100/80 bg-gradient-to-br from-white via-magenta-50/50 to-plum-50 shadow-card sm:rounded-3xl">
      <span className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-magenta-100/60 blur-3xl" />
      <div className={`relative grid ${message && events.length > 0 ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]' : ''}`}>
        {message && (
          <div className="relative min-w-0 p-3.5 sm:p-6 md:p-8">
            <Eyebrow logo={president.logo}>{label}</Eyebrow>
            <div className="relative mt-2 grid gap-3 sm:mt-3 sm:gap-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start">
              <figure className="relative mx-auto sm:order-last sm:mx-0">
                {message.photo ? (
                  <img
                    src={message.photo}
                    alt={name}
                    className="h-[120px] w-[100px] rounded-t-[3.5rem] rounded-b-xl border-[3px] border-white object-cover shadow-lift sm:h-[180px] sm:w-[150px] sm:rounded-t-[4.5rem] sm:rounded-b-2xl sm:border-4"
                  />
                ) : (
                  <div className="grid h-[120px] w-[100px] place-items-center rounded-t-[3.5rem] rounded-b-xl border-[3px] border-white bg-plum-100 text-plum-300 shadow-lift sm:h-[180px] sm:w-[150px] sm:rounded-t-[4.5rem] sm:rounded-b-2xl sm:border-4">
                    <Users size={36} />
                  </div>
                )}
                {name && (
                  <figcaption className="mt-1.5 text-center sm:mt-2.5">
                    <span className="block font-display text-[13px] font-semibold text-plum-800 sm:text-[14px]"><GradientText>{name}</GradientText></span>
                    {designation && <span className="block text-[11px] text-ink-muted sm:text-[11.5px]">{designation}</span>}
                  </figcaption>
                )}
              </figure>

              <div className="relative min-w-0">
                <span className="pointer-events-none absolute -start-1 -top-2 font-display text-[2.4rem] leading-none text-magenta-200 sm:-top-3 sm:text-[3.2rem]">
                  &ldquo;
                </span>
                {heading !== label && (
                  <h2 className="responsive-copy relative ps-6 font-display text-[1rem] font-semibold leading-snug text-magenta-500 sm:ps-7 sm:text-[1.2rem] md:text-[1.35rem]">
                    <GradientText>{heading}</GradientText>
                  </h2>
                )}
                {body && <MessagePreview html={body} />}
              </div>

              {/* Stretched over the portrait and text: the pointer resting on the block floats the
                  full message; a tap, click or Enter pins it open */}
              {body && (
                <button
                  ref={triggerRef}
                  type="button"
                  onPointerEnter={hoverIn}
                  onPointerLeave={hoverOut}
                  onClick={pin}
                  aria-haspopup="dialog"
                  aria-label={`${h('readMore')}: ${label}`}
                  className="absolute -inset-2 z-10 cursor-pointer rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500 [@media(hover:hover)]:hover:bg-white/30"
                />
              )}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div
            className={`relative min-w-0 p-3.5 sm:p-6 md:p-8 ${
              message ? 'border-t border-magenta-100/80 lg:border-s lg:border-t-0' : ''
            }`}
          >
            <EventPosters events={events} beside={Boolean(message)} />
          </div>
        )}
      </div>

      {popup && message && body && (
        <PresidentMessageModal
          mode={popup}
          triggerHovered={hovered}
          label={label}
          heading={heading}
          body={body}
          name={name}
          designation={designation}
          photo={message.photo}
          onPin={pin}
          onClose={closePopup}
        />
      )}
    </div>
  );
}

/* The message as a short preview: capped in height, fading out only when it is cut off.
   The whole message opens in PresidentMessageModal. */
function MessagePreview({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    // Web fonts change the line count once they load
    document.fonts?.ready.then(measure);
    return () => observer?.disconnect();
  }, [html]);

  return (
    <div
      ref={ref}
      className={`prose-content relative mt-1.5 max-h-[9rem] overflow-hidden ps-6 text-[12.5px] leading-[1.7] sm:mt-2 sm:max-h-[12.5rem] sm:ps-7 sm:text-[14px] sm:leading-[1.85] ${
        cut ? '[mask-image:linear-gradient(to_bottom,black_75%,transparent)]' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* The events heading as first shipped and stored in the admin-managed content. The home
   page shows "Events" in its place; any other wording an editor sets is shown as written. */
const SHIPPED_EVENTS_HEADINGS = new Set(['Upcoming Events', 'വരാനിരിക്കുന്ന പരിപാടികൾ']);

/* Event posters (Event Poster in the admin), each shown whole in a 3:4 frame with its
   title and date beneath. Two across on phones, three from sm, four from md; beside the
   president's message (lg and up) the column is narrow, so two across. When there are
   more than fit the row scrolls sideways (swipe, trackpad or the arrows). */
function EventPosters({ events, beside }: { events: OrgEvent[]; beside: boolean }) {
  const { lang, path, s, h, section } = useSite();
  const heading = section('homeEvents', { heading: h('events') });
  const title = SHIPPED_EVENTS_HEADINGS.has(heading.heading) ? h('events') : heading.heading;
  const railRef = useRef<HTMLUListElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  // Arrows only appear when the posters do not all fit in the row
  useEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (rail) setOverflowing(rail.scrollWidth > rail.clientWidth + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [events.length]);

  const slide = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Eyebrow logo={heading.logo}>{title}</Eyebrow>
        <div className="flex shrink-0 items-center gap-3">
          {overflowing && <RailArrows onPrev={() => slide(-1)} onNext={() => slide(1)} />}
          <Link
            to={path('/events')}
            className="-my-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-2 text-[10.5px] font-medium text-ink-muted transition hover:text-magenta-600 sm:text-[11px]"
          >
            {s('viewAll')}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* auto margins on the first and last poster centre a short row, and collapse to
          nothing once the row overflows, so scrolling still reaches every poster */}
      <ul
        ref={railRef}
        className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 sm:mt-4 sm:gap-4 [&>li:first-child]:ms-auto [&>li:last-child]:me-auto"
      >
        {events.map((event) => {
          const src = event.posterImage || event.coverImage;
          const name = t(event.title, lang);
          const when = [formatDate(event.startDate, lang), event.timeLabel].filter(Boolean).join(' · ');
          return (
            <li
              key={event._id}
              /* two across on phones (the next poster peeks in), three from sm, four from md */
              className={`w-[calc((100%-0.75rem)/2.15)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] ${
                beside ? 'lg:w-[calc((100%-1rem)/2)]' : ''
              }`}
            >
              <Link to={path(`/events/${event.slug}`)} className="group flex flex-col">
                {/* object-contain: posters are shown whole, never cropped or stretched */}
                <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-plum-100/80 bg-white shadow-soft">
                  <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </span>
                <span className="mt-2 block text-center sm:mt-2.5">
                  <span className="line-clamp-2 block font-display text-[12.5px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:text-[14.5px]">
                    <GradientText>{name}</GradientText>
                  </span>
                  {when && (
                    <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted sm:mt-1 sm:text-[12.5px]">
                      <CalendarDays size={12} className="shrink-0 text-magenta-500" />
                      {when}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ──────────────── news · events · featured video band ──────────────── */

function BandHeading({
  sectionKey,
  label,
  actionLabel,
  to,
  shipped = [],
}: {
  sectionKey: string;
  label: string;
  actionLabel: string;
  to: string;
  /** Headings as first shipped; when the stored heading is one of these, `label` is shown instead */
  shipped?: string[];
}) {
  const { section } = useSite();
  const stored = section(sectionKey, { heading: label });
  const heading = { ...stored, heading: shipped.includes(stored.heading) ? label : stored.heading };
  return (
    <div className="mb-2.5 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:mb-3.5 sm:gap-y-1.5">
      <h3 className="band-label flex shrink-0 items-center gap-2 whitespace-nowrap font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-magenta-500 sm:text-[14px] sm:tracking-[0.12em] md:text-[15px]">
        {heading.logo && <SectionLogo src={heading.logo} />}
        <span className="brand-rule-start w-5 sm:w-7" />
        <span className="text-brand-gradient">{heading.heading}</span>
        <span className="brand-rule-end w-5 sm:w-7" />
      </h3>
      <Link
        to={to}
        className="-my-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-2 text-[10.5px] font-medium text-ink-muted transition hover:text-magenta-600 sm:text-[11px]"
      >
        {actionLabel}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function RailArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const { s } = useSite();
  const cls =
    'grid h-7 w-7 place-items-center rounded-full border border-plum-100 bg-white text-plum-800 shadow-soft transition hover:border-magenta-200 hover:text-magenta-600';
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onPrev} aria-label={s('previous')} className={cls}>
        <ChevronLeft size={14} />
      </button>
      <button type="button" onClick={onNext} aria-label={s('next')} className={cls}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* Home carousels (Videos): cards in view on desktop, the
   repeated cards that make the loop seamless, and time per step in ms. */
const CAROUSEL_PER_VIEW = 3;
const CAROUSEL_INTERVAL = 4500;

/* Stagger for cards popping up as a carousel first scrolls into view (static class
   names so Tailwind generates them) */
const POP_DELAYS = ['[animation-delay:0ms]', '[animation-delay:110ms]', '[animation-delay:220ms]', '[animation-delay:330ms]', '[animation-delay:440ms]'];

/** What a carousel card needs: its sizing classes, and whether it is a loop copy. */
type CarouselSlot = { className: string; clone: boolean };

/**
 * A row of cards that loops seamlessly (the first cards are repeated after the last,
 * and the row snaps back to the start once they are in view). With `autoPlay` it also
 * slides one card along every few seconds; hover pauses that, and
 * prefers-reduced-motion turns it off. From sm it shows `tabletPerView` cards, from
 * lg three; phones keep a native swipe row, and a swipe on tablets moves the row.
 */
function AutoCarousel<T>({
  items,
  getKey,
  renderItem,
  label,
  phoneWidth,
  tabletPerView = 3,
  autoPlay = true,
  className = '',
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, slot: CarouselSlot) => React.ReactNode;
  label: string;
  /** Card width on phones, e.g. `w-[72%]` */
  phoneWidth: string;
  tabletPerView?: 2 | 3;
  /** Slide on its own; when false the row only moves with the arrows, dots or a swipe */
  autoPlay?: boolean;
  className?: string;
}) {
  const count = items.length;
  const canSlide = count > CAROUSEL_PER_VIEW;
  const slides = canSlide ? [...items, ...items.slice(0, CAROUSEL_PER_VIEW)] : items;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState(false);
  /* Set by "previous" at the first card: jump to the repeated set, then step back. */
  const stepBackRef = useRef(false);
  const touchXRef = useRef<number | null>(null);
  /* Cards pop up (fade + rise + slight overshoot) one after another on first view */
  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const next = () => {
    setAnimate(true);
    setIndex((i) => Math.min(i + 1, count));
  };
  const prev = () => {
    if (index === 0) {
      stepBackRef.current = true;
      setAnimate(false);
      setIndex(count);
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  };

  // Auto-advance; the timer restarts on every move so each set gets its full time
  useEffect(() => {
    if (!autoPlay || !canSlide || hovered) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(next, CAROUSEL_INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, hovered, canSlide, autoPlay]);

  // After an instant (unanimated) jump, turn the transition back on next frame
  useEffect(() => {
    if (animate) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setAnimate(true);
        if (stepBackRef.current) {
          stepBackRef.current = false;
          setIndex(count - 1);
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [animate, count]);

  // Cards per view as a CSS variable; a row that cannot slide shows all its cards,
  // so two cards share the row half and half
  const perView = canSlide
    ? tabletPerView === 2
      ? 'sm:[--per:2] lg:[--per:3]'
      : ''
    : count === 2
      ? 'sm:[--per:2]'
      : '';
  const slotClass = `${phoneWidth} shrink-0 snap-start sm:w-[calc((100%_-_(var(--per)_-_1)_*_1rem)_/_var(--per))]`;

  return (
    <div
      ref={rootRef}
      className={`flex min-w-0 flex-col ${className}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      onTouchStart={(e) => (touchXRef.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        // Swipe on tablets (the sliding row); phones scroll the row natively instead
        const start = touchXRef.current;
        touchXRef.current = null;
        if (start === null || !canSlide || window.innerWidth < 640) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      }}
    >
      {/* sm+: the viewport clips the row, which is shifted by whole cards
          (one card + gap = (row width + gap) / cards per view) */}
      <div className="sm:-my-2 sm:overflow-hidden sm:py-2 lg:flex lg:flex-1 lg:flex-col">
        <div
          className={`no-scrollbar -mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-1 [--per:3] sm:mx-0 sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:[transform:translate3d(calc(var(--slide)_*_-1_*_(100%_+_1rem)_/_var(--per)),0,0)] lg:flex-1 ${perView} ${
            animate ? 'sm:transition-transform sm:duration-700 sm:ease-[cubic-bezier(0.22,1,0.36,1)]' : ''
          }`}
          style={{ '--slide': index } as React.CSSProperties}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget || index < count) return;
            // The repeated first set is in view: snap back to the real one, unanimated
            setAnimate(false);
            setIndex(0);
          }}
        >
          {slides.map((item, i) => {
            const clone = i >= count;
            return (
              <Fragment key={`${getKey(item)}-${i}`}>
                {renderItem(item, {
                  clone,
                  className: `${slotClass} ${clone ? 'max-sm:hidden' : ''} ${
                    shown ? `animate-pop-up ${POP_DELAYS[Math.min(i, POP_DELAYS.length - 1)]}` : 'opacity-0'
                  }`,
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {canSlide && (
        <div className="mt-3 hidden items-center justify-between gap-3 sm:flex">
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => {
                  setAnimate(true);
                  setIndex(i);
                }}
                aria-label={`${label} ${i + 1} of ${count}`}
                aria-current={index % count === i}
                className="grid h-5 place-items-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    index % count === i ? 'w-5 bg-magenta-500' : 'w-1.5 bg-plum-200 hover:bg-plum-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <RailArrows onPrev={prev} onNext={next} />
        </div>
      )}
    </div>
  );
}

/* News shows at most this many posts, newest first. */
const NEWS_COUNT = 4;

/**
 * News: the most recent posts as cards — a swipe row on phones, two across on
 * tablets, one row of up to four on desktop.
 */
function NewsBand({ posts }: { posts: MediaPost[] }) {
  const { lang, path, s, h } = useSite();
  const time = (post: MediaPost) => new Date(post.publishedAt).getTime() || 0;
  const latest = [...posts].sort((a, b) => time(b) - time(a)).slice(0, NEWS_COUNT);
  const desktopCols = latest.length >= 4 ? 'lg:grid-cols-4' : latest.length === 3 ? 'lg:grid-cols-3' : '';

  return (
    <div>
      <BandHeading
        sectionKey="homeNews"
        label={h('news')}
        shipped={['Latest News', 'പുതിയ വാർത്തകൾ']}
        actionLabel={s('viewAllNews')}
        to={path('/media/news')}
      />
      {latest.length === 0 ? (
        <p className="py-5 text-center text-[12.5px] text-ink-faint sm:py-8 sm:text-[13px]">{s('nothingHere')}</p>
      ) : (
        <div
          className={`no-scrollbar -mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 ${desktopCols}`}
        >
          {latest.map((post, i) => (
            <Reveal key={post._id} delay={Math.min(i, 4) * 80} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <Link
                to={path(`/media/${post.type}/${post.slug}`)}
                className="card-hover group flex h-full flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft"
              >
                <span className="block aspect-[16/9] overflow-hidden bg-magenta-50 sm:aspect-[16/10]">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex flex-1 flex-col p-2.5 sm:p-3">
                  <span className="flex items-center gap-1.5 text-[10.5px] text-ink-faint sm:text-[11px]">
                    <CalendarDays size={12} />
                    {formatDate(post.publishedAt, lang)}
                  </span>
                  <span className="mt-1 line-clamp-3 font-display text-[13px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:mt-1.5 sm:text-[15px]">
                    <GradientText>{t(post.title, lang)}</GradientText>
                  </span>
                  {t(post.excerpt, lang) && (
                    <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-muted sm:mt-1 sm:text-[12.5px]">
                      {t(post.excerpt, lang)}
                    </span>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[11px] font-medium text-magenta-600 sm:pt-2.5 sm:text-[12px]">
                    {h('readMore')}
                    <ArrowRight size={13} />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoRow({ videos, onPlay }: { videos: VideoItem[]; onPlay: (v: VideoItem) => void }) {
  const { lang, path, s, h } = useSite();
  /** `inCard`: flush top of a card, so the card supplies the corners and shadow */
  const thumb = (v: VideoItem, big = false, inCard = false) => (
    <span className={`relative block aspect-video overflow-hidden bg-plum-900 ${inCard ? '' : 'rounded-xl shadow-soft'}`}>
      {(v.thumbnailUrl || youtubeThumb(v.youtubeUrl)) && (
        <img
          src={v.thumbnailUrl || youtubeThumb(v.youtubeUrl)}
          alt=""
          loading="lazy"
          /* A broken custom thumbnail falls back to YouTube's own, then to the plain panel */
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = youtubeThumb(v.youtubeUrl);
            if (fallback && img.src !== fallback) img.src = fallback;
            else img.style.display = 'none';
          }}
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 z-10 grid place-items-center">
        <span
          className={`grid place-items-center rounded-full bg-white/95 text-magenta-500 shadow-lift transition group-hover:scale-110 ${
            big ? 'h-9 w-9 sm:h-12 sm:w-12' : 'h-8 w-8 sm:h-10 sm:w-10'
          }`}
        >
          <Play size={big ? 19 : 16} className="ms-0.5" fill="currentColor" />
        </span>
      </span>
      {v.durationLabel && (
        <span className="absolute bottom-1.5 end-1.5 z-10 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-white sm:bottom-2 sm:end-2 sm:text-[11px]">
          {v.durationLabel}
        </span>
      )}
    </span>
  );

  return (
    <div>
      <BandHeading
        sectionKey="homeVideos"
        label={h('videos')}
        actionLabel={s('viewMoreVideos')}
        to={path('/media/videos')}
      />
      {videos.length > 1 ? (
        /* The latest videos as large cards in one row (they slide along if more are
           ever loaded); about one card at a time in a swipe row on phones. */
        <AutoCarousel
          items={videos}
          getKey={(v) => v._id}
          label="Video"
          phoneWidth="w-[80%]"
          tabletPerView={2}
          renderItem={(v, { className, clone }) => (
            <button
              type="button"
              onClick={() => onPlay(v)}
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
              className={`card-hover group flex flex-col overflow-hidden rounded-xl border border-plum-100 bg-white text-start shadow-soft ${className}`}
            >
              {thumb(v, true, true)}
              <span className="flex flex-1 flex-col p-3 sm:p-4">
                <span className="line-clamp-2 block font-display text-[13px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:text-[15px] md:text-[16px]">
                  <GradientText>{t(v.title, lang)}</GradientText>
                </span>
                {t(v.description, lang) && (
                  <span className="mt-1 line-clamp-2 block text-[11.5px] leading-relaxed text-ink-muted sm:mt-1.5 sm:text-[13px]">
                    {t(v.description, lang)}
                  </span>
                )}
                <span className="mt-auto flex items-center justify-between gap-2 pt-2 sm:pt-3">
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-magenta-600 sm:text-[12.5px]">
                    {s('watchVideo')}
                    <ArrowRight size={13} />
                  </span>
                  {v.publishedAt && (
                    <span className="flex items-center gap-1 text-[10.5px] text-ink-faint sm:text-[11.5px]">
                      <CalendarDays size={11} />
                      {formatDate(v.publishedAt, lang)}
                    </span>
                  )}
                </span>
              </span>
            </button>
          )}
        />
      ) : (
        <button
          onClick={() => onPlay(videos[0])}
          className="group grid w-full items-center gap-3 text-start sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-4 md:gap-6"
        >
          {thumb(videos[0], true)}
          <span className="min-w-0">
            <span className="block font-display text-[14px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 sm:text-[16px] md:text-[18px]">
              <GradientText>{t(videos[0].title, lang)}</GradientText>
            </span>
            {t(videos[0].description, lang) && (
              <span className="mt-1 line-clamp-3 block text-[12px] leading-relaxed text-ink-muted sm:mt-1.5 sm:text-[13.5px]">
                {t(videos[0].description, lang)}
              </span>
            )}
            {videos[0].publishedAt && (
              <span className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
                <CalendarDays size={12} />
                {formatDate(videos[0].publishedAt, lang)}
              </span>
            )}
          </span>
        </button>
      )}
    </div>
  );
}

/* ───────────────────────────── photo gallery ───────────────────────────── */

/* Drift speed of the photo strip (px per second), and the fewest tiles one copy of
   the loop may hold so a single copy is wider than the strip. */
const PHOTO_SPEED = 30;
const PHOTO_MIN_TILES = 8;

/**
 * Latest photos as a slowly drifting strip (same drag/swipe/pause behaviour as the
 * programme logo strip). Tiles pop in one after another when the section first
 * scrolls into view; hover zooms gently; a tap or click opens the shared lightbox,
 * which shows the whole photo.
 */
function PhotoGallery({ photos }: { photos: MediaItem[] }) {
  const { lang, path, s, h } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const repeat = Math.ceil(PHOTO_MIN_TILES / photos.length);
  const loop = Array.from({ length: repeat }, () => photos).flat();
  const { viewportRef, trackRef, nudge, viewportProps } = useDriftStrip<HTMLDivElement, HTMLUListElement>(
    PHOTO_SPEED,
    photos.length
  );

  // Entrance: reveal the tiles once the strip scrolls into view
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportRef]);

  return (
    <div>
      <BandHeading sectionKey="homePhotos" label={h('photoGallery')} actionLabel={s('viewAll')} to={path('/media/gallery')} />
      {/* The strip is as wide as the other sections; the arrows float over the photos
          instead of taking space beside them */}
      <div className="relative">
        <span className="absolute start-1.5 top-1/2 z-10 -translate-y-1/2 sm:start-2 md:start-4">
          <MarqueeArrow dir={-1} onClick={() => nudge(-1)} />
        </span>
        <div
          ref={viewportRef}
          // Photos run cleanly to the strip's edges (no edge fade)
          className="w-full cursor-grab touch-pan-y select-none overflow-hidden py-1"
          {...viewportProps}
        >
          <ul ref={trackRef} className="flex w-max will-change-transform">
            {[0, 1].map((copy) =>
              loop.map((photo, i) => {
                const hidden = copy === 1 || i >= photos.length;
                const index = i % photos.length;
                const caption = t(photo.caption, lang);
                const order = copy * loop.length + i;
                return (
                  <li key={`${copy}-${i}`} className="shrink-0 pe-2 sm:pe-3 md:pe-4" aria-hidden={hidden || undefined}>
                    <button
                      type="button"
                      onClick={() => setOpen(index)}
                      tabIndex={hidden ? -1 : undefined}
                      draggable={false}
                      aria-label={caption || `${h('photoGallery')} ${index + 1}`}
                      /* 3:2 like event photos; pops in (fade + slight scale) on first view */
                      className={`group relative block aspect-[3/2] h-28 overflow-hidden rounded-lg bg-plum-50 shadow-soft transition duration-700 ease-out motion-reduce:transition-none sm:h-52 sm:rounded-xl lg:h-60 ${
                        shown ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-0'
                      }`}
                      style={{ transitionDelay: shown ? `${Math.min(order, 8) * 80}ms` : undefined }}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-plum-900/70 via-plum-900/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <span className="absolute end-2.5 top-2.5 grid h-8 w-8 scale-75 place-items-center rounded-full bg-white/90 text-magenta-600 opacity-0 shadow-soft transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                        <Maximize2 size={14} />
                      </span>
                      {caption && (
                        <span className="user-text absolute inset-x-3 bottom-2.5 translate-y-2 text-start text-[12.5px] font-medium leading-snug text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {caption}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <span className="absolute end-1.5 top-1/2 z-10 -translate-y-1/2 sm:end-2 md:end-4">
          <MarqueeArrow dir={1} onClick={() => nudge(1)} />
        </span>
      </div>
      {open !== null && <Lightbox items={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </div>
  );
}
