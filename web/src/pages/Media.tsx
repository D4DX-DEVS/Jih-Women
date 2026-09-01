import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Download, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes, formatDate } from '../lib/format';
import {
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
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

function MediaTabs({ active }: { active: string }) {
  const { path, s } = useSite();
  const tabs = [
    ...POST_TYPES.map((p) => ({ key: p.type, label: s(p.key), to: path(`/media/${p.type}`) })),
    { key: 'videos', label: s('videos'), to: path('/media/videos') },
    { key: 'podcasts', label: s('podcasts'), to: path('/media/podcasts') },
    { key: 'gallery', label: s('photoGallery'), to: path('/media/gallery') },
    { key: 'downloads', label: s('downloads'), to: path('/media/downloads') },
  ];

  return (
    <div className="no-scrollbar -mx-5 mb-9 flex gap-2 overflow-x-auto px-5">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          className={`shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition ${
            active === tab.key
              ? 'bg-magenta-500 text-white shadow-soft'
              : 'border border-plum-200 text-ink-muted hover:border-magenta-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

/* ---------------- post listings ---------------- */

export function MediaList() {
  const { type } = useParams();
  const { path, s } = useSite();
  const [page, setPage] = useState(1);

  const known = POST_TYPES.find((p) => p.type === type);
  const { data, loading, error, reload } = useApi<Paged<MediaPost>>(
    known ? `/api/site/media?type=${known.type}&page=${page}&limit=12` : null
  );

  if (!known) return <NotFound />;

  return (
    <>
      <PageHeader
        title={s(known.key)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('mediaCentre'), to: path('/media/news') },
          { label: s(known.key) },
        ]}
      />
      <Section tone="mist">
        <Container>
          <MediaTabs active={known.type} />
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
  const { lang, path, s } = useSite();
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
        <Container className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-muted">
            <span>
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
            <p className="mb-7 border-s-4 border-magenta-300 ps-5 text-[16px] font-medium leading-relaxed text-ink/80">
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
                <span
                  key={tag}
                  className="rounded-full bg-magenta-50 px-3 py-1 text-[12px] font-medium text-magenta-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {data.downloads?.length > 0 && (
            <div className="mt-10 rounded-3xl border border-plum-100 bg-white p-6 shadow-soft">
              <h3 className="mb-4 font-display text-base font-semibold">{s('downloads')}</h3>
              <ul className="space-y-2">
                {data.downloads.map((file, i) => (
                  <li key={i}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-magenta-50"
                    >
                      <Download size={15} className="shrink-0 text-magenta-600" />
                      <span className="min-w-0 flex-1 truncate">
                        {t(file.title, lang) || file.url.split('/').pop()}
                      </span>
                      {file.sizeBytes > 0 && (
                        <span className="shrink-0 text-[11px] text-ink-faint">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.gallery?.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-4 font-display text-base font-semibold">{s('gallery')}</h3>
              <GalleryGrid items={data.gallery} />
            </div>
          )}
        </Container>
      </Section>

      {data.related && data.related.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading eyebrow={s('mediaCentre')} title={s('relatedPosts')} />
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
  const { path, s } = useSite();
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const { data, loading, error, reload } = useApi<Paged<VideoItem>>(
    `/api/site/videos?kind=${kind}&page=${page}&limit=12`
  );

  const label = kind === 'podcast' ? s('podcasts') : s('videos');

  return (
    <>
      <PageHeader
        title={label}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('mediaCentre'), to: path('/media/news') },
          { label },
        ]}
      />
      <Section tone="mist">
        <Container>
          <MediaTabs active={kind === 'podcast' ? 'podcasts' : 'videos'} />
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
  const { path, s } = useSite();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paged<Album>>(
    `/api/site/albums?page=${page}&limit=12`
  );

  return (
    <>
      <PageHeader
        title={s('photoGallery')}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('mediaCentre'), to: path('/media/news') },
          { label: s('photoGallery') },
        ]}
      />
      <Section tone="mist">
        <Container>
          <MediaTabs active="gallery" />
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
  const { lang, path, s } = useSite();
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
          { label: s('photoGallery'), to: path('/media/gallery') },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist">
        <Container>
          {data.eventDate && (
            <p className="mb-6 text-[13px] uppercase tracking-wider text-magenta-500">
              {formatDate(data.eventDate, lang)}
            </p>
          )}
          {data.items?.length ? <GalleryGrid items={data.items} /> : <EmptyState />}
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
  const { path, s } = useSite();
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useApi<{ items: DownloadItem[] }>(
    `/api/site/downloads${category ? `?category=${category}` : ''}`
  );

  return (
    <>
      <PageHeader
        title={s('downloads')}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('mediaCentre'), to: path('/media/news') },
          { label: s('downloads') },
        ]}
      />
      <Section tone="mist">
        <Container>
          <MediaTabs active="downloads" />

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
