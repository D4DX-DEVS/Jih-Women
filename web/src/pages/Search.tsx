import { Link, useSearchParams } from 'react-router';
import { useApi } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import {
  Container,
  EmptyState,
  ErrorState,
  GradientText,
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
  const { lang, path, s, pageTitle } = useSite();
  const { data, loading, error, reload } = useApi<{ results: SearchResult[] }>(
    query.length >= 2 ? `/api/site/search?q=${encodeURIComponent(query)}` : null
  );

  return (
    <>
      <PageHeader
        title={pageTitle('searchResults')}
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
            <ul className="divide-y divide-plum-100 overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-soft sm:rounded-3xl">
              {data.results.map((result, i) => (
                <li key={`${result.kind}-${result.slug}-${i}`}>
                  <Link
                    to={path(result.path)}
                    className="flex min-w-0 items-center gap-3 px-3 py-2.5 transition hover:bg-magenta-50 sm:gap-4 sm:px-5 sm:py-4"
                  >
                    {result.coverImage ? (
                      <img
                        src={result.coverImage}
                        alt=""
                        loading="lazy"
                        className={`h-11 w-[3.25rem] shrink-0 rounded-lg sm:h-14 sm:w-16 sm:rounded-xl ${
                          // programme results show a logo: keep it whole
                          result.kind === 'program' ? 'border border-plum-100 bg-white object-contain p-1.5' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <span className="h-11 w-[3.25rem] shrink-0 rounded-lg bg-magenta-50 sm:h-14 sm:w-16 sm:rounded-xl" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[10.5px] uppercase tracking-wider text-magenta-500 sm:text-[11px]">
                        {s(KIND_LABEL[result.kind] ?? result.kind)}
                      </span>
                      <span className="mt-0.5 block truncate font-display text-[13.5px] font-semibold sm:text-[15px]">
                        <GradientText>{t(result.title, lang)}</GradientText>
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
