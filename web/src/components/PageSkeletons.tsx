import { useViewMode } from '../lib/view';
import { Container, Section } from './Primitives';
import { Skeleton, Status, TextLines } from './Skeleton';

/* ---------------------------- list pages ---------------------------- */

/**
 * The body of a list page while it loads. `cards` follows the card / list view the
 * visitor chose on phones, like the real cards; `rows` is for text-led rows (events,
 * search results, links); `people` is for portrait cards (leaders).
 */
export function ListSkeleton({
  variant = 'cards',
  count = 6,
}: {
  variant?: 'cards' | 'rows' | 'people';
  count?: number;
}) {
  const { view } = useViewMode();
  const list = view === 'list';

  if (variant === 'rows') {
    return (
      <Status className="space-y-2.5 sm:space-y-4">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-plum-100 bg-white p-2.5 sm:gap-5 sm:rounded-2xl sm:p-5"
          >
            <Skeleton className="h-11 w-11 shrink-0 rounded-lg sm:h-[74px] sm:w-[70px] sm:rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3 sm:h-4" />
              <TextLines lines={2} />
            </div>
          </div>
        ))}
      </Status>
    );
  }

  if (variant === 'people') {
    return (
      <Status className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: Math.min(count, 8) }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-plum-100 bg-white sm:rounded-3xl">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="space-y-2 p-3 sm:p-4">
              <Skeleton className="h-3.5 w-3/4 sm:h-4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </Status>
    );
  }

  return (
    <Status className={`grid gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 ${list ? 'grid-cols-1' : 'grid-cols-3'}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`flex overflow-hidden border border-plum-100 bg-white sm:flex-col sm:rounded-3xl ${
            list ? 'rounded-xl' : 'flex-col rounded-lg'
          }`}
        >
          <Skeleton
            className={`rounded-none sm:aspect-[16/10] sm:w-auto ${
              list ? 'w-[7.5rem] shrink-0 self-stretch' : 'aspect-[4/3] w-full'
            }`}
          />
          <div className={`min-w-0 flex-1 space-y-2 sm:space-y-2.5 sm:p-5 ${list ? 'self-center p-2.5' : 'p-1.5'}`}>
            <Skeleton className="h-2.5 w-1/3 sm:h-3" />
            <Skeleton className="h-3 w-5/6 sm:h-4" />
            <Skeleton className={`h-3 w-3/5 sm:block ${list ? '' : 'hidden'}`} />
          </div>
        </div>
      ))}
    </Status>
  );
}

/* ---------------------------- detail pages ---------------------------- */

/** A whole detail page: the title band, then one content card of headings and text. */
export function DetailSkeleton() {
  return (
    <Status>
      <div className="bg-plum-800">
        <Container className="py-4 sm:py-8 md:py-12">
          <Skeleton dark className="mb-4 hidden h-3 w-44 md:block" />
          <Skeleton dark className="h-6 w-3/4 sm:h-9 sm:w-1/2" />
          <Skeleton dark className="mt-3 h-3 w-2/3 sm:w-1/3" />
        </Container>
      </div>
      <Section tone="mist" className="pt-3 sm:pt-6 md:pt-9">
        <Container>
          <div className="space-y-5 rounded-xl border border-plum-100 bg-white p-3.5 sm:space-y-7 sm:rounded-2xl sm:p-7 md:p-9">
            <TextLines lines={4} />
            <Skeleton className="h-36 w-full rounded-xl sm:h-56 sm:rounded-2xl" />
            <Skeleton className="h-5 w-1/3 sm:h-6" />
            <TextLines lines={5} />
            <TextLines lines={3} />
          </div>
        </Container>
      </Section>
    </Status>
  );
}

/* ------------------------------- home ------------------------------- */

/** The home page: slider, logo strip, about / message card, then the news row. */
export function HomeSkeleton() {
  return (
    <Status>
      <Skeleton className="h-[190px] w-full rounded-none sm:h-[340px] md:h-[440px]" />

      <div className="border-b border-plum-100/70 bg-white py-3 sm:py-6">
        <Container>
          <Skeleton className="mx-auto mb-3 h-3 w-24 sm:mb-5" />
          <div className="flex items-center justify-center gap-4 overflow-hidden sm:gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className={`h-9 w-20 shrink-0 rounded-lg sm:h-12 sm:w-28 ${i > 2 ? 'max-sm:hidden' : ''}`} />
            ))}
          </div>
        </Container>
      </div>

      <section className="bg-mist py-4 sm:py-7 md:py-9">
        <Container>
          <div className="grid gap-5 rounded-2xl border border-plum-100 bg-white p-3.5 sm:gap-8 sm:rounded-3xl sm:p-6 md:p-8 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-4/5 sm:h-8" />
              <TextLines lines={4} />
              <Skeleton className="h-8 w-28 rounded-full sm:h-10 sm:w-32" />
            </div>
            <div className="flex gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3 w-32" />
                <TextLines lines={6} />
              </div>
              <Skeleton className="hidden h-[150px] w-[120px] shrink-0 rounded-t-[4rem] rounded-b-xl sm:block" />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-4 sm:py-7 md:py-9">
        <Container>
          <Skeleton className="mb-3 h-3 w-32 sm:mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`overflow-hidden rounded-xl border border-plum-100 bg-white ${i > 1 ? 'max-sm:hidden' : ''}`}>
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-2 p-2.5 sm:p-3">
                  <Skeleton className="h-2.5 w-1/3" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </Status>
  );
}
