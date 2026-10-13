import { useState } from 'react';
import { useParams } from 'react-router';
import { BookOpen, ExternalLink as ExternalLinkIcon, Maximize2, Play } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { isExternalUrl, validMedia } from '../lib/format';
import {
  Button,
  Container,
  ContentPanel,
  EmptyState,
  ErrorState,
  ManagedSectionHeading,
  PageHeader,
  Section,
  SectionHeading,
  ViewToggle,
} from '../components/Primitives';
import { DetailSkeleton, ListSkeleton } from '../components/PageSkeletons';
import { Lightbox, PanelPoster, ProgramCard } from '../components/Cards';
import Reveal from '../components/Reveal';
import ContentSections from '../components/ContentCards';
import { useViewMode } from '../lib/view';
import NotFound from './NotFound';
import type { MediaItem, Program } from '../lib/types';

export function ProgramsIndex() {
  const { path, s, pageTitle, h } = useSite();
  const { view } = useViewMode();
  const { data, loading, error, reload } = useApi<{ items: Program[] }>('/api/site/programs');
  const cols = view === 'list' ? 'grid-cols-1' : 'grid-cols-3';

  const major = data?.items.filter((p) => p.isMajor) ?? [];
  const others = data?.items.filter((p) => !p.isMajor) ?? [];

  return (
    <>
      <PageHeader
        title={pageTitle('programs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('programs') }]}
      />
      <Section tone="mist">
        <Container>
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <ViewToggle />
              {major.length > 0 && (
                <>
                  <ManagedSectionHeading sectionKey="programsMajor" eyebrow={h('programs')} title={h('majorProgrammes')} />
                  <div className={`grid ${cols} gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3`}>
                    {major.map((p) => (
                      <ProgramCard key={p._id} program={p} view={view} />
                    ))}
                  </div>
                </>
              )}
              {others.length > 0 && (
                <div className="mt-7 sm:mt-14">
                  <ManagedSectionHeading sectionKey="programsOther" eyebrow={h('programs')} title={h('otherProgrammes')} />
                  <div className={`grid ${cols} gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3`}>
                    {others.map((p) => (
                      <ProgramCard key={p._id} program={p} view={view} />
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

  if (notFound) return <NotFound />;
  if (loading) return <DetailSkeleton />;
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
  // A programme page is its description plus its poster (or, without one, its logo).
  // Objectives, schedule, videos and downloads are no longer managed in the admin, so
  // any values still stored for them are not shown.
  const website = isExternalUrl(data.externalUrl) ? data.externalUrl : '';
  const hasAside = Boolean(data.posterImage || data.logoUrl || website);
  // Only photos that have a file; with none, the page has no Gallery section at all
  const gallery = validMedia(data.gallery);
  const logo = data.logoUrl ? (
    <div className="flex h-12 w-full max-w-[140px] items-center justify-center sm:h-16 sm:max-w-[180px] md:h-20">
      <img
        src={data.logoUrl}
        alt={title}
        /* multiply lets white or near-white logo backgrounds melt into the panel */
        className="h-auto max-h-full w-auto max-w-full object-contain mix-blend-multiply brightness-[1.04]"
      />
    </div>
  ) : null;

  return (
    <>
      {/* No cover image behind the banner: programme covers are logos and banners, and
          faded behind the title their lettering read as stray text. The cover still shows
          on the programme's card. */}
      <PageHeader
        title={title}
        description={t(data.tagline, lang)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('programs'), to: path('/programs') },
          { label: title },
        ]}
      />

      {website && (
        <div className="border-b border-plum-100 bg-magenta-500/10">
          <Container className="flex flex-wrap items-center justify-between gap-2 py-3 sm:gap-4 sm:py-5">
            <p className="type-body-sm text-ink-muted">{t(data.externalLabel, 'en') || s('visitWebsite')}</p>
            <Button href={website} variant="primary" size="sm">
              {s('visitWebsite')}
              <ExternalLinkIcon size={15} />
            </Button>
          </Container>
        </div>
      )}

      <Section tone="mist">
        <Container>
          {/* One content card: the description's sections, with the programme's poster
              (its logo alone when no poster is uploaded) and link in the side column */}
          <ContentPanel
            aside={
              hasAside ? (
                <div className="flex flex-col items-center text-center">
                  {/* key: a replaced poster starts afresh instead of inheriting a failed load */}
                  {data.posterImage ? (
                    <PanelPoster key={data.posterImage} src={data.posterImage} alt={title} fallback={logo} />
                  ) : (
                    logo
                  )}
                  {website && (
                    <Button href={website} variant="outline" size="sm" className="mt-3 sm:mt-4">
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

          {/* This programme's own photos (Programme > Gallery in admin). No photos: no
              heading, no wrapper, no reserved space. key: a fresh start per programme */}
          {gallery.length > 0 && <ProgramGallery key={data._id} items={gallery} heading={h('gallery')} />}
        </Container>
      </Section>
    </>
  );
}

/**
 * The picture inside a gallery tile. Photos fill the 3:2 tile (cropped); a very wide
 * banner or logo would lose its lettering that way, so once its shape is known it is
 * shown whole, on a soft blurred copy of itself. A file that will not load is retried
 * from `fallbackSrc` (the full-size file behind a thumbnail), then reported as broken.
 */
function TileImage({ src: first, fallbackSrc, onBroken }: { src: string; fallbackSrc: string; onBroken: () => void }) {
  const [whole, setWhole] = useState(false);
  const [src, setSrc] = useState(first);
  return (
    <>
      {whole && (
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl"
        />
      )}
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) setWhole(w / h > 2);
        }}
        onError={() => (fallbackSrc && src !== fallbackSrc ? setSrc(fallbackSrc) : onBroken())}
        className={`relative h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${
          whole ? 'object-contain p-1.5 sm:p-2' : 'object-cover'
        }`}
      />
    </>
  );
}

/**
 * A programme's gallery as a grid (3 columns on phones and tablets, 5 on desktop; a
 * single photo or a pair gets larger tiles). Tiles share one 3:2 shape (photos are
 * cropped to fit, never stretched), fade and scale in one after another as they scroll
 * into view, and zoom gently on hover. A short last row is centred under the rows
 * above it, never left stranded at one edge. A click opens the shared lightbox, which
 * shows the whole photo with prev/next. A photo whose file cannot be loaded is left out;
 * when none can be, the whole section (heading included) goes with them.
 */
function ProgramGallery({ items: all, heading }: { items: MediaItem[]; heading: string }) {
  const { lang } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  // `id` is the photo's place in the stored list, so a tile keeps its key when another drops out
  const shown = all.map((item, id) => ({ item, id })).filter(({ id }) => !broken.has(id));
  const items = shown.map(({ item }) => item);
  const count = items.length;
  if (count === 0) return null;
  /* Each tile is a fixed share of the row (the calc() subtracts the gaps), so a flex row
     that wraps keeps every column the same width and `justify-center` centres the rows
     that are not full. The few-photos cases get bigger tiles so they do not look lost. */
  const tileWidth =
    count === 1
      ? 'w-full max-w-md'
      : count === 2
        ? 'w-[calc((100%-0.375rem)/2)] max-w-md sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1rem)/2)]'
        : 'w-[calc((100%-0.75rem)/3)] sm:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-4rem)/5)]';
  return (
    <section className="mt-6 sm:mt-10 md:mt-12">
      <SectionHeading title={heading} />
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 lg:gap-4">
        {shown.map(({ item, id }, i) => {
          const caption = t(item.caption, lang);
          return (
            <Reveal key={id} delay={Math.min(i, 8) * 60} className={tileWidth}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={caption || `${heading} ${i + 1}`}
                className="group relative block aspect-[3/2] w-full overflow-hidden rounded-lg bg-plum-50 shadow-soft sm:rounded-xl"
              >
                {item.kind === 'video' ? (
                  <>
                    <video src={item.url} className="h-full w-full object-cover" muted />
                    <span className="absolute inset-0 grid place-items-center bg-ink/25">
                      <Play size={22} className="text-white" fill="currentColor" />
                    </span>
                  </>
                ) : (
                  /* a lone photo or a pair is shown large, so use the full-size file */
                  <TileImage
                    src={count <= 2 ? item.url : item.thumbnailUrl || item.url}
                    fallbackSrc={item.url}
                    onBroken={() => setBroken((prev) => new Set(prev).add(id))}
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-plum-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute end-2 top-2 grid h-7 w-7 scale-75 place-items-center rounded-full bg-white/90 text-magenta-600 opacity-0 shadow-soft transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                  <Maximize2 size={13} />
                </span>
                {caption && (
                  <span className="user-text absolute inset-x-2.5 bottom-2 translate-y-2 text-start type-caption font-medium leading-snug text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
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
