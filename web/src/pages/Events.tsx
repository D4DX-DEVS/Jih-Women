import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Calendar,
  Clock,
  Images,
  MapPin,
  Mic,
} from 'lucide-react';
import { useApi, apiPost } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatDateRange, validMedia } from '../lib/format';
import {
  Button,
  Container,
  ContentPanel,
  DownloadList,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  PanelAsideHeading,
  PanelSection,
  PersonRow,
  RichText,
  Section,
  ViewToggle,
} from '../components/Primitives';
import { DetailSkeleton, ListSkeleton } from '../components/PageSkeletons';
import { EventCard, GalleryGrid, PanelPoster } from '../components/Cards';
import { useViewMode } from '../lib/view';
import NotFound from './NotFound';
import type { OrgEvent, Paged } from '../lib/types';

/* Events per page: six full rows of three on desktop (nine of two on phones). */
const EVENTS_PER_PAGE = 18;

export function EventsIndex() {
  const { path, s, pageTitle } = useSite();
  const [page, setPage] = useState(1);
  const { view } = useViewMode();
  // One listing of every published event, upcoming and past together, latest date first
  const { data, loading, error, reload } = useApi<Paged<OrgEvent>>(
    `/api/site/events?scope=all&page=${page}&limit=${EVENTS_PER_PAGE}`
  );

  // The previous list stays on screen (dimmed) while the next one loads, then the new
  // one fades in; the grid is keyed by its events so it only replays when they change.
  const listKey = data?.items.map((event) => event._id).join('|') ?? '';
  /* Each card is a fixed share of the row (the calc() subtracts the gaps), so a flex row
     that wraps keeps every card the same width and `justify-center` centres a last row
     that is not full: 2 a row on phones (1 in list view), 3 from sm up, with the gaps
     widening on desktop so the three large posters keep some air between them. */
  const row = `flex flex-wrap justify-center sm:gap-4 lg:gap-6 xl:gap-8 ${view === 'list' ? 'gap-2.5' : 'gap-3'}`;
  const cell = `${
    view === 'list' ? 'w-full' : 'w-[calc((100%-0.75rem)/2)]'
  } sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4rem)/3)]`;

  return (
    <>
      <PageHeader
        title={pageTitle('events')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('events') }]}
      />
      <Section tone="mist">
        <Container>
          <ViewToggle />
          <div aria-busy={loading}>
            {loading && !data ? (
              <ListSkeleton variant="posters" count={6} />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !data?.items.length ? (
              <EmptyState />
            ) : (
              <>
                <div
                  key={listKey}
                  className={`animate-fade-in ${row} ${loading ? 'pointer-events-none opacity-50 transition-opacity' : ''}`}
                >
                  {data.items.map((event) => (
                    <EventCard key={event._id} event={event} view={view} className={cell} />
                  ))}
                </div>
                <Pagination page={data.page} pages={data.pages} onPage={setPage} />
              </>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

export function EventDetail() {
  const { slug } = useParams();
  const { lang, path, s, pageTitle, h } = useSite();
  const { data, loading, error, notFound, reload } = useApi<OrgEvent>(
    slug ? `/api/site/events/${slug}` : null
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

  const description = t(data.description, lang);
  // Beside the description the poster sits in the side column, as on programme pages.
  // An event that is only a poster keeps it as the main content.
  const posterAside = Boolean(data.posterImage && description);
  // An Event Poster may have no title: the page is then headed by the section name alone
  const name = t(data.title, lang);

  return (
    <>
      <PageHeader
        title={name || pageTitle('events')}
        description={t(data.summary, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('events'), to: path('/events') },
          ...(name ? [{ label: name }] : []),
        ]}
      />

      <Section tone="mist">
        <Container>
          {/* One content card: description, speakers and photos as sections; poster,
              date, time, venue, registration and downloads in the side column */}
          <ContentPanel
            aside={
              <>
                {posterAside && <PanelPoster src={data.posterImage} alt={name} />}
                <dl className="space-y-3 type-body-sm sm:space-y-4">
                  <div className="flex gap-3">
                    <Calendar size={16} className="mt-0.5 shrink-0 text-magenta-500" />
                    <div>
                      <dt className="type-overline tracking-wider text-ink-faint">{s('date')}</dt>
                      <dd className="mt-0.5 font-medium">{formatDateRange(data.startDate, data.endDate, lang)}</dd>
                    </div>
                  </div>
                  {data.timeLabel && (
                    <div className="flex gap-3">
                      <Clock size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="type-overline tracking-wider text-ink-faint">{s('time')}</dt>
                        <dd className="mt-0.5 font-medium">{data.timeLabel}</dd>
                      </div>
                    </div>
                  )}
                  {t(data.venue, lang) && (
                    <div className="flex gap-3">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="type-overline tracking-wider text-ink-faint">{s('venue')}</dt>
                        <dd className="mt-0.5 font-medium">{t(data.venue, lang)}</dd>
                        {data.mapUrl && (
                          <a
                            href={data.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block type-body-sm text-magenta-600 underline underline-offset-4"
                          >
                            Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </dl>

                {data.registrationUrl && (
                  <Button href={data.registrationUrl} variant="primary" className="w-full">
                    {s('registerNow')}
                  </Button>
                )}

                {data.registrationEnabled && !data.registrationUrl && <EventRegistrationForm slug={data.slug} />}

                {data.downloads?.length > 0 && (
                  <div>
                    <PanelAsideHeading>{h('downloads')}</PanelAsideHeading>
                    <DownloadList files={data.downloads} lang={lang} />
                  </div>
                )}
              </>
            }
          >
            {(data.posterImage || description) && (
              <PanelSection>
                {data.posterImage && !posterAside && (
                  <img src={data.posterImage} alt="" className="mb-4 w-full rounded-lg sm:mb-7 sm:rounded-xl" />
                )}
                <RichText html={description} />
              </PanelSection>
            )}

            {data.speakers?.length > 0 && (
              <PanelSection title={h('speakers')} icon={Mic}>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {data.speakers.map((person, i) => (
                    <PersonRow key={i} name={t(person.name, lang)} role={t(person.designation, lang)} photo={person.photo} />
                  ))}
                </div>
              </PanelSection>
            )}

            {validMedia(data.gallery).length > 0 && (
              <PanelSection title={h('gallery')} icon={Images}>
                <GalleryGrid items={data.gallery} />
              </PanelSection>
            )}
          </ContentPanel>
        </Container>
      </Section>
    </>
  );
}

function EventRegistrationForm({ slug }: { slug: string }) {
  const { s, h } = useSite();
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: '', place: '', notes: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await apiPost(`/api/site/events/${slug}/register`, form);
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (status === 'done') {
    return (
      <p className="rounded-xl bg-magenta-50 px-3 py-2.5 text-center type-body-sm font-medium text-plum-800 sm:px-4 sm:py-3">
        {s('registrationSent')}
      </p>
    );
  }

  const field = (key: keyof typeof form, label: string, required = false, type = 'text') => (
    <div>
      <label className="mb-1 block type-caption font-medium text-ink-muted sm:mb-1.5">
        {label}
        {required && <span className="ms-1 text-magenta-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 type-body-sm outline-none transition focus:border-magenta-500 sm:rounded-xl sm:px-3.5 sm:py-2.5"
      />
    </div>
  );

  return (
    <form onSubmit={submit}>
      <PanelAsideHeading>{h('register')}</PanelAsideHeading>
      <div className="space-y-2.5 sm:space-y-3">
        {field('name', s('yourName'), true)}
        {field('phone', s('yourPhone'), true, 'tel')}
        {field('email', s('yourEmail'), false, 'email')}
        {field('district', s('district'))}
        {field('place', s('place'))}
      </div>
      {error && <p className="mt-3 type-body-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === 'sending'} className="mt-4 w-full sm:mt-5">
        {status === 'sending' ? s('sending') : s('register')}
      </Button>
    </form>
  );
}
