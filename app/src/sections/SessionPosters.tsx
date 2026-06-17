import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ArrowRight, Clock3, Mic2, MoveHorizontal } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const sessionPosters = [
  {
    title: 'Ethical And Value Based Business',
    time: '11:00 AM - 12:00 PM',
    format: 'Panel Discussion',
    image: '/detail5.webp',
    speakers: 'Sameer Kalikavu, P.A Shameel Sajjad, Dr. Nasreena KK, PV Rahmabi',
    note: 'A focused conversation on values, responsibility, and principled business growth.',
  },
  {
    title: 'Women Identity & Leadership',
    time: '12:00 PM - 1:00 PM',
    format: 'Talk + Panel',
    image: '/detail4.webp',
    speakers: 'P. Ruksana, Abida Rasheed, Dr. Aysha Ruby, Mumthas KK, Shamla Ismail, Afeeda Ahmad',
    note: 'Leadership, identity, and real founder stories brought together in one midday block.',
  },
  {
    title: 'Consultation Counters',
    time: '2:00 PM - 4:00 PM',
    format: 'Expert Counters',
    image: '/detail1.webp',
    speakers: 'Dr. Nishad V.M., Faris O.K., Dr. Muhammad Shafi',
    note: 'Drop into practical counters for startup ecosystem, ethical business, and growth support.',
  },
  {
    title: 'Digital Marketing & Business Design',
    time: '3:00 PM - 4:00 PM',
    format: 'Parallel Sessions',
    image: '/detail3.webp',
    speakers: 'Rifath Rahman, Aisha Sameeha',
    note: 'Two practical sessions for sharper branding, digital visibility, and business thinking.',
  },
  {
    title: 'Closing Ceremony',
    time: '4:00 PM - 5:00 PM',
    format: 'Ceremony',
    image: '/detail2.webp',
    speakers: 'Sahira Manayath, Sajitha PTP, Dr. Nahas Mala, Shifana K, Naseema K.T',
    note: 'A closing hour with addresses, reflections, felicitation, and final remarks.',
  },
];

export default function SessionPosters() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hintShownRef = useRef(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;

      gsap.fromTo(
        contentRef.current.querySelectorAll('.poster-reveal'),
        { y: 46, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 76%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hintShownRef.current) return;

        hintShownRef.current = true;
        setShowSwipeHint(true);
        window.setTimeout(() => setShowSwipeHint(false), 3200);
      },
      { threshold: 0.36 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const scrollPosters = (direction: 'prev' | 'next') => {
    if (!scrollerRef.current) return;

    const card = scrollerRef.current.querySelector('article');
    const cardWidth = card?.clientWidth ?? 360;
    scrollerRef.current.scrollBy({
      left: direction === 'next' ? cardWidth + 20 : -(cardWidth + 20),
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="sessions"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#ff4cab]/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-[#7c3aed]/14 blur-3xl" />

      <div ref={contentRef} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="poster-reveal mb-8 flex flex-col gap-6 opacity-0 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="section-label mb-4 block text-primary">Session Posters</span>
            <h2 className="font-['Syne'] text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              See the sessions, timings, and speakers at a glance.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 lg:text-lg">
              These poster cards give a quick visual read of the summit flow, from value-based business
              conversations to practical brand, design, and consultation sessions.
            </p>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => scrollPosters('prev')}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/16"
              aria-label="Previous session poster"
            >
              <ArrowLeft size={19} />
            </button>
            <button
              type="button"
              onClick={() => scrollPosters('next')}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/16"
              aria-label="Next session poster"
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>

        <div className="poster-reveal relative opacity-0">
          {showSwipeHint && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/18 bg-[#12021e]/90 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_18px_45px_rgba(4,1,12,0.42)] backdrop-blur-xl sm:hidden">
              <MoveHorizontal size={16} className="text-[#ffd0e8]" />
              Swipe to see more sessions
            </div>
          )}

          <div
            ref={scrollerRef}
            onScroll={() => setShowSwipeHint(false)}
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-12 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0"
            data-lenis-prevent
          >
            {sessionPosters.map((session, index) => (
              <article
                key={session.title}
                className={`group relative min-w-full snap-start overflow-hidden rounded-[26px] border border-white/12 bg-white/[0.075] shadow-[0_28px_85px_rgba(6,1,18,0.34)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/24 sm:min-w-[54%] sm:snap-center sm:rounded-[28px] lg:min-w-0 ${
                  index < 2 ? 'lg:col-span-6' : 'lg:col-span-4'
                }`}
              >
                <div className="relative overflow-hidden bg-[#10021d]">
                  <img
                    src={session.image}
                    alt={`${session.title} session poster with speakers`}
                    className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#07010d]/92 via-[#07010d]/24 to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 sm:left-5 sm:right-5 sm:top-5">
                    <span className="rounded-full border border-white/16 bg-black/28 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/82 backdrop-blur-md">
                      {session.format}
                    </span>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ff7abd]/40 bg-[#ff7abd]/18 text-[#ffd5ec] shadow-[0_0_22px_rgba(255,111,189,0.34)] backdrop-blur-md">
                      <Mic2 size={16} />
                    </span>
                  </div>
                </div>

                <div className="relative border-t border-white/10 bg-[#0b0214]/88 p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-[#ffd0e8]">
                      <Clock3 size={14} />
                      {session.time}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/14 px-3 py-1.5 text-xs font-semibold text-white/64">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="font-['Syne'] text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                    {session.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">{session.note}</p>

                  <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.055] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                      Speakers
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/76">{session.speakers}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}