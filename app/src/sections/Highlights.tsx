import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, BriefcaseBusiness, HeartHandshake, Megaphone, UsersRound } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const highlights = [
  {
    icon: BriefcaseBusiness,
    title: 'Ethical and Value-Based Business',
    description:
      'A grounded look at how conviction, responsibility, and long-term thinking can shape strong ventures.',
  },
  {
    icon: UsersRound,
    title: 'Women, Identity, and Leadership',
    description:
      'Reflections on confidence, visibility, leadership roles, and the realities women navigate in entrepreneurship.',
  },
  {
    icon: HeartHandshake,
    title: 'Founders Panel and Shared Journeys',
    description:
      'A candid exchange of wins, setbacks, lessons, and lived experience from women building real businesses.',
  },
  {
    icon: Megaphone,
    title: 'Digital Marketing and Brand Presence',
    description:
      'Practical strategies to sharpen positioning, attract the right audience, and communicate your brand better.',
  },
  {
    icon: BookOpen,
    title: 'Business Design Thinking',
    description:
      'Creative frameworks for solving business challenges, designing better offers, and finding new growth routes.',
  },
];

export default function Highlights() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left column fade in
      gsap.fromTo(
        leftRef.current,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Cards stagger in from right
      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { x: 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.2,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
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
      id="highlights"
      ref={sectionRef}
      className="relative py-12 sm:py-16 lg:py-20 gradient-alt"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-12 lg:gap-16">
          <div
            ref={leftRef}
            className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start opacity-0"
          >
            <span className="section-label text-primary block mb-4 sm:mb-6">Session Themes</span>
            <h2 className="font-['Syne'] text-[1.75rem] sm:text-4xl lg:text-[44px] font-bold text-white leading-[1.05] tracking-tight mb-5 sm:mb-6">
              A curated learning flow for women building the next chapter of their work.
            </h2>
            <p className="text-base lg:text-lg text-white/76 leading-relaxed font-light">
              The summit blends inspiration with practical business thinking. Every session is meant to
              feel relevant, contemporary, and immediately useful, rather than overly formal or distant.
            </p>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/8 p-5 text-white/78 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Also included</p>
              <p className="mt-3 text-sm leading-6">
                Peer conversations, expert-led moments, consultation touchpoints, and space for women to
                connect around ambition, identity, and responsibility.
              </p>
            </div>
          </div>

          <div
            ref={cardsRef}
            className="lg:col-span-8 space-y-4 sm:space-y-6"
          >
            {highlights.map((item, i) => (
              <div
                key={i}
                className="glass-card relative flex cursor-default flex-col items-start gap-4 overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 sm:flex-row sm:gap-6 sm:p-8"
              >
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl -mr-16 -mt-16 transition-all duration-500" />
                <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-[#ffd0e8] backdrop-blur-md transition-all duration-300 sm:h-14 sm:w-14">
                  <item.icon size={28} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-['Syne'] text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/72 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
