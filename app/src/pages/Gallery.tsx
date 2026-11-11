import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Dialog, DialogPortal, DialogClose } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
// Three rows of five on desktop
const PAGE_SIZE = 15;

type GalleryImage = {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  type?: 'image' | 'video';
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/**
 * Page numbers to offer around the current page: the first and last page, the
 * current one with `siblings` neighbours each side, and 'gap' for a skipped run.
 */
function pageItems(current: number, total: number, siblings: number): (number | 'gap')[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const edge = 3 + siblings * 2;
  if (total <= edge + 2) return range(1, total);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  if (left <= 2) return [...range(1, edge), 'gap', total];
  if (right >= total - 1) return [1, 'gap', ...range(total - edge + 1, total)];
  return [1, 'gap', ...range(left, right), 'gap', total];
}

function GalleryPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const button =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-10 sm:min-w-10';
  const idle =
    'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white';
  const step = `${button} ${idle} gap-1.5 sm:px-4 disabled:pointer-events-none disabled:opacity-35`;

  // Phones get the short list (no neighbours) so the row never wraps
  const numbers = (siblings: number, visibility: string) => (
    <ul className={`items-center gap-1 sm:gap-1.5 ${visibility}`}>
      {pageItems(page, totalPages, siblings).map((item, i) =>
        item === 'gap' ? (
          <li key={`gap-${i}`} aria-hidden="true" className="w-5 text-center text-sm text-white/35 sm:w-6">
            …
          </li>
        ) : (
          <li key={item}>
            <button
              type="button"
              onClick={() => onPage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={`${button} px-2.5 ${
                item === page ? 'border-primary bg-primary font-semibold text-primary-foreground' : idle
              }`}
            >
              {item}
            </button>
          </li>
        )
      )}
    </ul>
  );

  return (
    <nav aria-label="Gallery pages" className="mt-8 flex items-center justify-center gap-1 sm:mt-10 sm:gap-1.5">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={step}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>
      {numbers(0, 'flex sm:hidden')}
      {numbers(1, 'hidden sm:flex')}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={step}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  // Which request last settled, and how. Anything else is still loading.
  const [settled, setSettled] = useState<{ key: string; failed: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // The page lives in the URL (?page=2), so back/forward and shared links work
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '', 10) || 1);

  const goToPage = useCallback(
    (next: number, replace = false) => {
      setSearchParams(next > 1 ? { page: String(next) } : {}, { replace });
    },
    [setSearchParams]
  );

  const requestKey = `${page}:${retry}`;
  const loading = settled?.key !== requestKey;
  const error = !loading && Boolean(settled?.failed);

  // Fetch only the requested page; a request for a page left behind is cancelled
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/gallery?page=${page}&limit=${PAGE_SIZE}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Gallery request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        const list: GalleryImage[] = Array.isArray(data.images) ? data.images : [];
        const meta: Pagination = data.pagination ?? {
          page: 1,
          limit: PAGE_SIZE,
          total: list.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
        setImages(list);
        setPagination(meta);
        setSettled({ key: requestKey, failed: false });
        setLightboxOpen(false);
        setActiveIndex(0);
        // The server answers a page past the end with the last page
        if (meta.page !== page) goToPage(meta.page, true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSettled({ key: requestKey, failed: true });
      });

    return () => controller.abort();
  }, [page, requestKey, goToPage]);

  const changePage = (next: number) => {
    if (next === page) return;
    goToPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, prev, next]);

  const activeImage = images[activeIndex];
  // Nothing fetched yet: show the full-page spinner rather than a dimmed grid
  const firstLoad = loading && !pagination;

  return (
    <div className="min-h-screen" style={{ background: 'rgb(8, 1, 18)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 backdrop-blur-xl" style={{ background: 'rgba(8,1,18,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <div className="h-4 w-px bg-white/15" />
          <h1 className="font-['Syne'] text-sm font-semibold text-white tracking-tight">
            WES 2026 — Gallery
          </h1>
          {pagination && pagination.total > 0 && (
            <span className="ml-auto text-xs text-white/35">{pagination.total} items</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-busy={loading}>
        {firstLoad && (
          <div className="flex items-center justify-center py-32" role="status" aria-label="Loading gallery">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center" role="alert">
            <p className="text-white/50 text-sm">We could not load the gallery. Please try again.</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-white/40 text-sm">No media yet. Check back soon.</p>
          </div>
        )}

        {/* While the next page loads, the current one stays in place, dimmed, under a spinner */}
        {loading && !firstLoad && (
          <div className="absolute inset-x-0 top-32 z-[1] flex justify-center" role="status" aria-label="Loading page">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          </div>
        )}

        {!firstLoad && !error && images.length > 0 && (
          <div
            className={`columns-1 gap-3 min-[480px]:columns-2 sm:gap-4 md:columns-3 lg:columns-5 transition-opacity duration-200 ${
              loading ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            {images.map((img, i) => (
              <button
                key={img._id}
                onClick={() => openLightbox(i)}
                className="group mb-3 sm:mb-4 block w-full overflow-hidden rounded-[14px] border border-white/10 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {img.type === 'video' ? (
                  <div className="relative w-full">
                    <video
                      src={img.thumbnailUrl}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      preload="metadata"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                      <div className="rounded-full bg-black/55 p-3 backdrop-blur-sm">
                        <Play size={20} className="text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={img.thumbnailUrl}
                    alt={img.caption || `WES 2026 media ${i + 1}`}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {img.caption && (
                  <p className="px-3 py-2 text-[11px] text-white/50 text-left leading-snug">
                    {img.caption}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {pagination && (
          <GalleryPagination page={page} totalPages={pagination.totalPages} onPage={changePage} />
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPortal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4, 0, 12, 0.92)', backdropFilter: 'blur(12px)' }}
          >
            <DialogPrimitive.Content
              className="relative flex max-h-[92vh] max-w-5xl flex-col items-center focus:outline-none"
              aria-label="Gallery lightbox"
              aria-describedby={undefined}
            >
              {/* Radix needs a title for screen readers; nothing to show on screen */}
              <DialogPrimitive.Title className="sr-only">Gallery lightbox</DialogPrimitive.Title>

              {/* Media — image or video. The box wraps the media exactly (caps in viewport units:
                  the screen less the padding and the caption row), so the close button sits on
                  its top corner and a click or tap on the backdrop beside it closes the viewer */}
              {activeImage && (
                <div className="relative min-h-32 min-w-32">
                  {activeImage.type === 'video' ? (
                    <video
                      key={activeImage._id}
                      src={activeImage.imageUrl}
                      controls
                      autoPlay
                      className="block max-h-[min(80vh,calc(100dvh-6rem))] w-[min(64rem,calc(100vw-2rem))] rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                      aria-label={activeImage.caption || `WES 2026 video ${activeIndex + 1}`}
                    />
                  ) : (
                    <img
                      key={activeImage._id}
                      src={activeImage.imageUrl}
                      alt={activeImage.caption || `WES 2026 photo ${activeIndex + 1}`}
                      className="block max-h-[min(80vh,calc(100dvh-6rem))] max-w-[min(64rem,calc(100vw-2rem))] rounded-[18px] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                      loading="eager"
                    />
                  )}

                  {/* Close */}
                  <DialogClose
                    aria-label="Close"
                    className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm transition-all hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-3 sm:top-3 sm:h-10 sm:w-10"
                  >
                    <X size={20} />
                  </DialogClose>

                  {/* Prev / Next */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Caption + counter */}
              <div className="mt-3 flex items-center gap-4 text-center">
                {activeImage?.caption && (
                  <p className="text-sm text-white/60">{activeImage.caption}</p>
                )}
                <span className="text-xs text-white/35 shrink-0">
                  {activeIndex + 1} / {images.length}
                </span>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Overlay>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
