import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Building2, Navigation, Sparkles, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Building2, label: 'A comfortable premium venue for a full-day summit experience' },
  { icon: Users, label: 'Networking-friendly spaces for conversations beyond the stage' },
  { icon: Sparkles, label: 'A polished atmosphere aligned with the event’s modern visual identity' },
];

export default function Venue() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left column parallax scale
      gsap.fromTo(
        leftRef.current,
        { scale: 1.05, opacity: 0.8 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Right column content stagger
      if (rightRef.current) {
        gsap.fromTo(
          rightRef.current.querySelectorAll('.venue-reveal'),
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: rightRef.current,
              start: 'top 75%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="venue"
      ref={sectionRef}
      className="relative py-2 sm:py-4"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 overflow-hidden rounded-[1.9rem] border border-white/12 bg-white/[0.06] shadow-[0_24px_70px_rgba(7,2,20,0.24)] backdrop-blur-xl lg:min-h-[440px] lg:grid-cols-2">
          <div
            ref={leftRef}
            className="relative h-[240px] w-full sm:h-[320px] lg:h-auto"
          >
            <iframe 
              src="https://maps.google.com/maps?q=11.2690035,75.7898538&z=17&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              aria-hidden="false" 
              tabIndex={0}
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>

          <div
            ref={rightRef}
            className="flex flex-col justify-center px-5 py-7 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-14"
          >
            <span className="venue-reveal section-label text-primary mb-4 sm:mb-6 opacity-0">
              Venue & Hosting
            </span>

            <h2 className="venue-reveal font-['Syne'] text-[1.75rem] sm:text-4xl lg:text-[44px] font-bold text-white leading-[1.05] tracking-tight mb-3 sm:mb-4 opacity-0">
              KPM TRIPENTA HOTEL
            </h2>

            <p className="venue-reveal font-['Outfit'] text-base sm:text-xl font-light text-white/62 mb-5 sm:mb-6 opacity-0 uppercase tracking-[0.2em] sm:tracking-widest">
              Kozhikode, Kerala
            </p>

            <p className="venue-reveal text-sm sm:text-base text-white/74 leading-relaxed mb-7 sm:mb-8 opacity-0">
              Set in the heart of Kozhikode, the venue offers a polished and practical setting for a
              summit that blends formal sessions with organic networking. The programme is hosted by
              Jamaat-e-Islami Hind Women&apos;s Wing Kerala as a platform for women to gather, reflect,
              and move forward with renewed confidence.
            </p>

            <div className="venue-reveal space-y-3 sm:space-y-4 mb-8 sm:mb-10 opacity-0">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 sm:gap-4 text-white/85"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/10 backdrop-blur-sm sm:h-12 sm:w-12">
                    <feature.icon size={20} className="text-[#ffd0e8]" />
                  </div>
                  <span className="text-sm sm:text-lg font-medium">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="venue-reveal mb-6 grid gap-3 opacity-0 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/12 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Organised by</p>
                <p className="mt-2 text-sm leading-6 text-white/78">Jamaat-e-Islami Hind Women&apos;s Wing Kerala</p>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">City energy</p>
                <p className="mt-2 text-sm leading-6 text-white/78">A central Kozhikode location that keeps access simple for mobile-first attendees.</p>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/place/KPM+TRIPENTA+HOTEL/@11.2690035,75.7872789,17z/data=!3m1!4b1!4m9!3m8!1s0x3ba659f860e349d3:0xada70f570af9dcae!5m2!4m1!1i2!8m2!3d11.2690035!4d75.7898538!16s%2Fg%2F11h3bt49hz"
              target="_blank"
              rel="noopener noreferrer"
              className="venue-reveal pill-button inline-flex w-fit items-center gap-2 border border-white/14 bg-white/10 text-white hover:bg-white/15 opacity-0"
            >
              <Navigation size={18} />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
