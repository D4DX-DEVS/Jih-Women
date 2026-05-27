import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, BadgeIndianRupee, Clapperboard, Image as ImageIcon, PanelsTopLeft } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const displayOptions = [
  {
    icon: ImageIcon,
    title: 'Poster Presence',
    description:
      'Brand story, product visuals, and startup details can be displayed as curated poster panels during the programme.',
  },
  {
    icon: Clapperboard,
    title: 'Video Showcasing',
    description:
      'Short promo videos or brand presentations may be used to introduce participating ventures in a more dynamic format.',
  },
  {
    icon: PanelsTopLeft,
    title: 'Roll-up Stand Display',
    description:
      'Physical display formats such as roll-up stands can be arranged to improve visibility inside the venue space.',
  },
];

export default function ShowcaseOpportunity() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        introRef.current,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            once: true,
          },
        }
      );

      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 82%',
              once: true,
            },
          }
        );
      }

      gsap.fromTo(
        footerRef.current,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 88%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleContactClick = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="showcase" ref={sectionRef} className="relative py-20 sm:py-24 lg:py-28">
      <div className="absolute inset-x-0 top-10 h-40 bg-[radial-gradient(circle_at_top,_rgba(255,125,164,0.2),_transparent_58%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] shadow-[0_28px_80px_rgba(5,2,18,0.3)] backdrop-blur-xl">
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.05fr,0.95fr] lg:gap-10 lg:px-12 lg:py-12">
            <div ref={introRef} className="opacity-0">
              <span className="section-label mb-4 block text-primary">Exclusive Startup Visibility</span>
              <h2 className="font-['Syne'] text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[58px]">
                Showcase your brand inside the summit at no extra cost.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Participants will have the opportunity to showcase their brand name and products during
                the programme. This gives founders a direct visibility layer inside the event, designed
                to help promising ventures get noticed by a relevant audience.
              </p>

              <div className="mt-6 rounded-[24px] border border-primary/25 bg-primary/10 p-5 text-white/82">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary/90">
                  <BadgeIndianRupee size={18} />
                  Complimentary offer
                </div>
                <p className="mt-3 text-sm leading-6 text-white/74 sm:text-base">
                  Promotional materials and display formats such as posters, videos, and roll-up stands
                  may be utilized for this purpose, depending on the participation format and display
                  arrangement confirmed with the officials.
                </p>
              </div>
            </div>

            <div ref={cardsRef} className="grid gap-4 sm:gap-5">
              {displayOptions.map((option) => (
                <div
                  key={option.title}
                  className="glass-card opacity-0 rounded-[28px] border border-white/10 bg-black/10 p-5 sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-[#ffd0e8] backdrop-blur-md">
                    <option.icon size={24} />
                  </div>
                  <h3 className="mt-4 font-['Syne'] text-2xl font-bold tracking-tight text-white">
                    {option.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={footerRef}
            className="border-t border-white/10 bg-black/10 px-6 py-6 opacity-0 sm:px-8 lg:px-12"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
                Those interested are kindly requested to contact the numbers provided below for further
                details and clarification regarding the participation process and display arrangements.
              </p>
              <button
                type="button"
                onClick={handleContactClick}
                className="pill-button inline-flex items-center justify-center gap-2 self-start border border-white/14 bg-white/10 text-white hover:bg-white/15"
              >
                Contact Officials
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}