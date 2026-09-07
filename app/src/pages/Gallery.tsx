import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Dialog, DialogPortal, DialogClose } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type GalleryImage = {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  type?: 'image' | 'video';
};

export default function GalleryPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/gallery`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.images)) setImages(data.images);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          {images.length > 0 && (
            <span className="ml-auto text-xs text-white/35">{images.length} items</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-white/40 text-sm">No media yet. Check back soon.</p>
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="columns-1 gap-3 min-[480px]:columns-2 sm:gap-4 md:columns-3 lg:columns-4">
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
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPortal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4, 0, 12, 0.92)', backdropFilter: 'blur(12px)' }}
          >
            <DialogPrimitive.Content
              className="relative flex max-h-[92vh] max-w-5xl w-full flex-col items-center focus:outline-none"
              aria-label="Gallery lightbox"
            >
              {/* Close */}
              <DialogClose className="absolute -right-2 -top-10 z-10 rounded-full bg-white/10 p-2 text-white/70 transition-all hover:bg-white/20 hover:text-white">
                <X size={18} />
              </DialogClose>

              {/* Media — image or video */}
              {activeImage && (
                <div className="relative w-full">
                  {activeImage.type === 'video' ? (
                    <video
                      key={activeImage._id}
                      src={activeImage.imageUrl}
                      controls
                      autoPlay
                      className="max-h-[80vh] w-full rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                      aria-label={activeImage.caption || `WES 2026 video ${activeIndex + 1}`}
                    />
                  ) : (
                    <img
                      key={activeImage._id}
                      src={activeImage.imageUrl}
                      alt={activeImage.caption || `WES 2026 photo ${activeIndex + 1}`}
                      className="max-h-[80vh] w-full rounded-[18px] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                      loading="eager"
                    />
                  )}

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
