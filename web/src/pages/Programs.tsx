import { useState } from 'react';
import { useParams } from 'react-router';
import { Download, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { formatBytes, youtubeId, youtubeThumb } from '../lib/format';
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
import { GalleryGrid, ProgramCard } from '../components/Cards';
import NotFound from './NotFound';
import type { Program } from '../lib/types';

export function ProgramsIndex() {
  const { path, s } = useSite();
  const { data, loading, error, reload } = useApi<{ items: Program[] }>('/api/site/programs');

  const major = data?.items.filter((p) => p.isMajor) ?? [];
  const others = data?.items.filter((p) => !p.isMajor) ?? [];

  return (
    <>
      <PageHeader
        title={s('programs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('programs') }]}
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
            <>
              {major.length > 0 && (
                <>
                  <SectionHeading eyebrow={s('programs')} title={s('majorProgrammes')} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {major.map((p) => (
                      <ProgramCard key={p._id} program={p} />
                    ))}
                  </div>
                </>
              )}
              {others.length > 0 && (
                <div className="mt-14">
                  <SectionHeading eyebrow={s('programs')} title={s('otherProgrammes')} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {others.map((p) => (
                      <ProgramCard key={p._id} program={p} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

export function ProgramDetail() {
  const { slug } = useParams();
  const { lang, path, s } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Program>(
    slug ? `/api/site/programs/${slug}` : null
  );
  const [openVideo, setOpenVideo] = useState<string | null>(null);

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
          { label: s('programs'), to: path('/programs') },
          { label: t(data.title, lang) },
        ]}
      />

      {data.externalUrl && (
        <div className="border-b border-plum-100 bg-magenta-500/10">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
            <p className="text-sm text-ink-muted">
              {t(data.externalLabel, lang) || s('visitWebsite')}
            </p>
            <Button href={data.externalUrl} variant="primary" size="sm">
              {s('visitWebsite')}
              <ExternalLinkIcon size={15} />
            </Button>
          </Container>
        </div>
      )}

      <Section tone="mist">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {t(data.overview, lang) && (
                <>
                  <SectionHeading eyebrow={s('programs')} title={s('overview')} />
                  <RichText html={t(data.overview, lang)} />
                </>
              )}

              {data.objectives?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('objectives')} title={s('objectives')} />
                  <ul className="grid gap-3 sm:grid-cols-2">
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

              {data.schedule?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('schedule')} title={s('schedule')} />
                  <ol className="relative space-y-4 border-s-2 border-plum-100 ps-6">
                    {data.schedule.map((item, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -start-[1.9rem] top-2 h-3 w-3 rounded-full border-2 border-white bg-magenta-500" />
                        <div className="rounded-2xl border border-plum-100 bg-white p-5 shadow-soft">
                          {item.time && (
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-magenta-500">
                              {item.time}
                            </div>
                          )}
                          <h3 className="mt-1 font-display text-base font-semibold">
                            {t(item.title, lang)}
                          </h3>
                          {t(item.description, lang) && (
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                              {t(item.description, lang)}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {data.videos?.length > 0 && (
                <div className="mt-12">
                  <SectionHeading eyebrow={s('media')} title={s('videos')} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.videos.map((v, i) => {
                      const id = youtubeId(v.youtubeUrl);
                      return (
                        <button
                          key={i}
                          onClick={() => id && setOpenVideo(id)}
                          className="card-hover group overflow-hidden rounded-3xl border border-plum-100 bg-white text-start shadow-soft"
                        >
                          <div className="aspect-video overflow-hidden bg-plum-900">
                            {youtubeThumb(v.youtubeUrl) && (
                              <img
                                src={youtubeThumb(v.youtubeUrl)}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="line-clamp-2 font-display text-[15px] font-semibold">
                              {t(v.title, lang)}
                            </h3>
                          </div>
                        </button>
                      );
                    })}
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
              {data.logoUrl && (
                <div className="rounded-3xl border border-plum-100 bg-white p-6 text-center shadow-soft">
                  <img src={data.logoUrl} alt="" className="mx-auto h-20 w-auto object-contain" />
                </div>
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

      {openVideo && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/85 p-4"
          onClick={() => setOpenVideo(null)}
        >
          <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${openVideo}?autoplay=1&rel=0`}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
