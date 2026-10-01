import { useState } from 'react';
import { useParams } from 'react-router';
import { BookOpen, ExternalLink as ExternalLinkIcon, Maximize2, Play } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Button,
  Container,
  ContentPanel,
  EmptyState,
  ErrorState,
  Loading,
  ManagedSectionHeading,
  PageHeader,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { Lightbox, ProgramCard, VideoCard, VideoPlayerModal } from '../components/Cards';
import Reveal from '../components/Reveal';
import ContentSections from '../components/ContentCards';
import NotFound from './NotFound';
import type { MediaItem, Program, VideoItem } from '../lib/types';

export function ProgramsIndex() {
  const { path, s, pageTitle, h } = useSite();
  const { data, loading, error, reload } = useApi<{ items: Program[] }>('/api/site/programs');

  const major = data?.items.filter((p) => p.isMajor) ?? [];
  const others = data?.items.filter((p) => !p.isMajor) ?? [];

  return (
    <>
      <PageHeader
        compact
        titleSize="md"
        title={pageTitle('programs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('programs') }]}
      />
      <Section tone="mist">
        <Container>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              {major.length > 0 && (
                <>
                  <ManagedSectionHeading size="sm" sectionKey="programsMajor" eyebrow={h('programs')} title={h('majorProgrammes')} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {major.map((p) => (
                      <ProgramCard key={p._id} program={p} />
                    ))}
                  </div>
                </>
              )}
              {others.length > 0 && (
                <div className="mt-14">
                  <ManagedSectionHeading size="sm" sectionKey="programsOther" eyebrow={h('programs')} title={h('otherProgrammes')} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {others.map((p) => (
                      <ProgramCard key={p._id} program={p} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}


export function ProgramDetail() {
  const { slug } = useParams();
  const { lang, path, s, pageTitle, h } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Program>(
    slug ? `/api/site/programs/${slug}` : null
  );
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  if (notFound) return <NotFound />;
  if (loading) return <Loading />;
  if (error) {
    return (
      <Container className="py-20">
        <ErrorState message={error} onRetry={reload} />
      </Container>
    );
  }
  if (!data) return null;

  // Programme names are brand names, so the heading always uses the English title
  // (t() still falls back to Malayalam when no English title has been entered).
  // Every heading and label on the page is English; body text follows the site language.
  const title = t(data.title, 'en');
  const overview = t(data.overview, lang);
  // A programme page is its description plus logo. Objectives, schedule, gallery,
  // videos and downloads are no longer managed in the admin, so any values still
  // stored for them are not shown.
  const hasAside = Boolean(data.logoUrl || data.externalUrl);

  return (
    <>
      {/* No cover image behind the banner: programme covers are logos and banners, and
          faded behind the title their lettering read as stray text. The cover still shows
          on the programme's card. */}
      <PageHeader
        compact
        titleSize="md"
        title={title}
        description={t(data.tagline, lang)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('programs'), to: path('/programs') },
          { label: title },
        ]}
      />

      {data.externalUrl && (
        <div className="border-b border-plum-100 bg-magenta-500/10">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
            <p className="text-sm text-ink-muted">{t(data.externalLabel, 'en') || s('visitWebsite')}</p>
            <Button href={data.externalUrl} variant="primary" size="sm">
              {s('visitWebsite')}
              <ExternalLinkIcon size={15} />
            </Button>
          </Container>
        </div>
      )}

      <Section tone="mist">
        <Container>
          {/* One content card: the description's sections, with the programme's logo
              and link in the side column */}
          <ContentPanel
            aside={
              hasAside ? (
                <div className="flex flex-col items-center text-center">
                  {data.logoUrl && (
                    <div className="flex h-16 w-full max-w-[180px] items-center justify-center md:h-20">
                      <img
                        src={data.logoUrl}
                        alt={title}
                        /* multiply lets white or near-white logo backgrounds melt into the panel */
                        className="h-auto max-h-full w-auto max-w-full object-contain mix-blend-multiply brightness-[1.04]"
                      />
                    </div>
                  )}
                  <p className="user-text mt-2.5 text-[13px] font-semibold text-plum-800">{title}</p>
                  {data.externalUrl && (
                    <Button href={data.externalUrl} variant="outline" size="sm" className="mt-3">
                      {s('visitWebsite')}
                      <ExternalLinkIcon size={14} />
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          >
            {overview ? <ContentSections html={overview} firstTitle={h('overview')} firstIcon={BookOpen} /> : <EmptyState />}
          </ContentPanel>

          {/* This programme's own photos (Programme > Gallery in admin); hidden when empty */}
          {(data.gallery?.filter((g) => g.url).length ?? 0) > 0 && (
            <ProgramGallery items={data.gallery.filter((g) => g.url)} label={title} heading={h('gallery')} />
          )}

          {/* Related videos: only when videos naming this programme exist (matched on
              the server). A swipe row on phones, a grid from sm; cards fade up in turn. */}
          {(data.relatedVideos?.length ?? 0) > 0 && (
            <section className="mt-10 md:mt-12">
              <SectionHeading size="sm" eyebrow={title} title={h('relatedVideos')} />
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                {data.relatedVideos!.map((video, i) => (
                  <Reveal key={video._id} delay={Math.min(i, 5) * 90} className="w-[82%] shrink-0 snap-start sm:w-auto">
                    <VideoCard item={video} onPlay={setPlaying} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </Container>
      </Section>

      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

/**
 * A programme's gallery as a grid (2 columns on phones, 3 on tablets, 4 on desktop).
 * Tiles share one 3:2 shape (photos are cropped to fit, never stretched), fade and
 * scale in one after another as they scroll into view, and zoom gently on hover.
 * A click opens the shared lightbox, which shows the whole photo with prev/next.
 */
function ProgramGallery({ items, label, heading }: { items: MediaItem[]; label: string; heading: string }) {
  const { lang } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="mt-10 md:mt-12">
      <SectionHeading size="sm" eyebrow={label} title={heading} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        {items.map((item, i) => {
          const caption = t(item.caption, lang);
          return (
            <Reveal key={`${item.url}-${i}`} delay={Math.min(i, 8) * 60}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={caption || `${heading} ${i + 1}`}
                className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-plum-50 shadow-soft"
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
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-plum-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute end-2 top-2 grid h-7 w-7 scale-75 place-items-center rounded-full bg-white/90 text-magenta-600 opacity-0 shadow-soft transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                  <Maximize2 size={13} />
                </span>
                {caption && (
                  <span className="user-text absolute inset-x-2.5 bottom-2 translate-y-2 text-start text-[12px] font-medium leading-snug text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {caption}
                  </span>
                )}
              </button>
            </Reveal>
          );
        })}
      </div>
      {open !== null && <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </section>
  );
}
