import { useParams } from 'react-router';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Button,
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Section,
  ManagedSectionHeading,
  SectionHeading,
} from '../components/Primitives';
import { ProgramCard } from '../components/Cards';
import ContentCards from '../components/ContentCards';
import NotFound from './NotFound';
import type { Program } from '../lib/types';

export function ProgramsIndex() {
  const { path, s, pageTitle, h } = useSite();
  const { data, loading, error, reload } = useApi<{ items: Program[] }>('/api/site/programs');

  const major = data?.items.filter((p) => p.isMajor) ?? [];
  const others = data?.items.filter((p) => !p.isMajor) ?? [];

  return (
    <>
      <PageHeader
        compact
        titleSize="md"
        title={pageTitle('programs')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('programs') }]}
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
                  <ManagedSectionHeading size="sm" sectionKey="programsMajor" eyebrow={h('programs')} title={h('majorProgrammes')} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {major.map((p) => (
                      <ProgramCard key={p._id} program={p} />
                    ))}
                  </div>
                </>
              )}
              {others.length > 0 && (
                <div className="mt-14">
                  <ManagedSectionHeading size="sm" sectionKey="programsOther" eyebrow={h('programs')} title={h('otherProgrammes')} />
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
  const { lang, path, s, pageTitle, h } = useSite();
  const { data, loading, error, notFound, reload } = useApi<Program>(
    slug ? `/api/site/programs/${slug}` : null
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

  // Programme names are brand names, so the heading always uses the English title
  // (t() still falls back to Malayalam when no English title has been entered).
  // Every heading and label on the page is English; body text follows the site language.
  const title = t(data.title, 'en');
  const overview = t(data.overview, lang);
  // A programme page is its description plus logo. Objectives, schedule, gallery,
  // videos and downloads are no longer managed in the admin, so any values still
  // stored for them are not shown.
  const hasAside = Boolean(data.logoUrl || data.externalUrl);

  return (
    <>
      {/* No cover image behind the banner: programme covers are logos and banners, and
          faded behind the title their lettering read as stray text. The cover still shows
          on the programme's card. */}
      <PageHeader
        compact
        titleSize="md"
        title={title}
        description={t(data.tagline, lang)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('programs'), to: path('/programs') },
          { label: title },
        ]}
      />

      {data.externalUrl && (
        <div className="border-b border-plum-100 bg-magenta-500/10">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
            <p className="text-sm text-ink-muted">{t(data.externalLabel, 'en') || s('visitWebsite')}</p>
            <Button href={data.externalUrl} variant="primary" size="sm">
              {s('visitWebsite')}
              <ExternalLinkIcon size={15} />
            </Button>
          </Container>
        </div>
      )}

      <Section tone="mist">
        <Container>
          {/* Heading and cards share one column, so their left edges line up */}
          <div className={`grid gap-8 lg:gap-10 ${hasAside ? 'lg:grid-cols-[minmax(0,1fr)_220px]' : ''}`}>
            <div className="min-w-0">
              {overview ? (
                <section>
                  <SectionHeading size="sm" eyebrow={title} title={h('overview')} />
                  <ContentCards size="sm" html={overview} />
                </section>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Not sticky: a sticky box is its own stacking context, which would stop the
                logo's multiply blend from reaching the page background */}
            {hasAside && (
              <aside className="min-w-0">
                {/* A small supporting mark, not a card: the logo at its own proportions
                    (wide logos scale down by width, tall ones by height) with the name under it */}
                <div className="flex flex-col items-center text-center">
                  {data.logoUrl && (
                    <div className="flex h-16 w-full max-w-[180px] items-center justify-center md:h-20">
                      <img
                        src={data.logoUrl}
                        alt={title}
                        /* multiply lets white or near-white logo backgrounds melt into the page */
                        className="h-auto max-h-full w-auto max-w-full object-contain mix-blend-multiply brightness-[1.04]"
                      />
                    </div>
                  )}
                  <p className="user-text mt-2.5 text-[13px] font-semibold text-plum-800">{title}</p>
                  {data.externalUrl && (
                    <Button href={data.externalUrl} variant="outline" size="sm" className="mt-3">
                      {s('visitWebsite')}
                      <ExternalLinkIcon size={14} />
                    </Button>
                  )}
                </div>
              </aside>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
