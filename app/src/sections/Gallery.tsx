import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Images, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const PREVIEW_COUNT = 4;

type GalleryImage = {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  type?: 'image' | 'video';
};

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/gallery?limit=${PREVIEW_COUNT}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.images)) setImages(data.images);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        labelRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );
      gsap.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.children,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%', once: true },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [images]);

  if (images.length === 0) return null;

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(7,2,20,0.24)] backdrop-blur-xl sm:p-8 lg:p-10">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8 flex-wrap">
            <div>
              <span
                ref={labelRef}
                className="section-label text-primary block mb-3 opacity-0"
              >
                Event Gallery
              </span>
              <h2
                ref={headingRef}
                className="font-['Syne'] text-xl sm:text-2xl lg:text-[2.1rem] font-bold text-white opacity-0 leading-[1.12] tracking-tight"
              >
                Moments from WES 2026
              </h2>
            </div>
            <button
              onClick={() => navigate('/gallery')}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-2.5 text-sm text-white/80 transition-all hover:bg-white/14 hover:text-white hover:border-white/35 shrink-0"
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Preview grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          >
            {images.map((img) => (
              <button
                key={img._id}
                onClick={() => navigate('/gallery')}
                className="group relative aspect-square overflow-hidden rounded-[16px] border border-white/10 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {img.type === 'video' ? (
                  <>
                    <video
                      src={img.thumbnailUrl}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      preload="metadata"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                      <div className="rounded-full bg-black/50 p-3 backdrop-blur-sm">
                        <Play size={18} className="text-white" fill="white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={img.thumbnailUrl}
                      alt={img.caption || 'WES 2026'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-6 flex items-center justify-center gap-3 pt-4 border-t border-white/8">
            <Images size={15} className="text-white/40" />
            <button
              onClick={() => navigate('/gallery')}
              className="text-sm text-white/55 hover:text-white transition-colors"
            >
              Browse the full media collection →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
