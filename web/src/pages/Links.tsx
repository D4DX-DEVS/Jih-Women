import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import {
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Section,
  SectionHeading,
} from '../components/Primitives';
import { LinkCard } from '../components/Cards';
import { isExternalUrl } from '../lib/format';
import type { ExternalLink } from '../lib/types';

const GROUPS: { category: ExternalLink['category']; key: string }[] = [
  { category: 'official-portal', key: 'officialPortals' },
  { category: 'affiliated-initiative', key: 'affiliated' },
  { category: 'institution', key: 'institutions' },
];

export default function Links() {
  const { path, s, pageTitle, h } = useSite();
  const { data, loading, error, reload } = useApi<{ items: ExternalLink[] }>(
    '/api/site/external-links'
  );
  const links = (data?.items ?? []).filter((link) => isExternalUrl(link.url));

  return (
    <>
      <PageHeader
        title={pageTitle('externalLinks')}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: pageTitle('externalLinks') }]}
      />
      <Section tone="mist">
        <Container>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !links.length ? (
            <EmptyState />
          ) : (
            GROUPS.map((group) => {
              const items = links.filter((l) => l.category === group.category);
              if (!items.length) return null;
              return (
                <div key={group.category} className="mb-14 last:mb-0">
                  <SectionHeading eyebrow={h('externalLinks')} title={h(group.key)} />
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((link) => (
                      <LinkCard key={link._id} link={link} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </Container>
      </Section>
    </>
  );
}
