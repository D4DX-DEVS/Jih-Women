import { useEffect, useRef, useState } from 'react';
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
import { formatDate, youtubeThumb } from '../lib/format';
import {
  Container,
  ErrorState,
  GradientText,
  ManagedSectionHeading,
  Section,
  SECTION_Y,
  SectionLogo,
} from '../components/Primitives';
import { HomeSkeleton } from '../components/PageSkeletons';
import {
  CampaignCard,
  Lightbox,
  PosterLightbox,
  PostCard,
  PublicationCard,
  VideoPlayerModal,
} from '../components/Cards';
import PresidentMessageModal from '../components/PresidentMessageModal';
import FocusStrip from '../components/FocusStrip';
import Reveal from '../components/Reveal';
import { useViewMode } from '../lib/view';
import type {
  HomePayload,
  MediaItem,
  MediaPost,
  OrgEvent,
  ProgramBanner,
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
  // The strip is logos only: a programme's poster is shown on its own page, never here
  const showPrograms = sections.programBanners !== false && banners.length > 0;
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

      {showPrograms && <ProgramBanners banners={banners} />}

      <section className={`bg-mist ${SECTION_Y}`}>
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

      <section className={`bg-white ${SECTION_Y}`}>
        <Container>
          <Reveal>
            <NewsBand posts={data.updates} />
          </Reveal>
        </Container>
      </section>

      {data.featuredVideos.length > 0 && (
        <section className={`border-t border-plum-100/70 bg-white ${SECTION_Y}`}>
          <Container>
            <Reveal>
              <VideoRow videos={data.featuredVideos} onPlay={setPlaying} />
            </Reveal>
          </Container>
        </section>
      )}

      {(data.galleryPhotos?.length ?? 0) > 0 && (
        <section className={`border-t border-plum-100/70 bg-white ${SECTION_Y}`}>
          <Container>
            <PhotoGallery photos={data.galleryPhotos!} />
          </Container>
        </section>
      )}

      {sections.campaigns && data.campaigns.length > 0 && (
        <Section tone="white">
          <Container>
            <ManagedSectionHeading sectionKey="homeCampaigns" eyebrow={h('mediaCentre')} title={h('campaigns')} />
            <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
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
            <div className={`grid gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 ${view === 'list' ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
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
   single copy is wider than the widest strip (1200px container ÷ ~212px per logo),
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

function ProgramBanners({ banners }: { banners: ProgramBanner[] }) {
  const { path, section, h } = useSite();
  const heading = section('homePrograms', { heading: h('highlights') });
  const title = SHIPPED_STRIP_HEADINGS.has(heading.heading) ? h('highlights') : heading.heading;
  const repeat = Math.ceil(MARQUEE_MIN_TILES / Math.max(1, banners.length));
  const loop = Array.from({ length: repeat }, () => banners).flat();

  const { viewportRef, trackRef, nudge, viewportProps } = useDriftStrip<HTMLDivElement, HTMLUListElement>(
    MARQUEE_SPEED,
    banners.length
  );

  /** One programme logo; `hidden` marks a repeated copy (not focusable or announced). */
  const renderTile = (banner: ProgramBanner, hidden = false) => {
    // A bare logo, no tile: fixed box, image contained so nothing is cropped or stretched.
    // Phones show two across the strip (half its width each, less the padding).
    const cls =
      'group flex h-12 w-[calc(50cqw-1rem)] items-center justify-center rounded-lg sm:h-16 sm:w-[160px] lg:h-[72px] lg:w-[180px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta-400';
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
    // Always the programme page: its website (if any) is linked below the content there
    return (
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
        <div className="flex items-center gap-1.5 md:gap-3">
          <MarqueeArrow dir={-1} onClick={() => nudge(-1)} />
          <div
            ref={viewportRef}
            // Edges fade out so logos glide in and out instead of being sliced off. A size
            // container, so phone tiles can each take half of its width.
            className="min-w-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden [container-type:inline-size] [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
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
      </Container>
    </section>
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

/* President's message (left) beside the event poster (right), as one card; stacked on
   narrower screens. Either part is left out when it has nothing to show. A click (or
   Enter) anywhere on the message, photo included, opens the whole message in a popup. */
function PresidentAndEvents({ message, events }: { message: PresidentMessage | null; events: OrgEvent[] }) {
  const { lang, section, h } = useSite();
  const [open, setOpen] = useState(false);
  const president =section('homePresident', { label: h('presidentMessage') });
  const label = president.label;
  const heading = message ? t(message.heading, 'en') || label : '';
  const body = message ? t(message.message, lang) : '';
  const name = message ? t(message.name, lang) : '';
  const designation = message ? t(message.designation, lang) : '';

  if (!message && events.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-magenta-100/80 bg-gradient-to-br from-white via-magenta-50/50 to-plum-50 shadow-card sm:rounded-3xl">
      <span className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-magenta-100/60 blur-3xl" />
      {/* Desktop: the message takes the larger part of the card (about 70% on wide screens) */}
      <div className={`relative grid ${message && events.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]' : ''}`}>
        {message && (
          <div className="relative min-w-0 p-3.5 sm:p-6 md:p-8 xl:p-10">
            <Eyebrow logo={president.logo}>{label}</Eyebrow>
            {/* The negative margin and matching padding give the hover tint some room
                without moving anything. A link inside the message still works as a link. */}
            <div
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`${label}: ${h('readMore')}`}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('a')) setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                e.preventDefault();
                setOpen(true);
              }}
              className="relative -mx-2 -mb-2 grid cursor-pointer gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-400 sm:-mx-3 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start sm:gap-6 sm:px-3 lg:mt-4 xl:grid-cols-[minmax(0,1fr)_170px] xl:gap-10"
            >
              <figure className="relative mx-auto sm:order-last sm:mx-0">
                {message.photo ? (
                  <img
                    src={message.photo}
                    alt={name}
                    className="h-[120px] w-[100px] rounded-t-[3.5rem] rounded-b-xl border-[3px] border-white object-cover shadow-lift sm:h-[180px] sm:w-[150px] sm:rounded-t-[4.5rem] sm:rounded-b-2xl sm:border-4 xl:h-[204px] xl:w-[170px] xl:rounded-t-[5rem]"
                  />
                ) : (
                  <div className="grid h-[120px] w-[100px] place-items-center rounded-t-[3.5rem] rounded-b-xl border-[3px] border-white bg-plum-100 text-plum-300 shadow-lift sm:h-[180px] sm:w-[150px] sm:rounded-t-[4.5rem] sm:rounded-b-2xl sm:border-4 xl:h-[204px] xl:w-[170px] xl:rounded-t-[5rem]">
                    <Users size={36} />
                  </div>
                )}
                {name && (
                  <figcaption className="mt-1.5 text-center sm:mt-3">
                    <span className="block type-title-lg text-plum-800"><GradientText>{name}</GradientText></span>
                    {designation && <span className="mt-0.5 block type-caption text-ink-muted">{designation}</span>}
                  </figcaption>
                )}
              </figure>

              <div className="relative min-w-0">
                <span className="pointer-events-none absolute -start-1 -top-2 font-display text-[2.4rem] leading-none text-magenta-200 sm:-top-3 sm:text-[3.2rem] lg:-start-2 lg:-top-4 lg:text-[4.25rem]">
                  &ldquo;
                </span>
                {heading !== label && (
                  <h2 className="responsive-copy relative ps-6 type-heading-sm text-magenta-500 sm:ps-7 lg:ps-10">
                    <GradientText>{heading}</GradientText>
                  </h2>
                )}
                {body && <MessagePreview html={body} />}
              </div>
            </div>
            {open && (
              <PresidentMessageModal
                mode="pinned"
                triggerHovered={false}
                label={label}
                heading={heading}
                body={body}
                name={name}
                designation={designation}
                photo={message.photo}
                onPin={() => {}}
                onClose={() => setOpen(false)}
              />
            )}
          </div>
        )}

        {events.length > 0 && (
          <div
            className={`relative min-w-0 p-3.5 sm:p-6 md:p-8 lg:px-7 xl:px-8 ${
              message ? 'border-t border-magenta-100/80 lg:border-s lg:border-t-0' : ''
            }`}
          >
            <EventPosters events={events} />
          </div>
        )}
      </div>
    </div>
  );
}

/* The message as a short preview: capped in height, fading out only when it is cut off.
   The whole message opens in a popup (see PresidentAndEvents). */
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
      className={`prose-content type-body-lg relative mt-1.5 max-h-[9.5rem] overflow-hidden ps-6 leading-[1.7] sm:mt-2 sm:max-h-[14rem] sm:ps-7 sm:leading-[1.85] lg:max-h-[17.5rem] lg:ps-10 ${
        cut ? '[mask-image:linear-gradient(to_bottom,black_80%,transparent)]' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* The events heading as first shipped and stored in the admin-managed content. The home
   page shows "Events" in its place; any other wording an editor sets is shown as written. */
const SHIPPED_EVENTS_HEADINGS = new Set(['Upcoming Events', 'വരാനിരിക്കുന്ന പരിപാടികൾ']);

/* Event posters (Event Poster in the admin), one at a time: the poster is shown whole in
   a 3:4 frame with nothing beneath it, and a click opens it full size in the lightbox
   (never another page, even when the poster has its own link). The backend sends
   upcoming events first (soonest first) and then the most recent past ones, so the first
   poster is the next event; the posters advance on their own every few seconds
   (looping), and the arrows on either side of the poster or a swipe step through them
   too. A mouse over the column, keyboard focus inside it or an open lightbox pauses the
   rotation, and prefers-reduced-motion turns it off. */
const EVENT_POSTER_INTERVAL = 4500;

function EventPosters({ events }: { events: OrgEvent[] }) {
  const { lang, path, s, h, section } = useSite();
  const heading = section('homeEvents', { heading: h('events') });
  const title = SHIPPED_EVENTS_HEADINGS.has(heading.heading) ? h('events') : heading.heading;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [zoomed, setZoomed] = useState<OrgEvent | null>(null);
  const touchXRef = useRef<number | null>(null);
  const count = events.length;
  // A reloaded list may be shorter than the poster last shown
  const current = Math.min(index, count - 1);
  const event = events[current];
  const name = t(event.title, lang);

  const step = (dir: 1 | -1) => setIndex((current + dir + count) % count);

  // Auto-advance; the timer restarts on every move, so a poster stepped to by hand gets its full time
  useEffect(() => {
    if (count < 2 || hovered || focused || zoomed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setIndex((i) => (Math.min(i, count - 1) + 1) % count), EVENT_POSTER_INTERVAL);
    return () => window.clearTimeout(id);
  }, [current, count, hovered, focused, zoomed]);

  // Fetch the next poster ahead of time so it fades in whole rather than loading in view
  useEffect(() => {
    if (count < 2) return;
    const next = events[(current + 1) % count];
    new window.Image().src = next.posterImage || next.coverImage || '';
  }, [current, count, events]);

  return (
    <>
      <div
        className="flex min-w-0 flex-col"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
        onFocus={(e) => setFocused((e.target as HTMLElement).matches(':focus-visible'))}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
        onTouchStart={(e) => (touchXRef.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const start = touchXRef.current;
          touchXRef.current = null;
          if (start === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        {/* Wraps rather than clipping View All when a long heading meets a narrow column */}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Eyebrow logo={heading.logo}>{title}</Eyebrow>
          <Link
            to={path('/events')}
            className="-my-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-2 type-meta font-medium text-ink-muted transition hover:text-magenta-600"
          >
            {s('viewAll')}
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Phones: the poster fills the column width, less the room for the arrows to sit
            half over its edges; from sm up the column is wide (or beside the message), so
            the poster is capped and the arrows straddle its edges from outside */}
        <div
          className={`relative mx-auto mt-3 w-full sm:mt-4 sm:max-w-[250px] sm:px-0 lg:mt-6 lg:max-w-[270px] ${
            count > 1 ? 'px-[1.125rem]' : ''
          }`}
        >
          {/* key: the fade replays for each poster */}
          <button
            key={event._id}
            type="button"
            onClick={() => setZoomed(event)}
            aria-haspopup="dialog"
            aria-label={name || title}
            className="group block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta-400 motion-safe:animate-fade-in"
          >
            {/* object-contain: the poster is shown whole, never cropped or stretched */}
            <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-plum-100/80 bg-white shadow-soft">
              <img
                src={event.posterImage || event.coverImage}
                alt={name}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </span>
          </button>
          {count > 1 && (
            <>
              <span className="absolute left-0 top-1/2 z-10 -translate-y-1/2 sm:-translate-x-1/2">
                <PosterArrow dir={-1} onClick={() => step(-1)} />
              </span>
              <span className="absolute right-0 top-1/2 z-10 -translate-y-1/2 sm:translate-x-1/2">
                <PosterArrow dir={1} onClick={() => step(1)} />
              </span>
            </>
          )}
        </div>
      </div>
      {/* Outside the column: the lightbox's clicks and swipes must not reach the carousel */}
      {zoomed && <PosterLightbox event={zoomed} onClose={() => setZoomed(null)} />}
    </>
  );
}

/* A previous / next button on the edge of the event poster */
function PosterArrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  const { s } = useSite();
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={s(dir === 1 ? 'next' : 'previous')}
      className="grid h-9 w-9 place-items-center rounded-full border border-plum-100 bg-white/95 text-plum-800 shadow-soft backdrop-blur-sm transition hover:border-magenta-200 hover:text-magenta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500 active:scale-95"
    >
      <Icon size={18} />
    </button>
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
      <h3 className="band-label flex shrink-0 items-center gap-2 whitespace-nowrap font-sans type-eyebrow font-semibold uppercase tracking-[0.1em] text-magenta-500 sm:tracking-[0.12em]">
        {heading.logo && <SectionLogo src={heading.logo} />}
        <span className="brand-rule-start w-5 sm:w-7" />
        <span className="text-brand-gradient">{heading.heading}</span>
        <span className="brand-rule-end w-5 sm:w-7" />
      </h3>
      <Link
        to={to}
        className="-my-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-2 type-meta font-medium text-ink-muted transition hover:text-magenta-600"
      >
        {actionLabel}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

/* News shows at most this many posts, newest first. */
const NEWS_COUNT = 4;
/* Phones page through this many posts, two at a time. */
const NEWS_MOBILE_COUNT = 6;
const NEWS_PAGE_SIZE = 2;

/**
 * One news card. `compact` is the phone layout: two cards share the row, so the
 * image is taller and the excerpt is dropped to keep the pair aligned.
 */
function NewsCard({ post, compact = false }: { post: MediaPost; compact?: boolean }) {
  const { lang, path, h } = useSite();
  return (
    <Link
      to={path(`/media/${post.type}/${post.slug}`)}
      className="card-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft"
    >
      <span className={`block overflow-hidden bg-magenta-50 ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}>
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className={`flex flex-1 flex-col ${compact ? 'p-2' : 'p-3'}`}>
        <span className="flex items-center gap-1.5 type-meta text-ink-faint">
          <CalendarDays size={12} className="shrink-0" />
          <span className="truncate">{formatDate(post.publishedAt, lang)}</span>
        </span>
        <span
          className={`line-clamp-3 break-words type-title text-plum-800 transition group-hover:text-magenta-600 ${compact ? 'mt-1' : 'mt-1.5'}`}
        >
          <GradientText>{t(post.title, lang)}</GradientText>
        </span>
        {!compact && t(post.excerpt, lang) && (
          <span className="mt-1 line-clamp-2 type-caption leading-relaxed text-ink-muted">
            {t(post.excerpt, lang)}
          </span>
        )}
        <span
          className={`mt-auto inline-flex items-center gap-1 type-caption font-medium text-magenta-600 ${compact ? 'pt-1.5' : 'pt-2.5'}`}
        >
          {h('readMore')}
          <ArrowRight size={13} />
        </span>
      </span>
    </Link>
  );
}

/**
 * Phones only (hidden from sm): the items two at a time, side by side, with arrows
 * and page dots below to step through the rest. It moves only when an arrow is
 * pressed (no autoplay, no swipe row). The last page starts two from the end, so an
 * odd count never leaves an empty slot.
 */
function PhonePairs<T>({
  items,
  itemKey,
  render,
}: {
  items: T[];
  itemKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
}) {
  const { s } = useSite();
  const [page, setPage] = useState(0);
  const pages = Math.ceil(items.length / NEWS_PAGE_SIZE);
  // A reloaded list may be shorter than the page last shown
  const current = Math.min(page, Math.max(0, pages - 1));
  const start = Math.min(current * NEWS_PAGE_SIZE, Math.max(0, items.length - NEWS_PAGE_SIZE));
  const shown = items.slice(start, start + NEWS_PAGE_SIZE);
  const arrow =
    'grid h-9 w-9 place-items-center rounded-full border border-plum-100 bg-white text-plum-800 shadow-soft transition hover:border-magenta-200 hover:text-magenta-600 disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="sm:hidden">
      {/* key replays the fade on each page */}
      <div key={current} className="grid grid-cols-2 gap-2.5 motion-safe:animate-fade-in">
        {shown.map((item) => (
          <div key={itemKey(item)} className="min-w-0">
            {render(item)}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
            aria-label={s('previous')}
            className={arrow}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-magenta-500' : 'w-1.5 bg-plum-100'}`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current === pages - 1}
            aria-label={s('next')}
            className={arrow}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * News: the most recent posts as cards. Phones show two at a time (PhonePairs);
 * tablets show two across, desktop one row of up to four.
 */
function NewsBand({ posts }: { posts: MediaPost[] }) {
  const { path, s, h } = useSite();
  const time = (post: MediaPost) => new Date(post.publishedAt).getTime() || 0;
  const sorted = [...posts].sort((a, b) => time(b) - time(a));
  const latest = sorted.slice(0, NEWS_COUNT);
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
        <p className="py-5 text-center type-body-sm text-ink-faint sm:py-8">{s('nothingHere')}</p>
      ) : (
        <>
          <PhonePairs
            items={sorted.slice(0, NEWS_MOBILE_COUNT)}
            itemKey={(post) => post._id}
            render={(post) => <NewsCard post={post} compact />}
          />
          <div className={`hidden gap-4 sm:grid sm:grid-cols-2 ${desktopCols}`}>
            {latest.map((post, i) => (
              <Reveal key={post._id} delay={Math.min(i, 4) * 80} className="min-w-0">
                <NewsCard post={post} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One video card: the thumbnail (play button, duration) over the date and title; a
 * click plays it in the shared modal. `compact` is the phone layout, two cards to a
 * row: smaller play button, padding and date.
 */
function VideoTile({ v, onPlay, compact = false }: { v: VideoItem; onPlay: (v: VideoItem) => void; compact?: boolean }) {
  const { lang } = useSite();
  const src = v.thumbnailUrl || youtubeThumb(v.youtubeUrl);
  return (
    <button
      type="button"
      onClick={() => onPlay(v)}
      aria-label={t(v.title, lang)}
      className={`card-hover group flex h-full w-full flex-col overflow-hidden border border-plum-100/70 bg-white text-start shadow-soft ${
        compact ? 'rounded-xl' : 'rounded-2xl'
      }`}
    >
      <span className="relative block aspect-video overflow-hidden bg-plum-900">
        {src && (
          <img
            src={src}
            alt=""
            loading="lazy"
            /* A broken custom thumbnail falls back to YouTube's own, then to the plain panel */
            onError={(e) => {
              const img = e.currentTarget;
              const fallback = youtubeThumb(v.youtubeUrl);
              if (fallback && img.src !== fallback) img.src = fallback;
              else img.style.display = 'none';
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute inset-0 z-10 grid place-items-center">
          <span
            className={`grid place-items-center rounded-full bg-white/95 text-magenta-500 shadow-lift transition group-hover:scale-110 ${
              compact ? 'h-9 w-9' : 'h-12 w-12 sm:h-14 sm:w-14'
            }`}
          >
            <Play size={compact ? 15 : 20} className="ms-0.5" fill="currentColor" />
          </span>
        </span>
        {v.durationLabel && (
          <span
            className={`absolute z-10 rounded-md bg-ink/80 type-meta font-medium text-white ${
              compact ? 'bottom-1 end-1 px-1 py-px' : 'bottom-2 end-2 px-1.5 py-0.5 sm:bottom-3 sm:end-3 sm:px-2'
            }`}
          >
            {v.durationLabel}
          </span>
        )}
      </span>
      <span className={`flex flex-1 flex-col ${compact ? 'p-2' : 'p-4 sm:p-5'}`}>
        {v.publishedAt && (
          <span
            className={`block type-meta font-medium uppercase text-magenta-600 ${
              compact ? 'mb-1 truncate tracking-normal' : 'mb-1.5 tracking-wider'
            }`}
          >
            {formatDate(v.publishedAt, lang)}
          </span>
        )}
        <span className="line-clamp-2 block break-words type-title text-plum-800 transition group-hover:text-magenta-600">
          <GradientText>{t(v.title, lang)}</GradientText>
        </span>
      </span>
    </button>
  );
}

/**
 * Videos: the latest videos (the API sends the newest three) as cards: two at a time
 * on phones (PhonePairs), two across on tablets, three on desktop.
 */
function VideoRow({ videos, onPlay }: { videos: VideoItem[]; onPlay: (v: VideoItem) => void }) {
  const { path, s, h } = useSite();

  return (
    <div>
      <BandHeading
        sectionKey="homeVideos"
        label={h('videos')}
        actionLabel={s('viewMoreVideos')}
        to={path('/media/videos')}
      />
      <PhonePairs items={videos} itemKey={(v) => v._id} render={(v) => <VideoTile v={v} onPlay={onPlay} compact />} />
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {videos.map((v, i) => (
          <Reveal key={v._id} delay={Math.min(i, 4) * 80} className="min-w-0">
            <VideoTile v={v} onPlay={onPlay} />
          </Reveal>
        ))}
      </div>
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
          // Photos run cleanly to the strip's edges (no edge fade). The strip is a size
          // container so desktop tiles can each take a fifth of its width.
          className="w-full cursor-grab touch-pan-y select-none overflow-hidden py-1 [container-type:inline-size]"
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
                      /* 3:2 like event photos; pops in (fade + slight scale) on first view. Phones
                         show two tiles across the strip (half its width each, less the gap); on
                         desktop five fill it: a fifth of its width each, less the gap. */
                      className={`group relative block aspect-[3/2] w-[calc(50cqw-0.25rem)] overflow-hidden rounded-lg bg-plum-50 shadow-soft transition duration-700 ease-out motion-reduce:transition-none sm:h-52 sm:w-auto sm:rounded-xl lg:h-auto lg:w-[calc(20cqw-1rem)] ${
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
                        <span className="user-text absolute inset-x-3 bottom-2.5 translate-y-2 text-start type-caption font-medium leading-snug text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
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
