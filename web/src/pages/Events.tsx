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
import { formatDateRange } from '../lib/format';
import {
  Button,
  Container,
  ContentPanel,
  DownloadList,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
  PanelAsideHeading,
  PanelSection,
  PersonRow,
  RichText,
  Section,
} from '../components/Primitives';
import { EventCard, GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { OrgEvent, Paged } from '../lib/types';

export function EventsIndex() {
  const { path, s, pageTitle } = useSite();
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paged<OrgEvent>>(
    `/api/site/events?scope=${scope}&page=${page}&limit=12`
  );

  const tabs: { key: 'upcoming' | 'past'; label: string }[] = [
    { key: 'upcoming', label: s('upcomingEvents') },
    { key: 'past', label: s('pastEvents') },
  ];

  return (
    <>
      <PageHeader
        title={pageTitle('events')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('events') }]}
      />
      <Section tone="mist">
        <Container>
          <div className="mb-8 flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setScope(tab.key);
                  setPage(1);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  scope === tab.key
                    ? 'bg-magenta-500 text-white shadow-soft'
                    : 'border border-plum-200 text-ink-muted hover:border-magenta-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {data.items.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onPage={setPage} />
            </>
          )}
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
        title={t(data.title, lang)}
        description={t(data.summary, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('events'), to: path('/events') },
          { label: t(data.title, lang) },
        ]}
      />

      <Section tone="mist">
        <Container>
          {/* One content card: poster, description, speakers and photos as sections;
              date, time, venue, registration and downloads in the side column */}
          <ContentPanel
            aside={
              <>
                <dl className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <Calendar size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{s('date')}</dt>
                      <dd className="mt-0.5 font-medium">{formatDateRange(data.startDate, data.endDate, lang)}</dd>
                    </div>
                  </div>
                  {data.timeLabel && (
                    <div className="flex gap-3">
                      <Clock size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{s('time')}</dt>
                        <dd className="mt-0.5 font-medium">{data.timeLabel}</dd>
                      </div>
                    </div>
                  )}
                  {t(data.venue, lang) && (
                    <div className="flex gap-3">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{s('venue')}</dt>
                        <dd className="mt-0.5 font-medium">{t(data.venue, lang)}</dd>
                        {data.mapUrl && (
                          <a
                            href={data.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-[13px] text-magenta-600 underline underline-offset-4"
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
            {(data.posterImage || t(data.description, lang)) && (
              <PanelSection>
                {data.posterImage && (
                  <img src={data.posterImage} alt="" className="mb-7 w-full rounded-xl" />
                )}
                <RichText html={t(data.description, lang)} />
              </PanelSection>
            )}

            {data.speakers?.length > 0 && (
              <PanelSection title={h('speakers')} icon={Mic}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.speakers.map((person, i) => (
                    <PersonRow key={i} name={t(person.name, lang)} role={t(person.designation, lang)} photo={person.photo} />
                  ))}
                </div>
              </PanelSection>
            )}

            {data.gallery?.length > 0 && (
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
      <p className="rounded-xl bg-magenta-50 px-4 py-3 text-center text-sm font-medium text-plum-800">
        {s('registrationSent')}
      </p>
    );
  }

  const field = (key: keyof typeof form, label: string, required = false, type = 'text') => (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-ink-muted">
        {label}
        {required && <span className="ms-1 text-magenta-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl border border-plum-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-magenta-500"
      />
    </div>
  );

  return (
    <form onSubmit={submit}>
      <PanelAsideHeading>{h('register')}</PanelAsideHeading>
      <div className="space-y-3">
        {field('name', s('yourName'), true)}
        {field('phone', s('yourPhone'), true, 'tel')}
        {field('email', s('yourEmail'), false, 'email')}
        {field('district', s('district'))}
        {field('place', s('place'))}
      </div>
      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
      <Button type="submit" disabled={status === 'sending'} className="mt-5 w-full">
        {status === 'sending' ? s('sending') : s('register')}
      </Button>
    </form>
  );
}
