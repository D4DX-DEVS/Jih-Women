import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { LeaderCard } from '../components/Cards';
import type { Leader } from '../lib/types';

export default function Leaders() {
  const { lang, path, s } = useSite();
  const { data, loading, error, reload } = useApi<{ current: Leader[]; past: Leader[] }>(
    '/api/site/leaders'
  );

  const posters = (data?.past ?? []).filter((l) => l.posterImage);
  const pastWithoutPoster = (data?.past ?? []).filter((l) => !l.posterImage);

  return (
    <>
      <PageHeader
        title={s('leaders')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('leaders') }]}
      />
      <Section tone="mist">
        <Container>
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
                  <SectionHeading eyebrow={s('leaders')} title={s('currentLeadership')} />
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {data.current.map((leader) => (
                      <LeaderCard key={leader._id} leader={leader} />
                    ))}
                  </div>
                </>
              )}

              {(posters.length > 0 || pastWithoutPoster.length > 0) && (
                <div className="mt-16">
                  <SectionHeading eyebrow={s('leaders')} title={s('pastLeadership')} />

                  {posters.length > 0 && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {posters.map((leader) => (
                        <figure
                          key={leader._id}
                          className="overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
                        >
                          <img
                            src={leader.posterImage}
                            alt={t(leader.name, lang)}
                            loading="lazy"
                            className="w-full object-cover"
                          />
                          <figcaption className="p-4 text-center">
                            <div className="font-display text-[15px] font-semibold">
                              {t(leader.name, lang)}
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
                              {t(leader.name, lang)}
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
        </Container>
      </Section>
    </>
  );
}
