import { useSearchParams } from 'react-router';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  EmptyState,
  ErrorState,
  GradientText,
  ManagedSectionHeading,
  PageHeader,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { ListSkeleton } from '../components/PageSkeletons';
import { LeaderCard } from '../components/Cards';
import { useViewMode } from '../lib/view';
import type { Leader, LeaderCategory } from '../lib/types';

/** Tab order; the labels come from the UI strings of the same name */
const CATEGORIES: { key: LeaderCategory; label: string }[] = [
  { key: 'state', label: 'stateLeaders' },
  { key: 'district', label: 'districtLeaders' },
  // Saved as `party` (the category's stored value); shown as "Past Leaders"
  { key: 'party', label: 'pastLeaders' },
];

export default function Leaders() {
  const { lang, path, s, pageTitle, h } = useSite();
  const { view } = useViewMode();
  // The chosen category lives in the URL (?category=district) so a refresh or a shared
  // link lands on the same tab; an unknown value falls back to State leaders.
  const [params, setParams] = useSearchParams();
  const requested = params.get('category');
  const category: LeaderCategory = CATEGORIES.some((c) => c.key === requested)
    ? (requested as LeaderCategory)
    : 'state';
  const selectCategory = (next: LeaderCategory) =>
    setParams(next === 'state' ? {} : { category: next }, { replace: true });

  // State and District show who is serving now. Past Leaders gathers everyone whose term
  // is over, whichever group they served in, so it asks for the whole list.
  const isPastTab = category === 'party';
  const { data, loading, error, reload } = useApi<{ current: Leader[]; past: Leader[] }>(
    isPastTab ? '/api/site/leaders' : `/api/site/leaders?category=${category}`
  );

  // The API already narrows the list to the chosen category; this keeps the tab correct
  // against an older backend that ignores the parameter (no category counts as State).
  const inCategory = (l: Leader) => (l.category ?? 'state') === category;
  const current = isPastTab ? [] : (data?.current ?? []).filter(inCategory);
  // A leader filed under Past Leaders belongs here even if still marked as current
  const past = isPastTab ? [...(data?.past ?? []), ...(data?.current ?? []).filter(inCategory)] : [];
  const posters = past.filter((l) => l.posterImage);
  const pastWithoutPoster = past.filter((l) => !l.posterImage);
  /* Each card is a fixed share of the row (the calc() subtracts the gaps), so a flex row
     that wraps keeps every column the same width and `justify-center` centres a last row
     that is not full: 3 a row on phones (1 in list view), 4 on tablets, 5 on desktop. */
  const row = 'flex flex-wrap justify-center gap-2 sm:gap-4 xl:gap-5';
  const cell = `${
    view === 'list' ? 'w-full' : 'w-[calc((100%-1rem)/3)]'
  } sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)] xl:w-[calc((100%-5rem)/5)]`;

  return (
    <>
      {/* The same page banner as the other listing pages (Programs, Events, Departments) */}
      <PageHeader
        title={pageTitle('leaders')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('leaders') }]}
      />
      <Section tone="mist">
        <Container>
          {/* One wide panel holds the tabs and every leaders section. Its width is capped so
              the five-a-row cards stay one size on every desktop, however wide the site is. */}
          <div className="mx-auto max-w-[1216px] rounded-2xl border border-plum-100 bg-white p-3 shadow-soft sm:rounded-2xl sm:p-6 lg:p-8">
            <div
              role="tablist"
              aria-label={h('leaderCategories')}
              className="mb-4 flex flex-wrap justify-center gap-1.5 sm:mb-8 sm:gap-2"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={category === c.key}
                  onClick={() => selectCategory(c.key)}
                  className={`rounded-full px-3.5 py-1.5 type-body-sm font-semibold transition sm:px-5 sm:py-2.5 ${
                    category === c.key
                      ? 'bg-magenta-500 text-white shadow-soft'
                      : 'border border-plum-200 bg-white text-ink-muted hover:border-magenta-300'
                  }`}
                >
                  {h(c.label)}
                </button>
              ))}
            </div>
            {loading ? (
              <ListSkeleton variant="people" count={5} />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !current.length && !past.length ? (
              <EmptyState />
            ) : (
              <div role="tabpanel">
                <ViewToggle />
                {current.length > 0 && (
                  <>
                    <ManagedSectionHeading
                      sectionKey="leadersCurrent"
                      eyebrow={h('leaders')}
                      title={h('currentLeadership')}
                      align="center"
                    />
                    <div className={row}>
                      {current.map((leader) => (
                        <LeaderCard key={leader._id} leader={leader} view={view} className={cell} />
                      ))}
                    </div>
                  </>
                )}

                {(posters.length > 0 || pastWithoutPoster.length > 0) && (
                  <div>
                    <ManagedSectionHeading
                      sectionKey="leadersPast"
                      eyebrow={h('leaders')}
                      title={h('pastLeadership')}
                      align="center"
                    />

                    {posters.length > 0 && (
                      <div className={row}>
                        {posters.map((leader) => (
                          <figure
                            key={leader._id}
                            className={`${cell} card-hover group overflow-hidden rounded-xl border border-plum-100 bg-white shadow-soft hover:border-magenta-200 sm:block sm:rounded-2xl ${
                              view === 'list' ? 'flex items-center' : ''
                            }`}
                          >
                            {/* Clips the poster's hover zoom so it never covers the caption */}
                            <div className={`card-sheen ${view === 'list' ? 'h-16 w-16 shrink-0' : ''}`}>
                              <img
                                src={leader.posterImage}
                                alt={t(leader.name, lang)}
                                loading="lazy"
                                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                  view === 'list' ? 'h-full' : ''
                                }`}
                              />
                            </div>
                            <figcaption className={`sm:p-3 ${view === 'list' ? 'min-w-0 flex-1 p-2.5 text-start' : 'card-rule p-1.5 text-center'} sm:text-center`}>
                              <div className="type-title max-sm:type-tile">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {leader.termLabel && (
                                <div className="type-meta mt-0.5 uppercase tracking-wider text-magenta-500 max-sm:type-micro sm:mt-1">
                                  {leader.termLabel}
                                </div>
                              )}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}

                    {pastWithoutPoster.length > 0 && (
                      <ul className="mx-auto mt-3 max-w-4xl divide-y divide-plum-100 overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-soft sm:mt-6 sm:rounded-2xl">
                        {pastWithoutPoster.map((leader) => (
                          <li key={leader._id} className="flex items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-4">
                            <div className="min-w-0">
                              <div className="type-title">
                                <GradientText>{t(leader.name, lang)}</GradientText>
                              </div>
                              {t(leader.designation, lang) && (
                                <div className="type-caption text-ink-muted">
                                  {t(leader.designation, lang)}
                                </div>
                              )}
                            </div>
                            {leader.termLabel && (
                              <span className="shrink-0 rounded-full bg-magenta-50 px-2.5 py-0.5 type-meta font-medium text-magenta-600 sm:px-3 sm:py-1">
                                {leader.termLabel}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
