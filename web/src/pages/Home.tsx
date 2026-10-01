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
import { str, t } from '../lib/i18n';
import { formatDate, youtubeThumb } from '../lib/format';
import {
  Button,
  Container,
  ErrorState,
  GradientText,
  Loading,
  ManagedSectionHeading,
  Rule,
  Section,
  SectionLogo,
} from '../components/Primitives';
import {
  CampaignCard,
  EventCard,
  Lightbox,
  PostCard,
  PublicationCard,
  VideoPlayerModal,
} from '../components/Cards';
import Reveal from '../components/Reveal';
import type {
  HomePayload,
  MediaItem,
  MediaPost,
  OrgEvent,
  ProgramBanner,
  PresidentMessage,
  SiteSettings,
  Slide,
  VideoItem,
} from '../lib/types';

export default function Home() {
  const { h } = useSite();
  const { data, loading, error, reload } = useApi<HomePayload>('/api/site/home');
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  if (loading) return <Loading />;
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
  const showBanners = sections.programBanners !== false && banners.length > 0;
  const showPresident =
    sections.presidentMessage !== false && presidentMessage?.enabled !== false && presidentMessage;

  return (
    <>
      {sections.slider && data.sliders.length > 0 && <Hero slides={data.sliders} />}

      {showBanners && <ProgramBanners banners={banners} />}

      <section className="bg-mist py-7 md:py-9">
        <Container className="space-y-5">
          <Reveal>
            <MainInfo settings={data.settings} message={showPresident ? presidentMessage : null} />
          </Reveal>
        </Container>
      </section>

      <section className="bg-white py-7 md:py-9">
        <Container>
          <Reveal>
            <NewsAndEvents updates={data.updates} events={data.upcomingEvents} />
          </Reveal>
        </Container>
      </section>

      {data.featuredVideos.length > 0 && (
        <section className="border-t border-plum-100/70 bg-white pb-8 pt-7 md:pb-10 md:pt-9">
          <Container>
            <Reveal>
              <VideoRow videos={data.featuredVideos} onPlay={setPlaying} />
            </Reveal>
          </Container>
        </section>
      )}

      {(data.galleryPhotos?.length ?? 0) > 0 && (
        <section className="border-t border-plum-100/70 bg-white pb-8 pt-7 md:pb-10 md:pt-9">
          {/* No page container here: the heading aligns itself, the photos run edge to edge */}
          <PhotoGallery photos={data.galleryPhotos!} />
        </section>
      )}

      {sections.campaigns && data.campaigns.length > 0 && (
        <Section tone="white">
          <Container>
            <ManagedSectionHeading sectionKey="homeCampaigns" eyebrow={h('mediaCentre')} title={h('campaigns')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.featuredArticles.map((post, i) => (
                <Reveal key={post._id} delay={Math.min(i, 6) * 60}>
                  <PostCard post={post} />
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              className="absolute start-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-plum-800 shadow-soft transition hover:bg-white sm:start-3 sm:h-9 sm:w-9 sm:bg-white/90 md:start-6 md:h-10 md:w-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute end-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-plum-800 shadow-soft transition hover:bg-white sm:end-3 sm:h-9 sm:w-9 sm:bg-white/90 md:end-6 md:h-10 md:w-10"
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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-plum-100 bg-white text-plum-800 shadow-soft transition hover:border-magenta-200 hover:text-magenta-600 md:h-9 md:w-9"
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

function ProgramBanners({ banners }: { banners: ProgramBanner[] }) {
  const { path, section, h } = useSite();
  const heading = section('homePrograms', { heading: h('programs') });
  const repeat = Math.ceil(MARQUEE_MIN_TILES / banners.length);
  const loop = Array.from({ length: repeat }, () => banners).flat();

  const { viewportRef, trackRef, nudge, viewportProps } = useDriftStrip<HTMLDivElement, HTMLUListElement>(
    MARQUEE_SPEED,
    banners.length
  );

  /** One programme logo; `hidden` marks a repeated copy (not focusable or announced). */
  const renderTile = (banner: ProgramBanner, hidden = false) => {
    // A bare logo, no tile: fixed box, image contained so nothing is cropped or stretched
    const cls =
      'group flex h-14 w-[30vw] max-w-[140px] items-center justify-center rounded-lg sm:h-16 sm:w-[160px] sm:max-w-none lg:h-[72px] lg:w-[180px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta-400';
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
    return banner.externalUrl ? (
      <a href={banner.externalUrl} target="_blank" rel="noreferrer" className={cls} tabIndex={tabIndex} draggable={false}>
        {inner}
      </a>
    ) : (
      <Link to={path(`/programs/${banner.slug}`)} className={cls} tabIndex={tabIndex} draggable={false}>
        {inner}
      </Link>
    );
  };

  return (
    <section className="border-b border-plum-100/70 bg-white py-5 md:py-6">
      <Container>
        <div className="mb-4 flex items-center justify-center gap-3 eyebrow">
          {heading.logo && <SectionLogo src={heading.logo} />}
          <span className="brand-rule-start w-10" />
          <span className="text-brand-gradient">{heading.heading}</span>
          <span className="brand-rule-end w-10" />
        </div>
        {/* The row drifts slowly right to left; it can be dragged (mouse) or swiped
            (touch) either way, and the arrows jump it a tile at a time. Two copies of the
            (repeated) list sit side by side and the offset wraps by one copy width, so the
            loop is seamless in both directions. Hover, focus and dragging pause the drift;
            reduced-motion users get no drift. */}
        <div className="flex items-center gap-2 md:gap-3">
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
                    <li key={`${copy}-${i}`} className="shrink-0 px-3 sm:px-5 lg:px-4" aria-hidden={hidden || undefined}>
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

/* About (organisation intro) beside the president's message, as one card */
function MainInfo({ settings, message }: { settings: SiteSettings; message: PresidentMessage | null }) {
  const { lang, path, section, h } = useSite();
  const about = section('homeAbout', {
    label: h('aboutUs'),
    heading: settings.siteName?.en?.trim() || t(settings.siteName, lang),
    description: t(settings.footerNote, lang) || str('footerBlurb', lang),
  });
  const aboutTitle = about.heading;
  const aboutBody = about.description;
  const president = section('homePresident', { label: h('presidentMessage') });
  const label = president.label;
  const heading = message ? t(message.heading, 'en') || label : '';
  const body = message ? t(message.message, lang) : '';
  const name = message ? t(message.name, lang) : '';
  const designation = message ? t(message.designation, lang) : '';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-magenta-100/80 bg-gradient-to-br from-white via-magenta-50/50 to-plum-50 shadow-card">
      <span className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-magenta-100/60 blur-3xl" />
      <div className={`relative grid ${message ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : ''}`}>
        <div className="flex min-w-0 flex-col p-5 sm:p-6 md:p-8">
          <Eyebrow logo={about.logo}>{about.label}</Eyebrow>
          {aboutTitle && (
            <h2 className="responsive-copy mt-2.5 font-display text-[1.3rem] font-semibold leading-snug text-plum-800 sm:text-[1.45rem] md:text-[1.6rem]">
              <GradientText>{aboutTitle}</GradientText>
            </h2>
          )}
          <Rule className="mt-3" />
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink/75">{aboutBody}</p>
          <div className="mt-5">
            <Button to={path('/who-we-are')} size="sm">
              {h('readMore')}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {message && (
          <div className="relative min-w-0 border-t border-magenta-100/80 p-5 sm:p-6 md:p-8 lg:border-s lg:border-t-0">
            <Eyebrow logo={president.logo}>{label}</Eyebrow>
            <div className="mt-3 grid gap-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start">
              <figure className="relative mx-auto sm:order-last sm:mx-0">
                {message.photo ? (
                  <img
                    src={message.photo}
                    alt={name}
                    className="h-[170px] w-[140px] rounded-t-[4.5rem] rounded-b-2xl border-4 border-white object-cover shadow-lift sm:h-[180px] sm:w-[150px]"
                  />
                ) : (
                  <div className="grid h-[170px] w-[140px] place-items-center rounded-t-[4.5rem] rounded-b-2xl border-4 border-white bg-plum-100 text-plum-300 shadow-lift sm:h-[180px] sm:w-[150px]">
                    <Users size={36} />
                  </div>
                )}
                {name && (
                  <figcaption className="mt-2.5 text-center">
                    <span className="block font-display text-[14px] font-semibold text-plum-800"><GradientText>{name}</GradientText></span>
                    {designation && <span className="block text-[11.5px] text-ink-muted">{designation}</span>}
                  </figcaption>
                )}
              </figure>

              <div className="relative min-w-0">
                <span className="pointer-events-none absolute -start-1 -top-3 font-display text-[3.2rem] leading-none text-magenta-200">
                  &ldquo;
                </span>
                {heading !== label && (
                  <h2 className="responsive-copy relative ps-7 font-display text-[1.2rem] font-semibold leading-snug text-magenta-500 md:text-[1.35rem]">
                    <GradientText>{heading}</GradientText>
                  </h2>
                )}
                {body && (
                  <div
                    className={`prose-content relative mt-2 overflow-hidden ps-7 text-[14px] leading-[1.85] ${
                      message.linkUrl
                        ? 'max-h-[12.5rem] [mask-image:linear-gradient(to_bottom,black_75%,transparent)]'
                        : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                )}
                {message.linkUrl && (
                  <Link
                    to={message.linkUrl}
                    className="ms-7 mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-magenta-600 hover:text-magenta-500"
                  >
                    {h('readMore')}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── news · events · featured video band ──────────────── */

function BandHeading({
  sectionKey,
  label,
  actionLabel,
  to,
}: {
  sectionKey: string;
  label: string;
  actionLabel: string;
  to: string;
}) {
  const { section } = useSite();
  const heading = section(sectionKey, { heading: label });
  return (
    <div className="mb-3.5 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
      <h3 className="band-label flex shrink-0 items-center gap-2 whitespace-nowrap font-sans text-[14px] font-semibold uppercase tracking-[0.12em] text-magenta-500 md:text-[15px]">
        {heading.logo && <SectionLogo src={heading.logo} />}
        <span className="brand-rule-start w-7" />
        <span className="text-brand-gradient">{heading.heading}</span>
        <span className="brand-rule-end w-7" />
      </h3>
      <Link
        to={to}
        className="-my-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-2 text-[11px] font-medium text-ink-muted transition hover:text-magenta-600"
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

/* Home carousels (Latest News, Featured Videos): cards in view on desktop, the
   repeated cards that make the loop seamless, and time per step in ms. */
const CAROUSEL_PER_VIEW = 3;
const CAROUSEL_INTERVAL = 4500;

/* Stagger for cards popping up as a carousel first scrolls into view (static class
   names so Tailwind generates them) */
const POP_DELAYS = ['[animation-delay:0ms]', '[animation-delay:110ms]', '[animation-delay:220ms]', '[animation-delay:330ms]', '[animation-delay:440ms]'];

/** What a carousel card needs: its sizing classes, and whether it is a loop copy. */
type CarouselSlot = { className: string; clone: boolean };

/**
 * A row of cards that slides one card along every few seconds and loops seamlessly
 * (the first cards are repeated after the last, and the row snaps back to the start
 * once they are in view). From sm it shows `tabletPerView` cards, from lg three;
 * phones keep a native swipe row. Hover pauses it, a swipe on tablets moves it, and
 * prefers-reduced-motion turns the auto-slide off.
 */
function AutoCarousel<T>({
  items,
  getKey,
  renderItem,
  label,
  phoneWidth,
  tabletPerView = 3,
  className = '',
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, slot: CarouselSlot) => React.ReactNode;
  label: string;
  /** Card width on phones, e.g. `w-[72%]` */
  phoneWidth: string;
  tabletPerView?: 2 | 3;
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
    if (!canSlide || hovered) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(next, CAROUSEL_INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, hovered, canSlide]);

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
          className={`no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [--per:3] sm:mx-0 sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:[transform:translate3d(calc(var(--slide)_*_-1_*_(100%_+_1rem)_/_var(--per)),0,0)] lg:flex-1 ${perView} ${
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

/** Latest news: three cards at a time on tablet and desktop, sliding along. */
function NewsCarousel({ posts }: { posts: MediaPost[] }) {
  const { lang, path, h } = useSite();
  return (
    <AutoCarousel
      items={posts}
      getKey={(post) => post._id}
      label="News"
      phoneWidth="w-[72%]"
      className="lg:flex-1"
      renderItem={(post, { className, clone }) => (
        <Link
          to={path(`/media/${post.type}/${post.slug}`)}
          aria-hidden={clone || undefined}
          tabIndex={clone ? -1 : undefined}
          className={`card-hover group flex flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft ${className}`}
        >
          <span className="block aspect-[16/10] overflow-hidden bg-magenta-50">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </span>
          <span className="flex flex-1 flex-col p-3">
            <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
              <CalendarDays size={12} />
              {formatDate(post.publishedAt, lang)}
            </span>
            <span className="mt-1.5 line-clamp-3 font-display text-[15px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
              <GradientText>{t(post.title, lang)}</GradientText>
            </span>
            {t(post.excerpt, lang) && (
              <span className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted lg:line-clamp-3">
                {t(post.excerpt, lang)}
              </span>
            )}
            <span className="mt-auto inline-flex items-center gap-1 pt-2.5 text-[12px] font-medium text-magenta-600">
              {h('readMore')}
              <ArrowRight size={13} />
            </span>
          </span>
        </Link>
      )}
    />
  );
}

function NewsAndEvents({ updates, events }: { updates: MediaPost[]; events: OrgEvent[] }) {
  const { lang, path, s, h } = useSite();
  const posters = events.filter((e) => e.posterImage || e.coverImage);
  const railRef = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  };
  const empty = <p className="py-8 text-center text-[13px] text-ink-faint">{s('nothingHere')}</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      {/* Latest news — the wider part of the row: a swipe row on phones, a sliding row
          of three cards from sm */}
      <div className="flex min-w-0 flex-col lg:col-span-8">
        <BandHeading sectionKey="homeNews" label={h('latestNews')} actionLabel={s('viewAllNews')} to={path('/media/news')} />
        {updates.length === 0 ? empty : <NewsCarousel posts={updates} />}
      </div>

      {/* Events — the narrower part of the row, on the right: one poster per view, shown
          whole over a soft blurred copy of itself so the frame never looks empty */}
      <div className="flex min-w-0 flex-col lg:col-span-4">
        <BandHeading sectionKey="homeEvents" label={h('upcomingEvents')} actionLabel={s('viewAll')} to={path('/events')} />
        {events.length === 0 ? (
          empty
        ) : posters.length > 0 ? (
          <>
            <div ref={railRef} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:flex-1">
              {posters.map((event) => {
                const src = event.posterImage || event.coverImage;
                return (
                  <Link
                    key={event._id}
                    to={path(`/events/${event.slug}`)}
                    className="card-hover group relative block aspect-[4/5] w-full shrink-0 snap-start overflow-hidden rounded-xl border border-plum-100 bg-plum-50 shadow-soft sm:aspect-[16/10] lg:aspect-auto lg:min-h-[300px]"
                  >
                    <img
                      src={src}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl"
                    />
                    <img
                      src={src}
                      alt={t(event.title, lang)}
                      loading="lazy"
                      /* contain: posters are shown whole, never cropped */
                      className="absolute inset-0 h-full w-full object-contain p-2 drop-shadow-md sm:p-3"
                    />
                  </Link>
                );
              })}
            </div>
            {posters.length > 1 && (
              <div className="mt-3 flex justify-end">
                <RailArrows onPrev={() => slide(-1)} onNext={() => slide(1)} />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 2).map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
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
            big ? 'h-12 w-12' : 'h-10 w-10'
          }`}
        >
          <Play size={big ? 19 : 16} className="ms-0.5" fill="currentColor" />
        </span>
      </span>
      {v.durationLabel && (
        <span className="absolute bottom-2 end-2 z-10 rounded-md bg-ink/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {v.durationLabel}
        </span>
      )}
    </span>
  );

  return (
    <div>
      <BandHeading
        sectionKey="homeVideos"
        label={videos.length > 1 ? h('featuredVideos') : h('featuredVideo')}
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
          phoneWidth="w-[86%]"
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
              <span className="flex flex-1 flex-col p-4">
                <span className="line-clamp-2 block font-display text-[15px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 md:text-[16px]">
                  <GradientText>{t(v.title, lang)}</GradientText>
                </span>
                {t(v.description, lang) && (
                  <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-ink-muted">
                    {t(v.description, lang)}
                  </span>
                )}
                <span className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-magenta-600">
                    {s('watchVideo')}
                    <ArrowRight size={13} />
                  </span>
                  {v.publishedAt && (
                    <span className="flex items-center gap-1 text-[11.5px] text-ink-faint">
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
          className="group grid w-full items-center gap-4 text-start sm:grid-cols-[minmax(0,320px)_1fr] md:gap-6"
        >
          {thumb(videos[0], true)}
          <span className="min-w-0">
            <span className="block font-display text-[16px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 md:text-[18px]">
              <GradientText>{t(videos[0].title, lang)}</GradientText>
            </span>
            {t(videos[0].description, lang) && (
              <span className="mt-1.5 line-clamp-3 block text-[13.5px] leading-relaxed text-ink-muted">
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
      <Container>
        <BandHeading sectionKey="homePhotos" label={h('photoGallery')} actionLabel={s('viewAll')} to={path('/media/gallery')} />
      </Container>
      {/* Full-width strip: photos reach both edges of the section; the arrows float over
          the photos instead of taking space beside them */}
      <div className="relative">
        <span className="absolute start-2 top-1/2 z-10 -translate-y-1/2 md:start-4">
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
                  <li key={`${copy}-${i}`} className="shrink-0 pe-3 md:pe-4" aria-hidden={hidden || undefined}>
                    <button
                      type="button"
                      onClick={() => setOpen(index)}
                      tabIndex={hidden ? -1 : undefined}
                      draggable={false}
                      aria-label={caption || `${h('photoGallery')} ${index + 1}`}
                      /* 3:2 like event photos; pops in (fade + slight scale) on first view */
                      className={`group relative block aspect-[3/2] h-44 overflow-hidden rounded-xl bg-plum-50 shadow-soft transition duration-700 ease-out motion-reduce:transition-none sm:h-52 lg:h-60 ${
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
        <span className="absolute end-2 top-1/2 z-10 -translate-y-1/2 md:end-4">
          <MarqueeArrow dir={1} onClick={() => nudge(1)} />
        </span>
      </div>
      {open !== null && <Lightbox items={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </div>
  );
}
