import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, ChevronDown, Download, Target } from 'lucide-react';
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
  PageHeader,
  PanelSection,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { DetailSkeleton, ListSkeleton } from '../components/PageSkeletons';
import { useViewMode } from '../lib/view';
import ContentSections from '../components/ContentCards';
import FocusStrip from '../components/FocusStrip';
import NotFound from './NotFound';
import type { FocusArea, HomePayload, PageDoc } from '../lib/types';

const FOCUS_PANEL_ID = 'about-focus';

/**
 * The admin-managed Focus areas for the About Us page: the same content and the same
 * ON/OFF switch (`settings.sections.focusAreas`) as the home page Focus strip.
 * Empty while the switch is off (nothing is requested then), while loading, or when
 * there are no focus areas, so the page shows no Focus button in those cases.
 */
function useFocusAreas(): FocusArea[] {
  const { data: site } = useSite();
  const on = Boolean(site) && site?.settings.sections?.focusAreas !== false;
  const { data } = useApi<HomePayload>(on ? '/api/site/home' : null);
  if (!on || data?.settings?.sections?.focusAreas === false) return [];
  return data?.focusAreas ?? [];
}

export function WhoWeAreIndex() {
  const { lang, path, s, h } = useSite();
  const { view } = useViewMode();
  const row = view === 'list';
  const { data, loading, error, reload } = useApi<{ items: PageDoc[] }>(
    '/api/site/pages?section=who-we-are'
  );
  const focusAreas = useFocusAreas();
  const [focusOpen, setFocusOpen] = useState(false);
  const hasFocus = focusAreas.length > 0;
  const hasItems = !loading && !error && Boolean(data?.items.length);

  return (
    <>
      <PageHeader
        compact
        title={h('aboutUs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: h('aboutUs') }]}
      />
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          {hasFocus && (
            <>
              {/* Focus button; on phones it shares a row with the Cards/List switch */}
              <div className="mb-2.5 flex items-start justify-between gap-2 sm:mb-5">
                <button
                  type="button"
                  onClick={() => setFocusOpen((open) => !open)}
                  aria-expanded={focusOpen}
                  aria-controls={FOCUS_PANEL_ID}
                  className={`inline-flex h-[34px] items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-all active:scale-[0.97] sm:h-10 sm:gap-2 sm:px-5 sm:text-sm ${
                    focusOpen
                      ? 'bg-magenta-500 text-white shadow-pink hover:bg-magenta-600'
                      : 'border border-magenta-500/30 bg-white text-magenta-600 hover:bg-magenta-50'
                  }`}
                >
                  <Target size={15} />
                  {h('focus')}
                  <ChevronDown size={14} className={`transition-transform ${focusOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="ml-auto [&>div]:mb-0">{hasItems && <ViewToggle />}</div>
              </div>
              {focusOpen && (
                <div className="mb-3 sm:mb-6">
                  <FocusStrip id={FOCUS_PANEL_ID} areas={focusAreas} />
                </div>
              )}
            </>
          )}
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              {!hasFocus && <ViewToggle />}
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
