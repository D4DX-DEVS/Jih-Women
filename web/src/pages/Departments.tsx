import { useParams } from 'react-router';
import {
  ExternalLink as ExternalLinkIcon,
  Images,
  Info,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Button,
  Container,
  ContentPanel,
  DownloadList,
  EmptyState,
  ErrorState,
  GradientText,
  Loading,
  PageHeader,
  PanelAsideHeading,
  PanelSection,
  PersonRow,
  RichText,
  Section,
} from '../components/Primitives';
import { DepartmentCard, GalleryGrid } from '../components/Cards';
import NotFound from './NotFound';
import type { Department } from '../lib/types';

export function DepartmentsIndex() {
  const { path, s, pageTitle } = useSite();
  const { data, loading, error, reload } = useApi<{ items: Department[] }>('/api/site/departments');

  return (
    <>
      <PageHeader
        compact
        titleSize="md"
        title={pageTitle('departments')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('departments') }]}
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
  const { lang, path, s, pageTitle, h } = useSite();
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

  // Headings and labels are always English (t() falls back to Malayalam when no
  // English value has been entered); body text follows the site language.
  const title = t(data.title, 'en');

  return (
    <>
      {/* Compact banner like the programme pages, and no cover image behind it: the
          covers carry large lettering that read as stray text behind the title */}
      <PageHeader
        compact
        titleSize="md"
        title={title}
        description={t(data.tagline, lang)}
        breadcrumb={[
          { label: s('home'), to: path('/') },
          { label: pageTitle('departments'), to: path('/departments') },
          { label: title },
        ]}
      />

      <Section tone="mist">
        <Container>
          {/* One content card: about, objectives, activities, people and media as
              sections; logo, website link and downloads in the side column */}
          <ContentPanel
            aside={
              data.logoUrl || data.externalUrl || data.downloads?.length > 0 ? (
                <>
                  {data.logoUrl && (
                    <div className="flex h-20 items-center justify-center">
                      <img src={data.logoUrl} alt="" className="h-auto max-h-full w-auto max-w-[180px] object-contain mix-blend-multiply" />
                    </div>
                  )}
                  {data.externalUrl && (
                    <Button href={data.externalUrl} variant="outline" size="sm" className="w-full">
                      {s('visitWebsite')}
                      <ExternalLinkIcon size={14} />
                    </Button>
                  )}
                  {data.downloads?.length > 0 && (
                    <div>
                      <PanelAsideHeading>{h('downloads')}</PanelAsideHeading>
                      <DownloadList files={data.downloads} lang="en" />
                    </div>
                  )}
                </>
              ) : undefined
            }
          >
            {t(data.about, lang) && (
              <PanelSection title={h('about')} icon={Info}>
                <RichText html={t(data.about, lang)} />
              </PanelSection>
            )}

            {data.objectives?.length > 0 && (
              <PanelSection title={h('objectives')} icon={Target}>
                <ol className="divide-y divide-plum-100/80">
                    {data.objectives.map((o, i) => (
                      <li key={i} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-magenta-500 to-plum-500 text-[12.5px] font-semibold text-white shadow-pink">
                          {i + 1}
                        </span>
                        <span className="user-text pt-0.5 text-[15px] leading-relaxed text-ink/85">{t(o.text, lang)}</span>
                      </li>
                    ))}
                  </ol>
              </PanelSection>
            )}

            {data.activities?.length > 0 && (
              <PanelSection title={h('activities')} icon={Sparkles}>
                <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                  {data.activities.map((a, i) => (
                    <div key={i} className="group min-w-0">
                      {a.image && (
                        <div className="mb-3 overflow-hidden rounded-xl">
                          <img
                            src={a.image}
                            alt=""
                            loading="lazy"
                            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}
                      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-plum-800">
                        <span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-magenta-500 to-plum-500" aria-hidden="true" />
                        <GradientText>{t(a.title, 'en')}</GradientText>
                      </h3>
                      {t(a.description, lang) && (
                        <p className="user-text mt-1.5 text-sm leading-relaxed text-ink-muted">{t(a.description, lang)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </PanelSection>
            )}

            {data.leadership?.length > 0 && (
              <PanelSection title={h('leadership')} icon={Users}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.leadership.map((person, i) => (
                    <PersonRow key={i} name={t(person.name, 'en')} role={t(person.designation, 'en')} photo={person.photo} />
                  ))}
                </div>
              </PanelSection>
            )}

            {data.posters?.length > 0 && (
              <PanelSection title={h('posters')} icon={Images}>
                <GalleryGrid items={data.posters} />
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
