import { useParams } from 'react-router';
import { Download, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes } from '../lib/format';
import {
  Button,
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  RichText,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { DepartmentCard, GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { Department } from '../lib/types';

export function DepartmentsIndex() {
  const { path, s } = useSite();
  const { data, loading, error, reload } = useApi<{ items: Department[] }>('/api/site/departments');

  return (
    <>
      <PageHeader
        title={s('departments')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('departments') }]}
      />
      <Section tone="mist">
        <Container>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items.length ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((d) => (
                <DepartmentCard key={d._id} department={d} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

export function DepartmentDetail() {
  const { slug } = useParams();
  const { lang, path, s } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Department>(
    slug ? `/api/site/departments/${slug}` : null
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
        description={t(data.tagline, lang)}
        image={data.coverImage}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: s('departments'), to: path('/departments') },
          { label: t(data.title, lang) },
        ]}
      />

      <Section tone="mist">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {t(data.about, lang) && (
                <>
                  <SectionHeading eyebrow={s('about')} title={s('about')} />
                  <RichText html={t(data.about, lang)} />
                </>
              )}

              {data.objectives?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('objectives')} title={s('objectives')} />
                  <ul className="space-y-3">
                    {data.objectives.map((o, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-2xl border border-plum-100 bg-white p-4 shadow-soft"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-magenta-50 text-[13px] font-semibold text-magenta-600">
                          {i + 1}
                        </span>
                        <span className="text-[15px] leading-relaxed text-ink/85">
                          {t(o.text, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.activities?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('activities')} title={s('activities')} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data.activities.map((a, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft"
                      >
                        {a.image && (
                          <img src={a.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                        )}
                        <div className="p-5">
                          <h3 className="font-display text-base font-semibold">{t(a.title, lang)}</h3>
                          {t(a.description, lang) && (
                            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                              {t(a.description, lang)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.leadership?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('leadership')} title={s('leadership')} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.leadership.map((person, i) => (
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

              {data.posters?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('media')} title={s('posters')} />
                  <GalleryGrid items={data.posters} />
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
              {data.logoUrl && (
                <div className="rounded-3xl border border-plum-100 bg-white p-6 text-center shadow-soft">
                  <img src={data.logoUrl} alt="" className="mx-auto h-20 w-auto object-contain" />
                </div>
              )}

              {data.externalUrl && (
                <Button href={data.externalUrl} variant="outline" className="w-full">
                  {s('visitWebsite')}
                  <ExternalLinkIcon size={15} />
                </Button>
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
