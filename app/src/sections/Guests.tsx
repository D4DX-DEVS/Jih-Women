import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const guests = [
  {
    name: 'Rifath Rahman',
    role: 'Co-Founder, Capio Interactive',
    image: '/guest1.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'PA Shameel Sajjad',
    role: 'General Secretary, Indian Association for Islamic Economics',
    image: '/guest2.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Faris OK',
    role: 'Executive committee member and Finance Manager, People’s Foundation',
    image: '/guest3.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Dr. Muhammad Shafi',
    role: 'Associate Professor, NIT Calicut',
    image: '/guest4.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Dr. Nishad VM',
    role: 'Deputy Executive Director, People’s Foundation',
    image: '/guest5.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Abida Rasheed',
    role: 'Celebrity Chef, Malabar food Icon, Entrepreneur',
    image: '/guest6.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Dr. Nasreena KK',
    role: 'Vice President, Indian Association for Islamic Economics',
    image: '/guest7.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Dr. Aysha Ruby',
    role: 'Couturier and Apparel Exporter, Chairwoman Fashion and Textile Committee, Global Economic Forum, Germany',
    image: '/guest8.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Shamla Ismail',
    role: 'MD, SM Garments Owner',
    image: '/guest9.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Sameer Kalikavu',
    role: 'Secretary, Ithihadul Ulama Kerala and Executive Member, Indian Association for Islamic Economics',
    image: '/guest10.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Naseema KT',
    role: 'Vice President, JIH Women’s Wing Kerala',
    image: '/guest11.webp',
    label: 'WES Voice',
  },
  {
    name: 'Aisha Sameeha',
    role: 'Founder of Koderfin',
    image: '/guest12.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Dr. Nahas Mala',
    role: 'Shoora Member, Jamaat-e-Islami Hind Kerala and Deputy Rector, Al Jamia Al Islamiya Santhapuram',
    image: '/guest13.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'P Mujeeburahman',
    role: 'Ameer, Jamaat-e-Islami Hind Kerala',
    image: '/guest14.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Sajitha PTP',
    role: 'President, JIH Women’s Wing Kerala',
    image: '/guest15.webp',
    label: 'WES Voice',
  },
  {
    name: 'Shifana K',
    role: 'State President, GIO Kerala',
    image: '/guest16.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Mumthas KK',
    role: 'Founder of Mumzart, Resinart and Business Success Coach',
    image: '/guest17.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'PV Rahmabi',
    role: 'Secretary, Jamaat-e-Islami Hind Kerala',
    image: '/guest18.webp',
    label: 'Guest Speaker',
  },
  {
    name: 'Ruksana P',
    role: 'Vice President, Jamaat-e-Islami Hind Women’s Wing Kerala',
    image: '/guest19.webp',
    label: 'Guest Speaker',
  },  {
    name: 'Afeeda Ahmad',
    role: 'Secretary, JIH Women\u2019s Wing Kerala',
    image: '/guest20.webp',
    label: 'WES Voice',
  },
  {
    name: 'Rajeena Beegum',
    role: 'General Secretary, JIH Women\u2019s Wing Kerala',
    image: '/guest21.webp',
    label: 'WES Voice',
  },];

export default function Guests() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoplayPausedRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false,
    loop: true,
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;

      gsap.fromTo(
        contentRef.current.querySelectorAll('.guest-reveal'),
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const updateSelected = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    updateSelected();
    emblaApi.on('select', updateSelected);
    emblaApi.on('reInit', updateSelected);

    return () => {
      emblaApi.off('select', updateSelected);
      emblaApi.off('reInit', updateSelected);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = window.setInterval(() => {
      if (!autoplayPausedRef.current) emblaApi.scrollNext();
    }, 3600);

    return () => window.clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <section
      id="guests"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32 gradient-alt"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#ff4cab]/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-12 h-80 w-80 rounded-full bg-[#8b5cf6]/14 blur-3xl" />

      <div ref={contentRef} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="guest-reveal mx-auto mb-10 max-w-3xl text-center opacity-0 sm:mb-14">
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd9ed] backdrop-blur-md">
              <Sparkles size={15} />
              Guest Speakers
            </span>
          </div>
          <h2 className="font-['Syne'] text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
            Voices bringing insight, enterprise, and lived experience to WES.
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/66 sm:text-base">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-4 py-2">
              <CalendarDays size={16} className="text-[#ffd0e8]" />
              20 June 2026
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-4 py-2">
              <MapPin size={16} className="text-[#ffd0e8]" />
              KPM Tripenta Hotel, Kozhikode
            </span>
          </div>
        </div>

        <div
          className="guest-reveal opacity-0"
          onMouseEnter={() => { autoplayPausedRef.current = true; }}
          onMouseLeave={() => { autoplayPausedRef.current = false; }}
          onFocusCapture={() => { autoplayPausedRef.current = true; }}
          onBlurCapture={() => { autoplayPausedRef.current = false; }}
        >
          <div ref={emblaRef} className="overflow-hidden py-2" data-lenis-prevent>
            <div className="flex touch-pan-y">
              {guests.map((guest, index) => (
                <div
                  key={guest.name}
                  className="min-w-0 flex-[0_0_86%] px-2 sm:flex-[0_0_58%] sm:px-3 lg:flex-[0_0_38%] xl:flex-[0_0_34%]"
                >
                  <article
                    className={`group relative overflow-hidden rounded-[28px] border bg-white/[0.08] shadow-[0_28px_90px_rgba(6,1,18,0.38)] transition-all duration-500 sm:rounded-[32px] ${
                      selectedIndex === index
                        ? 'border-white/28 scale-[1.01]'
                        : 'border-white/12 scale-[0.94] opacity-70'
                    }`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#12021e]">
                      <img
                        src={guest.image}
                        alt={`${guest.name}, guest speaker at Women Entrepreneurs Summit`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#09010f]/90 via-[#09010f]/24 to-transparent" />
                      <div className="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-5 sm:right-5 sm:top-5">
                        <span className="rounded-full border border-white/14 bg-black/22 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                          {guest.label} {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6fbd] shadow-[0_0_18px_rgba(255,111,189,0.9)]" />
                      </div>
                    </div>
                    <div className="border-t border-white/10 bg-[#0b0214]/86 px-5 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
                      <h3 className="font-['Syne'] text-2xl font-bold leading-tight tracking-tight text-[#fff1c8] sm:text-3xl">
                        {guest.name}
                      </h3>
                      <p className="mt-2 min-h-[68px] text-sm leading-6 text-white/68 sm:text-base">
                        {guest.role}
                      </p>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-5 sm:flex-row">
            <div className="flex max-w-3xl flex-wrap items-center justify-center gap-2">
              {guests.map((guest, index) => (
                <button
                  key={guest.name}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    selectedIndex === index ? 'w-8 bg-[#ffd0e8]' : 'w-2.5 bg-white/26 hover:bg-white/45'
                  }`}
                  aria-label={`Show ${guest.name}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollPrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-all hover:-translate-y-0.5 hover:bg-white/14 sm:h-12 sm:w-12"
                aria-label="Previous guest"
              >
                <ArrowLeft size={19} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white text-[#1a0335] shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 sm:h-12 sm:w-12"
                aria-label="Next guest"
              >
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}