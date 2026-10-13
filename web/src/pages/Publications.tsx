import { useState } from 'react';
import { useParams } from 'react-router';
import { Download, ExternalLink as ExternalLinkIcon, ShoppingBag } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDate } from '../lib/format';
import {
  Button,
  Container,
  ContentPanel,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  PanelSection,
  RichText,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { DetailSkeleton, ListSkeleton } from '../components/PageSkeletons';
import { PublicationCard } from '../components/Cards';
import { useViewMode } from '../lib/view';
import NotFound from './NotFound';
import type { Paged, Publication } from '../lib/types';

const TYPES = [
  { value: '', key: 'all' },
  { value: 'book', key: 'books' },
  { value: 'article', key: 'articles' },
  { value: 'booklet', key: 'booklets' },
  { value: 'pdf', key: 'pdfLibrary' },
];

export function PublicationsIndex() {
  const { path, s, pageTitle } = useSite();
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { view } = useViewMode();
  const { data, loading, error, reload } = useApi<Paged<Publication>>(
    `/api/site/publications?page=${page}&limit=12${type ? `&type=${type}` : ''}`
  );

  return (
    <>
      <PageHeader
        compact
        title={pageTitle('publications')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('publications') }]}
      />
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          <ViewToggle />
          <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-8 sm:gap-2">
            {TYPES.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setType(item.value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition sm:px-4 sm:py-2 sm:text-[13px] ${
                  type === item.value
                    ? 'bg-magenta-500 text-white'
                    : 'border border-plum-200 text-ink-muted hover:border-magenta-300'
                }`}
              >
                {s(item.key)}
              </button>
            ))}
          </div>

          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className={`grid gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 ${view === 'list' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {data.items.map((p) => (
                  <PublicationCard key={p._id} publication={p} view={view} />
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

export function PublicationDetail() {
  const { slug } = useParams();
  const { lang, path, s, pageTitle } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Publication>(
    slug ? `/api/site/publications/${slug}` : null
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

  return (
    <>
      <PageHeader
        compact
        title={t(data.title, lang)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('publications'), to: path('/publications') },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          {/* One content card: cover and actions in the side column; details,
              description and text as the main content */}
          <ContentPanel
            asideStart
            aside={
              <>
                {data.coverImage ? (
                  <img src={data.coverImage} alt="" className="mx-auto w-full max-w-[150px] rounded-lg shadow-lift sm:max-w-[240px] sm:rounded-xl lg:max-w-none" />
                ) : (
                  <div className="mx-auto aspect-[3/4] w-full max-w-[150px] rounded-lg bg-magenta-50 sm:max-w-[240px] sm:rounded-xl lg:max-w-none" />
                )}
                <div className="space-y-2">
                  {data.fileUrl && (
                    <Button href={data.fileUrl} className="w-full">
                      <Download size={15} />
                      {s('download')}
                    </Button>
                  )}
                  {data.externalUrl && (
                    <Button href={data.externalUrl} variant="outline" className="w-full">
                      <ExternalLinkIcon size={15} />
                      {s('readOnline')}
                    </Button>
                  )}
                  {data.purchaseUrl && (
                    <Button href={data.purchaseUrl} variant="primary" className="w-full">
                      <ShoppingBag size={15} />
                      {s('buy')}
                      {data.price ? ` · ₹${data.price}` : ''}
                    </Button>
                  )}
                </div>
              </>
            }
          >
            <PanelSection>
              <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-b border-plum-100/80 pb-3 text-[13px] sm:mb-7 sm:grid-cols-4 sm:gap-4 sm:pb-6 sm:text-sm">
                {t(data.author, lang) && (
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-wider text-ink-faint sm:text-[11px]">{s('author')}</dt>
                    <dd className="mt-0.5 font-medium sm:mt-1">{t(data.author, lang)}</dd>
                  </div>
                )}
                {t(data.publisher, lang) && (
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-wider text-ink-faint sm:text-[11px]">{s('publisher')}</dt>
                    <dd className="mt-0.5 font-medium sm:mt-1">{t(data.publisher, lang)}</dd>
                  </div>
                )}
                {data.pages ? (
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-wider text-ink-faint sm:text-[11px]">{s('pages')}</dt>
                    <dd className="mt-0.5 font-medium sm:mt-1">{data.pages}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wider text-ink-faint sm:text-[11px]">{s('publishedOn')}</dt>
                  <dd className="mt-0.5 font-medium sm:mt-1">{formatDate(data.publishedAt, lang)}</dd>
                </div>
              </dl>

              {t(data.description, lang) && (
                <p className="user-text mb-3 text-[13.5px] leading-relaxed text-ink/85 sm:mb-6 sm:text-[15px]">{t(data.description, lang)}</p>
              )}

              <RichText html={t(data.body, lang)} />
            </PanelSection>
          </ContentPanel>
        </Container>
      </Section>
    </>
  );
}
