import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  EmptyState,
  ErrorState,
  GradientText,
  Loading,
  ManagedSectionHeading,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { LeaderCard } from '../components/Cards';
import { useViewMode } from '../lib/view';
import type { Leader } from '../lib/types';

export default function Leaders() {
  const { lang, pageTitle, h } = useSite();
  const { view } = useViewMode();
  const { data, loading, error, reload } = useApi<{ current: Leader[]; past: Leader[] }>(
    '/api/site/leaders'
  );

  const posters = (data?.past ?? []).filter((l) => l.posterImage);
  const pastWithoutPoster = (data?.past ?? []).filter((l) => !l.posterImage);
  const grid = `grid gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 ${view === 'list' ? 'grid-cols-1' : 'grid-cols-3'}`;

  return (
    <>
      {/* No page banner: the leaders start right under the site header */}
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-8">
        <Container>
          <h1 className="sr-only">{pageTitle('leaders')}</h1>
          {/* A narrower column keeps the cards compact */}
          <div className="mx-auto max-w-4xl">
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !data?.current.length && !data?.past.length ? (
              <EmptyState />
            ) : (
              <>
                <ViewToggle />
                {data.current.length > 0 && (
                  <>
                    <ManagedSectionHeading sectionKey="leadersCurrent" eyebrow={h('leaders')} title={h('currentLeadership')} />
                    <div className={grid}>
                      {data.current.map((leader) => (
                        <LeaderCard key={leader._id} leader={leader} view={view} />
                      ))}
                    </div>
                  </>
                )}

                {(posters.length > 0 || pastWithoutPoster.length > 0) && (
                  <div className="mt-6 sm:mt-10 md:mt-12">
                    <ManagedSectionHeading sectionKey="leadersPast" eyebrow={h('leaders')} title={h('pastLeadership')} />

                    {posters.length > 0 && (
                      <div className={grid}>
                        {posters.map((leader) => (
                          <figure
                            key={leader._id}
                            className={`overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft sm:block sm:rounded-2xl ${
                              view === 'list' ? 'flex items-center' : ''
                            }`}
                          >
                            <img
                              src={leader.posterImage}
                              alt={t(leader.name, lang)}
                              loading="lazy"
                              className={`object-cover sm:w-full ${view === 'list' ? 'h-16 w-16 shrink-0' : 'w-full'}`}
                            />
                            <figcaption className={`sm:p-3 ${view === 'list' ? 'min-w-0 flex-1 p-2.5 text-start' : 'p-1.5 text-center'} sm:text-center`}>
                              <div className="font-display text-[11px] font-semibold leading-tight sm:text-[14px] sm:leading-normal">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {leader.termLabel && (
                                <div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-magenta-500 sm:mt-1 sm:text-[12px]">
                                  {leader.termLabel}
                                </div>
                              )}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}

                    {pastWithoutPoster.length > 0 && (
                      <ul className="mt-3 divide-y divide-plum-100 overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-soft sm:mt-6 sm:rounded-3xl">
                        {pastWithoutPoster.map((leader) => (
                          <li key={leader._id} className="flex items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-4">
                            <div className="min-w-0">
                              <div className="font-display text-[13.5px] font-semibold sm:text-[15px]">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {t(leader.designation, lang) && (
                                <div className="text-[12px] text-ink-muted sm:text-[13px]">
                                  {t(leader.designation, lang)}
                                </div>
                              )}
                            </div>
                            {leader.termLabel && (
                              <span className="shrink-0 rounded-full bg-magenta-50 px-2.5 py-0.5 text-[11px] font-medium text-magenta-600 sm:px-3 sm:py-1 sm:text-[12px]">
                                {leader.termLabel}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
