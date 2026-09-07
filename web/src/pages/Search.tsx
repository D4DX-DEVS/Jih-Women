import { Link, useSearchParams } from 'react-router';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Section,
} from '../components/Primitives';
import type { SearchResult } from '../lib/types';

const KIND_LABEL: Record<string, string> = {
  media: 'news',
  publication: 'publications',
  event: 'events',
  page: 'whoWeAre',
  program: 'programs',
  department: 'departments',
};

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const { lang, path, s } = useSite();
  const { data, loading, error, reload } = useApi<{ results: SearchResult[] }>(
    query.length >= 2 ? `/api/site/search?q=${encodeURIComponent(query)}` : null
  );

  return (
    <>
      <PageHeader
        title={s('searchResults')}
        description={query ? `"${query}"` : undefined}
        breadcrumb={[{ label: s('home'), to: path('/') }, { label: s('search') }]}
      />
      <Section tone="mist">
        <Container className="max-w-3xl">
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.results.length ? (
            <EmptyState message={s('noResults')} />
          ) : (
            <ul className="divide-y divide-plum-100 overflow-hidden rounded-3xl border border-plum-100 bg-white shadow-soft">
              {data.results.map((result, i) => (
                <li key={`${result.kind}-${result.slug}-${i}`}>
                  <Link
                    to={path(result.path)}
                    className="flex min-w-0 items-center gap-4 px-5 py-4 transition hover:bg-magenta-50"
                  >
                    {result.coverImage ? (
                      <img
                        src={result.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-14 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="h-14 w-16 shrink-0 rounded-xl bg-magenta-50" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wider text-magenta-500">
                        {s(KIND_LABEL[result.kind] ?? result.kind)}
                      </span>
                      <span className="mt-0.5 block truncate font-display text-[15px] font-semibold">
                        {t(result.title, lang)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
