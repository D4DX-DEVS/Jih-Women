import { useState } from 'react';
import { useParams } from 'react-router';
import { Calendar, Clock, Download, MapPin } from 'lucide-react';
import { useApi, apiPost } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes, formatDateRange } from '../lib/format';
import {
  Button,
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
  RichText,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { EventCard, GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { OrgEvent, Paged } from '../lib/types';

export function EventsIndex() {
  const { path, s } = useSite();
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
        title={s('events')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('events') }]}
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
  const { lang, path, s } = useSite();
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
          { label: s('events'), to: path('/events') },
          { label: t(data.title, lang) },
        ]}
      />

      <Section tone="mist">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {data.posterImage && (
                <img
                  src={data.posterImage}
                  alt=""
                  className="mb-8 w-full rounded-3xl border border-plum-100 shadow-soft"
                />
              )}

              <RichText html={t(data.description, lang)} />

              {data.speakers?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('events')} title={s('speakers')} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.speakers.map((person, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 rounded-2xl border border-plum-100 bg-white p-4 shadow-soft"
                      >
                        {person.photo ? (
                          <img
                            src={person.photo}
                            alt=""
                            loading="lazy"
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-magenta-50 font-display font-semibold text-magenta-600">
                            {(t(person.name, lang) || '?').charAt(0)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-display text-[15px] font-semibold">
                            {t(person.name, lang)}
                          </div>
                          <div className="truncate text-[13px] text-ink-muted">
                            {t(person.designation, lang)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.gallery?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('media')} title={s('gallery')} />
                  <GalleryGrid items={data.gallery} />
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-plum-100 bg-white p-6 shadow-soft">
                <dl className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <Calendar size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                        {s('date')}
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {formatDateRange(data.startDate, data.endDate, lang)}
                      </dd>
                    </div>
                  </div>
                  {data.timeLabel && (
                    <div className="flex gap-3">
                      <Clock size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                          {s('time')}
                        </dt>
                        <dd className="mt-0.5 font-medium">{data.timeLabel}</dd>
                      </div>
                    </div>
                  )}
                  {t(data.venue, lang) && (
                    <div className="flex gap-3">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-magenta-500" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-faint">
                          {s('venue')}
                        </dt>
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
                  <Button href={data.registrationUrl} variant="primary" className="mt-6 w-full">
                    {s('registerNow')}
                  </Button>
                )}
              </div>

              {data.registrationEnabled && !data.registrationUrl && (
                <EventRegistrationForm slug={data.slug} />
              )}

              {data.downloads?.length > 0 && (
                <div className="rounded-3xl border border-plum-100 bg-white p-5 shadow-soft">
                  <h3 className="mb-3 font-display text-base font-semibold">{s('downloads')}</h3>
                  <ul className="space-y-2">
                    {data.downloads.map((file, i) => (
                      <li key={i}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-magenta-50"
                        >
                          <Download size={15} className="shrink-0 text-magenta-600" />
                          <span className="min-w-0 flex-1 truncate">
                            {t(file.title, lang) || file.url.split('/').pop()}
                          </span>
                          {file.sizeBytes > 0 && (
                            <span className="shrink-0 text-[11px] text-ink-faint">
                              {formatBytes(file.sizeBytes)}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

function EventRegistrationForm({ slug }: { slug: string }) {
  const { s } = useSite();
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
      <div className="rounded-3xl border border-magenta-200 bg-magenta-50 p-6 text-center">
        <p className="text-sm font-medium text-plum-800">{s('registrationSent')}</p>
      </div>
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
    <form onSubmit={submit} className="rounded-3xl border border-plum-100 bg-white p-6 shadow-soft">
      <h3 className="mb-4 font-display text-base font-semibold">{s('register')}</h3>
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
