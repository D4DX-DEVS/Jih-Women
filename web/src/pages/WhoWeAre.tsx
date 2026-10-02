import { Link, useParams } from 'react-router';
import { ArrowRight, Download } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  ContentPanel,
  DownloadList,
  EmptyState,
  ErrorState,
  GradientText,
  Loading,
  PageHeader,
  PanelSection,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { useViewMode } from '../lib/view';
import ContentSections from '../components/ContentCards';
import NotFound from './NotFound';
import type { PageDoc } from '../lib/types';

export function WhoWeAreIndex() {
  const { lang, path, s, h } = useSite();
  const { view } = useViewMode();
  const row = view === 'list';
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
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <ViewToggle />
              <div className={`grid gap-2 sm:grid-cols-1 sm:gap-5 md:grid-cols-2 ${row ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {data.items.map((page) => (
                  <Link
                    key={page._id}
                    to={path(`/who-we-are/${page.slug}`)}
                    className={`card-hover group flex overflow-hidden border border-plum-100 bg-white shadow-soft sm:flex-col sm:rounded-3xl ${
                      row ? 'rounded-xl' : 'flex-col rounded-lg'
                    }`}
                  >
                    {page.heroImage && (
                      <div
                        className={`relative overflow-hidden sm:aspect-[16/7] ${
                          row ? 'w-[7.5rem] shrink-0 self-stretch sm:w-auto sm:self-auto' : 'aspect-[4/3]'
                        }`}
                      >
                        <img
                          src={page.heroImage}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className={`min-w-0 flex-1 sm:p-6 ${row ? 'self-center p-2.5' : 'p-1.5'}`}>
                      <h2 className={`font-display font-semibold transition group-hover:text-magenta-600 sm:text-xl ${row ? 'text-[13.5px]' : 'text-[11.5px] leading-tight'}`}>
                        <GradientText>{t(page.title, 'en')}</GradientText>
                      </h2>
                      {t(page.summary, lang) && (
                        <p className={`leading-relaxed text-ink-muted sm:mt-2 sm:line-clamp-3 sm:block sm:text-sm ${row ? 'mt-0.5 line-clamp-2 text-[11.5px]' : 'hidden'}`}>
                          {t(page.summary, lang)}
                        </p>
                      )}
                      <span className={`items-center font-semibold text-magenta-600 sm:mt-4 sm:inline-flex sm:gap-1.5 sm:text-[13px] ${row ? 'mt-1.5 inline-flex gap-1 text-[11.5px]' : 'hidden'}`}>
                        {h('readMore')}
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
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
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          {/* One content card: the page's own sections, then its downloads */}
          <ContentPanel>
            <ContentSections html={t(data.body, lang)} />
            {data.downloads?.length > 0 && (
              <PanelSection title={h('downloads')} icon={Download}>
                <DownloadList files={data.downloads} lang={lang} />
              </PanelSection>
            )}
          </ContentPanel>
        </Container>
      </Section>
    </>
  );
}
