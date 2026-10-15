import { useSearchParams } from 'react-router';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import {
  Container,
  EmptyState,
  ErrorState,
  PageHeader,
  Section,
  SectionHeading,
  ViewToggle,
} from '../components/Primitives';
import { ListSkeleton } from '../components/PageSkeletons';
import { LeaderCard } from '../components/Cards';
import { useViewMode } from '../lib/view';
import { groupLeadersByPeriod } from '../lib/leaders';
import type { Leader, LeaderCategory } from '../lib/types';

/** Tab order; the labels come from the UI strings of the same name */
const CATEGORIES: { key: LeaderCategory; label: string }[] = [
  { key: 'state', label: 'stateLeaders' },
  { key: 'district', label: 'districtLeaders' },
  // Saved as `party` (the category's stored value); shown as "Former Leaders"
  { key: 'party', label: 'pastLeaders' },
];

export default function Leaders() {
  const { path, s, pageTitle, h, section } = useSite();
  // The chosen category lives in the URL (?category=district) so a refresh or a shared
  // link lands on the same tab; an unknown value falls back to State leaders.
  const [params, setParams] = useSearchParams();
  const requested = params.get('category');
  const category: LeaderCategory = CATEGORIES.some((c) => c.key === requested)
    ? (requested as LeaderCategory)
    : 'state';
  const selectCategory = (next: LeaderCategory) =>
    setParams(next === 'state' ? {} : { category: next }, { replace: true });

  // Phones can switch between two-a-row cards and a one-a-row list; tablets and desktop
  // always show cards
  const { view } = useViewMode();

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

  // Current leaders are headed by the years of their latest period as entered in the
  // admin ("2024–2026"), newest first; a leader with several periods is listed once.
  const currentGroups = groupLeadersByPeriod(current);
  // Past leaders, most recent period first. On phones each period has its heading, as for
  // current leaders; from `sm` they share one grid without headings and each card lists
  // all of that person's periods.
  const pastGroups = groupLeadersByPeriod(past);
  // The small label above each period heading is the admin-managed section label
  const currentText = section('leadersCurrent', { label: h('leaders'), heading: h('currentLeadership') });
  const pastText = section('leadersPast', { label: h('leaders'), heading: h('pastLeadership') });

  /* Each card is a fixed share of the row (the calc() subtracts the gaps), so a flex row
     that wraps keeps every column the same width and `justify-center` centres a last row
     that is not full: 2 a row on phones (1 in list view), 3 on tablets, 4 on desktop. */
  const row = 'flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6';
  const cell = `${
    view === 'list' ? 'w-full' : 'w-[calc((100%-0.75rem)/2)]'
  } sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4.5rem)/4)]`;

  return (
    <>
      {/* The same page banner as the other listing pages (Programs, Events, Departments) */}
      <PageHeader
        title={pageTitle('leaders')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('leaders') }]}
      />
      <Section tone="mist">
        <Container>
          {/* Phones only (hidden from `sm`): the Cards / List switch, at the top as on other listings */}
          <ViewToggle />
          {/* One wide panel holds the tabs and every leaders section. Its width is capped so
              the four-a-row cards stay one size on every desktop, however wide the site is. */}
          <div className="mx-auto max-w-[1216px] rounded-2xl border border-plum-100 bg-white p-3 shadow-soft sm:rounded-2xl sm:p-6 lg:p-8">
            {/* On phones the three tabs share one row in equal thirds, with smaller type so
                none wraps; from `sm` they are the centred pills */}
            <div
              role="tablist"
              aria-label={h('leaderCategories')}
              className="mb-3 grid grid-cols-3 gap-1 sm:mb-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-2"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={category === c.key}
                  onClick={() => selectCategory(c.key)}
                  className={`min-h-9 min-w-0 whitespace-nowrap rounded-full px-1.5 py-1.5 type-body-sm font-semibold transition max-sm:type-meta sm:px-5 sm:py-2.5 ${
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
              <ListSkeleton variant="people" count={4} />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !current.length && !past.length ? (
              <EmptyState />
            ) : (
              <div role="tabpanel">
                <div className="space-y-8 sm:space-y-12">
                {currentGroups.map((group) => (
                  <section key={group.period || 'no-period'}>
                    {/* Leaders without a period come first, without a heading of their own */}
                    {group.period && (
                      <SectionHeading
                        eyebrow={currentText.label || undefined}
                        logo={currentText.logo || undefined}
                        title={group.period}
                        align="center"
                      />
                    )}
                    <div className={row}>
                      {group.leaders.map((leader) => (
                        <LeaderCard key={leader._id} leader={leader} view={view} className={cell} shownPeriod={group.period} />
                      ))}
                    </div>
                  </section>
                ))}

                {/* From `sm` the groups and their rows are `display: contents`, so every card
                    flows in this one grid as before and the phone-only headings are hidden */}
                {pastGroups.length > 0 && (
                  <div className="space-y-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 sm:space-y-0 lg:gap-6">
                    {pastGroups.map((group) => (
                      <section key={group.period || 'no-period'} className="sm:contents">
                        {group.period && (
                          <div className="sm:hidden">
                            <SectionHeading
                              eyebrow={pastText.label || undefined}
                              logo={pastText.logo || undefined}
                              title={group.period}
                              align="center"
                            />
                          </div>
                        )}
                        <div className={`${row} sm:contents`}>
                          {group.leaders.map((leader) => (
                            <LeaderCard
                              key={leader._id}
                              leader={leader}
                              view={view}
                              className={cell}
                              shownPeriodOnPhones={group.period}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
