import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Play,
  Scale,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDate, youtubeThumb } from '../lib/format';
import {
  Container,
  ErrorState,
  Highlighted,
  Loading,
  Rule,
  Section,
  SectionHeading,
} from '../components/Primitives';
import {
  CampaignCard,
  EventCard,
  PostCard,
  PublicationCard,
  VideoCard,
  VideoPlayerModal,
} from '../components/Cards';
import type {
  FocusArea,
  HomePayload,
  MediaPost,
  OrgEvent,
  ProgramBanner,
  PresidentMessage,
  Slide,
  VideoItem,
} from '../lib/types';

const FOCUS_ICONS: Record<string, LucideIcon> = {
  'graduation-cap': GraduationCap,
  users: Users,
  'heart-handshake': HeartHandshake,
  'calendar-days': CalendarDays,
  megaphone: Megaphone,
  handshake: Handshake,
  'book-open': BookOpen,
  sprout: Sprout,
  'shield-check': ShieldCheck,
  stethoscope: Stethoscope,
  scale: Scale,
  lightbulb: Lightbulb,
};

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
  const showFocus = sections.focusAreas !== false && data.focusAreas?.length > 0;

  return (
    <>
      {sections.slider && data.sliders.length > 0 && <Hero slides={data.sliders} />}

      {/* Stacked cards that overlap the hero, matching the reference layout */}
      <div className={`relative z-20 space-y-6 pb-4 ${sections.slider ? '-mt-14 md:-mt-20' : 'pt-10'}`}>
        {showBanners && (
          <Container>
            <ProgramBanners banners={banners} />
          </Container>
        )}

        {showPresident && (
          <Container>
            <PresidentCard message={presidentMessage} />
          </Container>
        )}

        {showFocus && (
          <Container>
            <FocusStrip areas={data.focusAreas} />
          </Container>
        )}

        <Container>
          <InfoBand
            updates={data.updates}
            events={data.upcomingEvents}
            video={data.featuredVideos[0] ?? null}
            onPlay={setPlaying}
          />
        </Container>
      </div>

      {sections.campaigns && data.campaigns.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading eyebrow={s('mediaCentre')} title={s('campaigns')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.campaigns.map((c) => (
                <CampaignCard key={c._id} campaign={c} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {sections.featuredArticles && data.featuredArticles.length > 0 && (
        <Section tone="deep">
          <Container>
            <SectionHeading eyebrow={s('media')} title={s('featuredArticles')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.featuredArticles.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {sections.featuredVideos && data.featuredVideos.length > 1 && (
        <Section tone="plum">
          <Container>
            <SectionHeading eyebrow={s('mediaCentre')} title={s('featuredVideos')} invert />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.featuredVideos.map((v) => (
                <VideoCard key={v._id} item={v} onPlay={setPlaying} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {sections.publications && data.publications.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading eyebrow={s('publications')} title={s('publications')} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.publications.map((p) => (
                <PublicationCard key={p._id} publication={p} />
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

function Hero({ slides }: { slides: Slide[] }) {
  const { lang, s } = useSite();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);
  const slide = slides[index];

  const primaryUrl = slide.linkUrl;
  const secondaryUrl = slide.secondaryLinkUrl;

  return (
    <section
      className="relative isolate overflow-hidden bg-plum-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[700px] w-full md:h-[76vh] md:min-h-[560px]">
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

        {/* Purple wash, heaviest on the text side */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-plum-900 via-plum-900/80 to-plum-900/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-plum-900/85 via-transparent to-plum-900/40" />

        <div className="absolute inset-0 flex w-full min-w-0 items-end md:items-center">
          <div
            className="mx-auto flex h-full w-full min-w-0 max-w-[1200px] items-end px-4 pb-28 sm:px-5 md:items-center md:pb-0 lg:px-8"
          >
            <div
              key={slide._id}
              className={`responsive-copy w-full min-w-0 max-w-full animate-fade-up text-white md:max-w-2xl md:pb-20 ${
                slides.length > 1 ? 'max-md:px-8' : ''
              }`}
            >
            {t(slide.title, lang) && (
              <h1 className="responsive-copy w-full min-w-0 max-w-full text-[2rem] font-semibold leading-[1.15] md:text-[3.4rem]">
                <Highlighted text={t(slide.title, lang)} />
              </h1>
            )}
            {t(slide.subtitle, lang) && (
              <p className="responsive-copy mt-5 max-w-full text-[14.5px] leading-relaxed text-white/80 md:max-w-xl md:text-base">
                {t(slide.subtitle, lang)}
              </p>
            )}

            {(primaryUrl || secondaryUrl) && (
              <div className="mt-5 flex w-full max-w-full flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-3">
                {primaryUrl && (
                  <SlideLink url={primaryUrl} variant="primary">
                    {t(slide.linkLabel, lang) || s('discoverMore')}
                    <ArrowRight size={16} />
                  </SlideLink>
                )}
                {secondaryUrl && (
                  <SlideLink url={secondaryUrl} variant="light">
                    {t(slide.secondaryLinkLabel, lang) || s('ourInitiatives')}
                  </SlideLink>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute start-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-soft transition hover:bg-white sm:start-3 sm:h-10 sm:w-10 md:start-6 md:h-12 md:w-12"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute end-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-soft transition hover:bg-white sm:end-3 sm:h-10 sm:w-10 md:end-6 md:h-12 md:w-12"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center gap-2 sm:bottom-20 md:bottom-24">
              {slides.map((item, i) => (
                <button
                  key={item._id}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-7 bg-magenta-500' : 'w-2 bg-white/50 hover:bg-white/80'
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

function SlideLink({
  url,
  variant,
  children,
}: {
  url: string;
  variant: 'primary' | 'light';
  children: React.ReactNode;
}) {
  const cls =
    variant === 'primary'
      ? 'inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-magenta-500 px-5 py-3 text-[13px] font-medium text-white shadow-pink transition hover:bg-magenta-600 sm:px-7 sm:py-3.5 sm:text-sm'
      : 'inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/60 bg-white/10 px-5 py-3 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white hover:text-plum-800 sm:px-7 sm:py-3.5 sm:text-sm';

  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={url} className={cls}>
      {children}
    </Link>
  );
}

/* ─────────────────────── programme banner strip ─────────────────────── */

function ProgramBanners({ banners }: { banners: ProgramBanner[] }) {
  const { lang, path } = useSite();
  return (
    <div className="rounded-3xl bg-white p-3 shadow-card md:p-4">
      <div
        className={`grid gap-3 md:gap-4 ${
          banners.length === 1 ? '' : banners.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {banners.map((banner) => {
          const inner = (
            <img
              src={banner.bannerImage}
              alt={t(banner.title, lang)}
              loading="lazy"
              className="mx-auto block h-auto w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.03] md:h-full md:object-cover md:object-center"
            />
          );
          const cls =
            'group flex items-center justify-center overflow-hidden rounded-2xl border border-plum-100 bg-white transition hover:border-magenta-200 hover:shadow-soft md:block md:aspect-[3/1]';

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
    </div>
  );
}

/* ────────────────────── president's message ────────────────────── */

function PresidentCard({ message }: { message: PresidentMessage }) {
  const { lang, s } = useSite();
  const heading = t(message.heading, lang) || s('presidentMessage');
  const body = t(message.message, lang);
  const name = t(message.name, lang);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-magenta-50 via-white to-plum-50 p-6 shadow-card md:p-10">
      <span className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-magenta-100/60 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0">
          <h2 className="responsive-copy font-display text-[1.45rem] font-semibold leading-[1.25] text-magenta-500 sm:text-[1.7rem] md:text-[2.1rem] md:leading-tight">
            {heading}
          </h2>
          <Rule className="mt-4" />

          {body && (
            <div
              className="prose-content prose-justify mt-6 max-h-[19rem] overflow-hidden text-start text-[14.5px] leading-[2] md:text-justify"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}

          {message.linkUrl && (
            <Link
              to={message.linkUrl}
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-magenta-600 hover:text-magenta-500"
            >
              {s('readFullMessage')}
              <ArrowRight size={15} />
            </Link>
          )}
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <span className="pointer-events-none absolute -start-2 -top-2 font-display text-[4rem] leading-none text-magenta-200/70 sm:-start-6 sm:-top-4 sm:text-[5rem] lg:-start-14 lg:text-[7rem]">
            &ldquo;
          </span>

          <figure className="relative">
            {message.photo ? (
              <img
                src={message.photo}
                alt={name}
                className="mx-auto h-[290px] w-[240px] max-w-full rounded-t-[7rem] rounded-b-3xl border-4 border-white object-cover shadow-lift"
              />
            ) : (
              <div className="mx-auto grid h-[290px] w-[240px] max-w-full place-items-center rounded-t-[7rem] rounded-b-3xl border-4 border-white bg-plum-100 text-plum-300 shadow-lift">
                <Users size={44} />
              </div>
            )}
            {name && (
              <figcaption className="absolute -bottom-5 start-1/2 w-[92%] -translate-x-1/2 rounded-2xl bg-white px-4 py-2.5 text-center shadow-soft">
                <span className="block font-display text-[15px] font-semibold text-plum-800">
                  {name}
                </span>
                {t(message.designation, lang) && (
                  <span className="block text-[11.5px] text-ink-muted">
                    {t(message.designation, lang)}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── focus areas ─────────────────────────── */

// Dividers between cells, recomputed per breakpoint so row starts never carry
// a leading border and the single-row layout at lg carries no top borders.
const FOCUS_CELL = [
  'group block min-w-0 border-plum-100 px-4 py-6 text-center transition',
  '[&:not(:first-child)]:border-t',
  'min-[480px]:[&:not(:first-child)]:border-t-0 min-[480px]:border-s min-[480px]:[&:nth-child(2n+1)]:border-s-0 min-[480px]:[&:nth-child(n+3)]:border-t',
  'md:[&:nth-child(2n+1)]:border-s md:[&:nth-child(3n+1)]:border-s-0',
  'md:[&:nth-child(3)]:border-t-0 md:[&:nth-child(n+4)]:border-t',
  'lg:[&:nth-child(3n+1)]:border-s lg:[&:nth-child(6n+1)]:border-s-0',
  'lg:[&:nth-child(n+4)]:border-t-0',
].join(' ');

function FocusStrip({ areas }: { areas: FocusArea[] }) {
  const { lang, path } = useSite();

  return (
    <div className="rounded-3xl bg-white p-2 shadow-card md:p-4">
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {areas.map((area) => {
          const Icon = FOCUS_ICONS[area.icon] ?? GraduationCap;
          const body = (
            <>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-magenta-50 text-magenta-500 transition group-hover:bg-magenta-500 group-hover:text-white">
                <Icon size={24} />
              </span>
              <span className="mt-3.5 block font-display text-[15px] font-semibold text-plum-800">
                {t(area.title, lang)}
              </span>
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-muted">
                {t(area.description, lang)}
              </span>
            </>
          );

          if (!area.linkUrl) {
            return (
              <div key={area._id} className={FOCUS_CELL}>
                {body}
              </div>
            );
          }

          return /^https?:\/\//.test(area.linkUrl) ? (
            <a
              key={area._id}
              href={area.linkUrl}
              target="_blank"
              rel="noreferrer"
              className={FOCUS_CELL}
            >
              {body}
            </a>
          ) : (
            <Link key={area._id} to={path(area.linkUrl)} className={FOCUS_CELL}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────── news · events · featured video band ──────────────── */

function BandHeading({ label, actionLabel, to }: { label: string; actionLabel: string; to: string }) {
  return (
    <div className="mb-4 flex min-w-0 items-center justify-between gap-3 border-b border-plum-100 pb-3">
      <h3 className="min-w-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-magenta-500">
        {label}
      </h3>
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-muted transition hover:text-magenta-600"
      >
        {actionLabel}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function InfoBand({
  updates,
  events,
  video,
  onPlay,
}: {
  updates: MediaPost[];
  events: OrgEvent[];
  video: VideoItem | null;
  onPlay: (v: VideoItem) => void;
}) {
  const { lang, path, s } = useSite();
  const poster = events.find((e) => e.posterImage || e.coverImage);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Latest news */}
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <BandHeading label={s('latestNews')} actionLabel={s('viewAllNews')} to={path('/media/news')} />
        {updates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-faint">{s('nothingHere')}</p>
        ) : (
          <ul className="divide-y divide-plum-100">
            {updates.slice(0, 3).map((post) => (
              <li key={post._id}>
                <Link
                  to={path(`/media/${post.type}/${post.slug}`)}
                  className="group flex items-start gap-3.5 py-3.5"
                >
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt=""
                      loading="lazy"
                      className="h-[62px] w-[86px] shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="h-[62px] w-[86px] shrink-0 rounded-xl bg-magenta-50" />
                  )}
                  <span className="min-w-0">
                    <span className="line-clamp-2 block font-display text-[14px] font-semibold leading-snug text-plum-800 transition group-hover:text-magenta-600">
                      {t(post.title, lang)}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
                      <CalendarDays size={12} />
                      {formatDate(post.publishedAt, lang)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming events */}
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <BandHeading
          label={s('upcomingEvents')}
          actionLabel={s('viewAllEvents')}
          to={path('/events')}
        />
        {events.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-faint">{s('nothingHere')}</p>
        ) : poster ? (
          <Link
            to={path(`/events/${poster.slug}`)}
            className="group block overflow-hidden rounded-2xl bg-plum-50"
          >
            <img
              src={poster.posterImage || poster.coverImage}
              alt={t(poster.title, lang)}
              loading="lazy"
              className="max-h-[290px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 2).map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Featured video */}
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <BandHeading
          label={s('featuredVideo')}
          actionLabel={s('viewMoreVideos')}
          to={path('/media/videos')}
        />
        {!video ? (
          <p className="py-8 text-center text-[13px] text-ink-faint">{s('nothingHere')}</p>
        ) : (
          <button onClick={() => onPlay(video)} className="group w-full text-start">
            <span className="relative block aspect-video overflow-hidden rounded-2xl bg-plum-900">
              {(video.thumbnailUrl || youtubeThumb(video.youtubeUrl)) && (
                <img
                  src={video.thumbnailUrl || youtubeThumb(video.youtubeUrl)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-magenta-500 shadow-lift transition group-hover:scale-110">
                  <Play size={20} className="ms-0.5" fill="currentColor" />
                </span>
              </span>
            </span>
            <span className="mt-3.5 block font-display text-[15px] font-semibold text-plum-800 transition group-hover:text-magenta-600">
              {t(video.title, lang)}
            </span>
            {t(video.description, lang) && (
              <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-muted">
                {t(video.description, lang)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
