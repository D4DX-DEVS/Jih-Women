import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t, tLang } from '../lib/i18n';
import { formatDate, youtubeThumb } from '../lib/format';
import {
  Container,
  ErrorState,
  Loading,
  Rule,
  Button,
  Section,
  ManagedSectionHeading,
  SectionLogo,
} from '../components/Primitives';
import {
  CampaignCard,
  EventCard,
  PostCard,
  PublicationCard,
  VideoPlayerModal,
} from '../components/Cards';
import Reveal from '../components/Reveal';
import type {
  HomePayload,
  Localized,
  MediaPost,
  OrgEvent,
  ProgramBanner,
  PresidentMessage,
  SiteSettings,
  Slide,
  VideoItem,
} from '../lib/types';

export default function Home() {
  const { s } = useSite();
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
  const banners = (data.programBanners ?? []).filter((b) => Boolean(b.bannerImage));
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
              <VideoRow
                videos={
                  sections.featuredVideos && data.featuredVideos.length > 1
                    ? data.featuredVideos
                    : data.featuredVideos.slice(0, 1)
                }
                onPlay={setPlaying}
              />
            </Reveal>
          </Container>
        </section>
      )}

      {sections.campaigns && data.campaigns.length > 0 && (
        <Section tone="white">
          <Container>
            <ManagedSectionHeading sectionKey="homeCampaigns" eyebrow={s('mediaCentre')} title={s('campaigns')} />
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
            <ManagedSectionHeading sectionKey="homeFeaturedArticles" eyebrow={s('media')} title={s('featuredArticles')} />
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
            <ManagedSectionHeading sectionKey="homePublications" eyebrow={s('publications')} title={s('publications')} />
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

      <CtaBand tagline={data.settings.tagline} joinLabel={data.settings.joinLabel} joinUrl={data.settings.joinUrl} />

      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

/* ─────────────────────────── hero slider ─────────────────────────── */

function Hero({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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
                className={`h-full w-full object-cover ${i === index ? 'sm:animate-zoom-slow' : ''}`}
              />
            </picture>
          </div>
        ))}

        {/* Slides are absolutely positioned, so this spacer keeps the hero's height. */}
        <div className="min-h-[400px] lg:min-h-[440px]" />

        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute start-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-soft transition hover:bg-white sm:start-3 md:start-6 md:h-10 md:w-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute end-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-soft transition hover:bg-white sm:end-3 md:end-6 md:h-10 md:w-10"
            >
              <ChevronRight size={16} />
            </button>

            <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-1.5 md:bottom-6">
              {slides.map((item, i) => (
                <button
                  key={item._id}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-magenta-500' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────── programme banner strip ─────────────────────── */

function ProgramBanners({ banners }: { banners: ProgramBanner[] }) {
  const { lang, path, s, section } = useSite();
  const heading = section('homePrograms', { heading: s('programs') });
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  };
  const arrow =
    'hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-plum-100 bg-white text-plum-800 shadow-soft transition hover:border-magenta-200 hover:text-magenta-600 sm:grid';

  return (
    <section className="border-b border-plum-100/70 bg-white py-5 md:py-6">
      <Container>
        <div className="mb-4 flex items-center justify-center gap-3 eyebrow">
          {heading.logo && <SectionLogo src={heading.logo} />}
          <span className="h-px w-6 bg-magenta-300" />
          {heading.heading}
          <span className="h-px w-6 bg-magenta-300" />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button type="button" onClick={() => scroll(-1)} aria-label={s('previous')} className={arrow}>
            <ChevronLeft size={15} />
          </button>
          <div
            ref={railRef}
            className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto md:gap-3"
          >
            {banners.map((banner) => {
              const inner = (
                <img
                  src={banner.bannerImage}
                  alt={t(banner.title, lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              );
              const cls =
                'group block aspect-[3/1] w-[46%] shrink-0 snap-start overflow-hidden rounded-xl border border-plum-100 bg-white transition hover:border-magenta-200 hover:shadow-soft min-[480px]:w-[31%] md:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-3rem)/5)]';

              return banner.externalUrl ? (
                <a key={banner._id} href={banner.externalUrl} target="_blank" rel="noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link key={banner._id} to={path(`/programs/${banner.slug}`)} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
          <button type="button" onClick={() => scroll(1)} aria-label={s('next')} className={arrow}>
            <ChevronRight size={15} />
          </button>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────── president's message ────────────────────── */

function Eyebrow({ children, logo }: { children: React.ReactNode; logo?: string }) {
  return (
    <div className="flex items-center gap-2 eyebrow">
      {logo && <SectionLogo src={logo} />}
      <span className="h-px w-5 shrink-0 bg-magenta-400" />
      {children}
      <span className="h-px w-5 shrink-0 bg-magenta-400" />
    </div>
  );
}

/* About (organisation intro) beside the president's message, as one card */
function MainInfo({ settings, message }: { settings: SiteSettings; message: PresidentMessage | null }) {
  const { lang, path, s, section } = useSite();
  const about = section('homeAbout', {
    label: s('aboutUs'),
    heading: t(settings.siteName, lang),
    description: t(settings.footerNote, lang) || s('footerBlurb'),
  });
  const aboutTitle = about.heading;
  const aboutBody = about.description;
  const president = section('homePresident', { label: s('presidentMessage') });
  const label = president.label;
  const heading = message ? t(message.heading, lang) || label : '';
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
              {aboutTitle}
            </h2>
          )}
          <Rule className="mt-3" />
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink/75">{aboutBody}</p>
          <div className="mt-5">
            <Button to={path('/who-we-are')} size="sm">
              {s('readMore')}
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
                    <span className="block font-display text-[14px] font-semibold text-plum-800">{name}</span>
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
                    {heading}
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
                    {s('readFullMessage')}
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
    <div className="mb-3.5 flex min-w-0 items-center justify-between gap-3">
      <h3 className="band-label flex min-w-0 items-center gap-2 whitespace-nowrap font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-magenta-500">
        {heading.logo && <SectionLogo src={heading.logo} />}
        <span className="h-px w-5 shrink-0 bg-magenta-400" />
        {heading.heading}
        <span className="h-px w-5 shrink-0 bg-magenta-400" />
      </h3>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-ink-muted transition hover:text-magenta-600"
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

function NewsAndEvents({ updates, events }: { updates: MediaPost[]; events: OrgEvent[] }) {
  const { lang, path, s } = useSite();
  const posters = events.filter((e) => e.posterImage || e.coverImage);
  const railRef = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  };
  const empty = <p className="py-8 text-center text-[13px] text-ink-faint">{s('nothingHere')}</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-7">
      {/* Latest news — swipe row on phones, three-up from sm */}
      <div className="min-w-0 lg:col-span-7">
        <BandHeading sectionKey="homeNews" label={s('latestNews')} actionLabel={s('viewAllNews')} to={path('/media/news')} />
        {updates.length === 0 ? (
          empty
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {updates.slice(0, 3).map((post) => (
              <Link
                key={post._id}
                to={path(`/media/${post.type}/${post.slug}`)}
                className="card-hover group flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft sm:w-auto"
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
                  <span className="mt-1.5 line-clamp-2 font-display text-[14px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
                    {t(post.title, lang)}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2.5 text-[12px] font-medium text-magenta-600">
                    {s('readMore')}
                    <ArrowRight size={13} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Events & posters */}
      <div className="min-w-0 lg:col-span-5">
        <BandHeading sectionKey="homeEvents" label={s('upcomingEvents')} actionLabel={s('viewAllEvents')} to={path('/events')} />
        {events.length === 0 ? (
          empty
        ) : posters.length > 0 ? (
          <>
            <div ref={railRef} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {posters.map((event) => (
                <Link
                  key={event._id}
                  to={path(`/events/${event.slug}`)}
                  className="group block w-[46%] shrink-0 snap-start overflow-hidden rounded-xl border border-plum-100 bg-plum-50 shadow-soft sm:w-[31%] lg:w-[44%]"
                >
                  <img
                    src={event.posterImage || event.coverImage}
                    alt={t(event.title, lang)}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
              ))}
            </div>
            {posters.length > 2 && (
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
  const { lang, path, s } = useSite();
  const thumb = (v: VideoItem, big = false) => (
    <span className="relative block aspect-video overflow-hidden rounded-xl bg-plum-900 shadow-soft">
      {(v.thumbnailUrl || youtubeThumb(v.youtubeUrl)) && (
        <img
          src={v.thumbnailUrl || youtubeThumb(v.youtubeUrl)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span
          className={`grid place-items-center rounded-full bg-white/95 text-magenta-500 shadow-lift transition group-hover:scale-110 ${
            big ? 'h-12 w-12' : 'h-10 w-10'
          }`}
        >
          <Play size={big ? 19 : 16} className="ms-0.5" fill="currentColor" />
        </span>
      </span>
      {v.durationLabel && (
        <span className="absolute bottom-2 end-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10.5px] font-medium text-white">
          {v.durationLabel}
        </span>
      )}
    </span>
  );

  return (
    <div>
      <BandHeading
        sectionKey="homeVideos"
        label={videos.length > 1 ? s('featuredVideos') : s('featuredVideo')}
        actionLabel={s('viewMoreVideos')}
        to={path('/media/videos')}
      />
      {videos.length > 1 ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {videos.map((v) => (
            <button key={v._id} onClick={() => onPlay(v)} className="group min-w-0 text-start">
              {thumb(v)}
              <span className="mt-2 line-clamp-2 block font-display text-[13.5px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
                {t(v.title, lang)}
              </span>
              {v.publishedAt && (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <CalendarDays size={11} />
                  {formatDate(v.publishedAt, lang)}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => onPlay(videos[0])}
          className="group grid w-full items-center gap-4 text-start sm:grid-cols-[minmax(0,320px)_1fr] md:gap-6"
        >
          {thumb(videos[0], true)}
          <span className="min-w-0">
            <span className="block font-display text-[16px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600 md:text-[18px]">
              {t(videos[0].title, lang)}
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

/* ─────────────────────────── closing call-to-action ─────────────────────────── */

function CtaBand({
  tagline,
  joinLabel,
  joinUrl,
}: {
  tagline?: Localized;
  joinLabel?: Localized;
  joinUrl?: string;
}) {
  const { lang, path, s } = useSite();
  const heading = t(tagline, lang);
  if (!heading) return null;

  const url = joinUrl || path('/contact');
  const label = tLang(joinLabel, lang) || s('joinUs');
  const cls =
    'mt-5 inline-flex items-center gap-2 rounded-full bg-magenta-500 px-5 py-2.5 text-[13.5px] font-medium text-white shadow-pink transition hover:bg-magenta-600 active:scale-[0.97]';

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-plum-900 via-plum-800 to-plum-700 text-white">
      <div className="leaf-watermark pointer-events-none absolute inset-0" />
      <span className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-magenta-500/20 blur-3xl" />
      <Container className="relative py-10 text-center md:py-12">
        <Reveal>
          <p className="mx-auto max-w-2xl font-display text-[1.35rem] font-semibold leading-snug sm:text-[1.6rem] md:text-[1.9rem]">
            {heading}
          </p>
          {/^https?:\/\//.test(url) ? (
            <a href={url} target="_blank" rel="noreferrer" className={cls}>
              <UserPlus size={15} />
              {label}
            </a>
          ) : (
            <Link to={url} className={cls}>
              <UserPlus size={15} />
              {label}
            </Link>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
