import { useState } from 'react';
import { useParams } from 'react-router';
import { CalendarDays, Download, ExternalLink as ExternalLinkIcon, Images } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDate } from '../lib/format';
import {
  Container,
  ContentPanel,
  DownloadList,
  EmptyState,
  ErrorState,
  GradientText,
  Loading,
  PageHeader,
  Pagination,
  PanelSection,
  RichText,
  Section,
  SectionHeading,
} from '../components/Primitives';
import {
  AlbumCard,
  DownloadRow,
  GalleryGrid,
  PostCard,
  VideoCard,
  VideoPlayerModal,
} from '../components/Cards';
import NotFound from './NotFound';
import type { Album, DownloadItem, MediaPost, MediaPostType, Paged, VideoItem } from '../lib/types';

const POST_TYPES: { type: MediaPostType; key: string }[] = [
  { type: 'news', key: 'news' },
  { type: 'press-release', key: 'pressReleases' },
  { type: 'statement', key: 'statements' },
  { type: 'interview', key: 'interviews' },
  { type: 'speech', key: 'speeches' },
];

/**
 * Title of a Media Centre category page. These pages have no page banner, so
 * this is the page heading, centred between two short accent rules.
 */
function MediaHeading({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3 md:mb-8">
      <span className="h-px w-8 shrink-0 bg-magenta-300 sm:w-12" aria-hidden="true" />
      <h1 className="min-w-0 text-center font-display text-[1.5rem] font-semibold leading-tight text-plum-800 [overflow-wrap:anywhere] md:text-[1.9rem]">
        <GradientText>{title}</GradientText>
      </h1>
      <span className="h-px w-8 shrink-0 bg-magenta-300 sm:w-12" aria-hidden="true" />
    </div>
  );
}

/* ---------------- post listings ---------------- */

export function MediaList() {
  const { type } = useParams();
  const { pageTitle } = useSite();
  const [page, setPage] = useState(1);

  const known = POST_TYPES.find((p) => p.type === type);
  const { data, loading, error, reload } = useApi<Paged<MediaPost>>(
    known ? `/api/site/media?type=${known.type}&page=${page}&limit=12` : null
  );

  if (!known) return <NotFound />;

  return (
    <>
      <Section tone="mist" className="pt-6 md:pt-8">
        <Container>
          <MediaHeading title={pageTitle(known.key)} />
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onPage={setPage} />
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

export function MediaDetail() {
  const { slug, type } = useParams();
  const { lang, path, s, h } = useSite();
  const { data, loading, error, notFound, reload } = useApi<MediaPost>(
    slug ? `/api/site/media/${slug}` : null
  );

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

  const typeKey = POST_TYPES.find((p) => p.type === (type ?? data.type))?.key ?? 'news';

  return (
    <>
      <PageHeader
        title={t(data.title, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s(typeKey), to: path(`/media/${data.type}`) },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist">
        <Container className="max-w-4xl">
          {/* One content card: details, summary and story, then downloads and photos */}
          <ContentPanel>
            <PanelSection>
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-plum-100/80 pb-4 text-[13px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-magenta-500" />
                  {s('publishedOn')}: {formatDate(data.publishedAt, lang)}
                </span>
                {t(data.author, lang) && (
                  <span>
                    {s('author')}: {t(data.author, lang)}
                  </span>
                )}
                {data.source && (
                  <span>
                    {s('source')}: {data.source}
                  </span>
                )}
              </div>

              {t(data.excerpt, lang) && (
                <p className="user-text mb-7 rounded-e-xl border-s-4 border-magenta-400 bg-magenta-50/50 py-3 pe-4 ps-5 text-[16px] font-medium leading-relaxed text-ink/80">
                  {t(data.excerpt, lang)}
                </p>
              )}

              <RichText html={t(data.body, lang)} />

              {data.sourceUrl && (
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-magenta-600 underline underline-offset-4"
                >
                  {s('source')}
                  <ExternalLinkIcon size={14} />
                </a>
              )}

              {data.tags?.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-magenta-50 px-3 py-1 text-[12px] font-medium text-magenta-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </PanelSection>

            {data.downloads?.length > 0 && (
              <PanelSection title={h('downloads')} icon={Download}>
                <DownloadList files={data.downloads} lang={lang} />
              </PanelSection>
            )}

            {data.gallery?.length > 0 && (
              <PanelSection title={h('gallery')} icon={Images}>
                <GalleryGrid items={data.gallery} />
              </PanelSection>
            )}
          </ContentPanel>
        </Container>
      </Section>

      {data.related && data.related.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading eyebrow={h('mediaCentre')} title={h('relatedPosts')} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.related.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

/* ---------------- videos & podcasts ---------------- */

export function VideosPage({ kind }: { kind: 'video' | 'podcast' }) {
  const { pageTitle } = useSite();
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const { data, loading, error, reload } = useApi<Paged<VideoItem>>(
    `/api/site/videos?kind=${kind}&page=${page}&limit=12`
  );

  const label = kind === 'podcast' ? pageTitle('podcasts') : pageTitle('videos');

  return (
    <>
      <Section tone="mist" className="pt-6 md:pt-8">
        <Container>
          <MediaHeading title={label} />
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item) => (
                  <VideoCard key={item._id} item={item} onPlay={setPlaying} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onPage={setPage} />
            </>
          )}
        </Container>
      </Section>
      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

/* ---------------- photo gallery ---------------- */

export function AlbumsIndex() {
  const { pageTitle } = useSite();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paged<Album>>(
    `/api/site/albums?page=${page}&limit=12`
  );

  return (
    <>
      <Section tone="mist" className="pt-6 md:pt-8">
        <Container>
          <MediaHeading title={pageTitle('photoGallery')} />
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onPage={setPage} />
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

export function AlbumDetail() {
  const { slug } = useParams();
  const { lang, path, s, pageTitle } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Album>(
    slug ? `/api/site/albums/${slug}` : null
  );

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

  return (
    <>
      <PageHeader
        title={t(data.title, lang)}
        description={t(data.description, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('photoGallery'), to: path('/media/gallery') },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist">
        <Container>
          {/* One content card holding the album's photos */}
          <ContentPanel>
            <PanelSection title={data.eventDate ? formatDate(data.eventDate, lang) : undefined} icon={CalendarDays}>
              {data.items?.length ? <GalleryGrid items={data.items} /> : <EmptyState />}
            </PanelSection>
          </ContentPanel>
        </Container>
      </Section>
    </>
  );
}

/* ---------------- downloads ---------------- */

const DOWNLOAD_CATEGORIES = [
  { value: '', key: 'all' },
  { value: 'official-document', key: 'officialDocuments' },
  { value: 'constitution', key: 'constitution' },
  { value: 'poster', key: 'posters' },
];

export function DownloadsPage() {
  const { s, pageTitle } = useSite();
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useApi<{ items: DownloadItem[] }>(
    `/api/site/downloads${category ? `?category=${category}` : ''}`
  );

  return (
    <>
      <Section tone="mist" className="pt-6 md:pt-8">
        <Container>
          <MediaHeading title={pageTitle('downloads')} />

          <div className="mb-7 flex flex-wrap gap-2">
            {DOWNLOAD_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  category === c.value
                    ? 'bg-magenta-500 text-white'
                    : 'border border-plum-200 text-ink-muted hover:border-magenta-300'
                }`}
              >
                {s(c.key)}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {data.items.map((item) => (
                <DownloadRow key={item._id} item={item} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
