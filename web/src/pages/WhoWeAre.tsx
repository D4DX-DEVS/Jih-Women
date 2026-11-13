import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Download,
  History as HistoryIcon,
  Lightbulb,
  ScrollText,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
} from '../components/Primitives';
import { DetailSkeleton, ListSkeleton } from '../components/PageSkeletons';
import ContentSections from '../components/ContentCards';
import FocusStrip from '../components/FocusStrip';
import NotFound from './NotFound';
import type { FocusArea, HomePayload, PageDoc } from '../lib/types';

const FOCUS_PANEL_ID = 'about-focus';
/* The About Us page whose attached files are never listed for download */
const NO_DOWNLOADS_SLUG = 'constitution';

/* Icon of each card's banner */
const PAGE_ICONS: Record<string, LucideIcon> = {
  history: HistoryIcon,
  ideology: Lightbulb,
  objectives: Target,
  constitution: ScrollText,
};

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
  const { path, s, h } = useSite();
  const { data, loading, error, reload } = useApi<{ items: PageDoc[] }>(
    '/api/site/pages?section=who-we-are'
  );
  const focusAreas = useFocusAreas();
  const [focusOpen, setFocusOpen] = useState(false);
  const hasFocus = focusAreas.length > 0;

  return (
    <>
      <PageHeader
        title={h('aboutUs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: h('aboutUs') }]}
      />
      <Section tone="mist">
        <Container>
          {hasFocus && (
            <>
              {/* Focus button */}
              <div className="mb-2.5 flex items-start justify-between gap-2 sm:mb-5">
                <button
                  type="button"
                  onClick={() => setFocusOpen((open) => !open)}
                  aria-expanded={focusOpen}
                  aria-controls={FOCUS_PANEL_ID}
                  className={`inline-flex h-[34px] items-center gap-1.5 rounded-full px-4 type-body-sm font-medium transition-all active:scale-[0.97] sm:h-10 sm:gap-2 sm:px-5 ${
                    focusOpen
                      ? 'bg-magenta-500 text-white shadow-pink hover:bg-magenta-600'
                      : 'border border-magenta-500/30 bg-white text-magenta-600 hover:bg-magenta-50'
                  }`}
                >
                  <Target size={15} />
                  {h('focus')}
                  <ChevronDown size={14} className={`transition-transform ${focusOpen ? 'rotate-180' : ''}`} />
                </button>
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
            /* Four equal cards a row on desktop, two on tablets, one on phones. Every card is an
               icon on the brand gradient, the section name centred, and Read More at the bottom left. */
            <div className="grid grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {data.items.map((page) => {
                const Icon = PAGE_ICONS[page.slug] ?? BookOpen;
                return (
                  <Link
                    key={page._id}
                    to={path(`/who-we-are/${page.slug}`)}
                    className="card-hover group flex h-full flex-col overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft sm:rounded-2xl"
                  >
                    {/* Every card has the same icon banner */}
                    <div className="grid aspect-[2/1] place-items-center bg-gradient-to-br from-plum-700 to-magenta-500 text-white/90">
                      <Icon size={40} strokeWidth={1.5} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                      <h2 className="text-center type-title-lg transition group-hover:text-magenta-600">
                        <GradientText>{t(page.title, 'en')}</GradientText>
                      </h2>
                      <div className="mt-auto pt-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-magenta-500 px-4 py-1.5 type-caption font-semibold text-white shadow-pink transition group-hover:bg-magenta-600">
                          {h('readMore')}
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
        title={t(data.title, 'en')}
        description={t(data.summary, lang)}
        image={data.heroImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: h('aboutUs'), to: path('/who-we-are') },
          { label: t(data.title, 'en') },
        ]}
      />
      <Section tone="mist">
        <Container>
          {/* One content card: the page's own sections, then its downloads. The
              Constitution page is read on the site only, so it offers no download. */}
          <ContentPanel>
            <ContentSections html={t(data.body, lang)} />
            {data.slug !== NO_DOWNLOADS_SLUG && data.downloads?.length > 0 && (
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
