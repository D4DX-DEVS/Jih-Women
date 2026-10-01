import { Link, useParams } from 'react-router';
import { ArrowRight, Download } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes } from '../lib/format';
import {
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Section,
} from '../components/Primitives';
import ContentCards from '../components/ContentCards';
import NotFound from './NotFound';
import type { PageDoc } from '../lib/types';

export function WhoWeAreIndex() {
  const { lang, path, s, h } = useSite();
  const { data, loading, error, reload } = useApi<{ items: PageDoc[] }>(
    '/api/site/pages?section=who-we-are'
  );

  return (
    <>
      <PageHeader
        compact
        title={h('aboutUs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: h('aboutUs') }]}
      />
      <Section tone="mist" className="pt-6 md:pt-9">
        <Container>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {data.items.map((page) => (
                <Link
                  key={page._id}
                  to={path(`/who-we-are/${page.slug}`)}
                  className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
                >
                  {page.heroImage && (
                    <div className="aspect-[16/7] overflow-hidden">
                      <img
                        src={page.heroImage}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="font-display text-xl font-semibold transition group-hover:text-magenta-600">
                      {t(page.title, 'en')}
                    </h2>
                    {t(page.summary, lang) && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                        {t(page.summary, lang)}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-magenta-600">
                      {h('readMore')}
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

export function PageDetail() {
  const { slug } = useParams();
  const { lang, path, s, h } = useSite();
  const { data, loading, error, notFound, reload } = useApi<PageDoc>(
    slug ? `/api/site/pages/${slug}` : null
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
        compact
        title={t(data.title, 'en')}
        description={t(data.summary, lang)}
        image={data.heroImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: h('aboutUs'), to: path('/who-we-are') },
          { label: t(data.title, 'en') },
        ]}
      />
      <Section tone="mist" className="pt-6 md:pt-9">
        <Container>
          <ContentCards html={t(data.body, lang)} />

          {data.downloads?.length > 0 && (
            <div className="mt-5 rounded-2xl border border-plum-100 bg-white p-5 shadow-soft sm:p-6 md:p-7">
              <h3 className="mb-4 font-display text-lg font-semibold">{h('downloads')}</h3>
              <ul className="space-y-2">
                {data.downloads.map((file, i) => (
                  <li key={i}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-plum-100 px-4 py-3 transition hover:border-magenta-300"
                    >
                      <Download size={17} className="shrink-0 text-magenta-600" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {t(file.title, lang) || file.url.split('/').pop()}
                      </span>
                      {file.sizeBytes > 0 && (
                        <span className="shrink-0 text-xs text-ink-faint">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
