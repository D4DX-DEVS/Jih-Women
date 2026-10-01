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
} from '../components/Primitives';
import { LeaderCard } from '../components/Cards';
import type { Leader } from '../lib/types';

export default function Leaders() {
  const { lang, pageTitle, h } = useSite();
  const { data, loading, error, reload } = useApi<{ current: Leader[]; past: Leader[] }>(
    '/api/site/leaders'
  );

  const posters = (data?.past ?? []).filter((l) => l.posterImage);
  const pastWithoutPoster = (data?.past ?? []).filter((l) => !l.posterImage);

  return (
    <>
      {/* No page banner: the leaders start right under the site header */}
      <Section tone="mist" className="pt-6 md:pt-8">
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
                {data.current.length > 0 && (
                  <>
                    <ManagedSectionHeading sectionKey="leadersCurrent" eyebrow={h('leaders')} title={h('currentLeadership')} />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                      {data.current.map((leader) => (
                        <LeaderCard key={leader._id} leader={leader} />
                      ))}
                    </div>
                  </>
                )}

                {(posters.length > 0 || pastWithoutPoster.length > 0) && (
                  <div className="mt-10 md:mt-12">
                    <ManagedSectionHeading sectionKey="leadersPast" eyebrow={h('leaders')} title={h('pastLeadership')} />

                    {posters.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                        {posters.map((leader) => (
                          <figure
                            key={leader._id}
                            className="overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-soft"
                          >
                            <img
                              src={leader.posterImage}
                              alt={t(leader.name, lang)}
                              loading="lazy"
                              className="w-full object-cover"
                            />
                            <figcaption className="p-3 text-center">
                              <div className="font-display text-[14px] font-semibold">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {leader.termLabel && (
                                <div className="mt-1 text-[12px] uppercase tracking-wider text-magenta-500">
                                  {leader.termLabel}
                                </div>
                              )}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}

                    {pastWithoutPoster.length > 0 && (
                      <ul className="mt-6 divide-y divide-plum-100 overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft">
                        {pastWithoutPoster.map((leader) => (
                          <li key={leader._id} className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="min-w-0">
                              <div className="font-display text-[15px] font-semibold">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {t(leader.designation, lang) && (
                                <div className="text-[13px] text-ink-muted">
                                  {t(leader.designation, lang)}
                                </div>
                              )}
                            </div>
                            {leader.termLabel && (
                              <span className="shrink-0 rounded-full bg-magenta-50 px-3 py-1 text-[12px] font-medium text-magenta-600">
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
