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
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
  RichText,
  Section,
} from '../components/Primitives';
import { PublicationCard } from '../components/Cards';
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
  const { path, s } = useSite();
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paged<Publication>>(
    `/api/site/publications?page=${page}&limit=12${type ? `&type=${type}` : ''}`
  );

  return (
    <>
      <PageHeader
        title={s('publications')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('publications') }]}
      />
      <Section tone="mist">
        <Container>
          <div className="mb-8 flex flex-wrap gap-2">
            {TYPES.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setType(item.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
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
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((p) => (
                  <PublicationCard key={p._id} publication={p} />
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
  const { lang, path, s } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Publication>(
    slug ? `/api/site/publications/${slug}` : null
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
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('publications'), to: path('/publications') },
          { label: t(data.title, lang) },
        ]}
      />
      <Section tone="mist">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              {data.coverImage ? (
                <img
                  src={data.coverImage}
                  alt=""
                  className="w-full rounded-3xl border border-plum-100 shadow-lift"
                />
              ) : (
                <div className="aspect-[3/4] rounded-3xl bg-magenta-50" />
              )}

              <div className="mt-5 space-y-2.5">
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
            </div>

            <div className="min-w-0">
              <dl className="mb-7 grid grid-cols-1 gap-4 rounded-3xl border border-plum-100 bg-white p-5 text-sm shadow-soft min-[480px]:grid-cols-2 sm:grid-cols-3">
                {t(data.author, lang) && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                      {s('author')}
                    </dt>
                    <dd className="mt-1 font-medium">{t(data.author, lang)}</dd>
                  </div>
                )}
                {t(data.publisher, lang) && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                      {s('publisher')}
                    </dt>
                    <dd className="mt-1 font-medium">{t(data.publisher, lang)}</dd>
                  </div>
                )}
                {data.pages ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                      {s('pages')}
                    </dt>
                    <dd className="mt-1 font-medium">{data.pages}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                    {s('publishedOn')}
                  </dt>
                  <dd className="mt-1 font-medium">{formatDate(data.publishedAt, lang)}</dd>
                </div>
              </dl>

              {t(data.description, lang) && (
                <p className="mb-6 text-[15px] leading-relaxed text-ink/85">
                  {t(data.description, lang)}
                </p>
              )}

              <RichText html={t(data.body, lang)} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
