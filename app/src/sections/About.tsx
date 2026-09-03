import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Compass, Handshake, Lightbulb, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Compass, number: 'Clarity', label: 'Understand where your venture can grow next' },
  { icon: Handshake, number: 'Community', label: 'Meet women building, scaling, and supporting businesses' },
  { icon: Lightbulb, number: 'Momentum', label: 'Leave with ideas you can translate into action' },
  { icon: ShieldCheck, number: 'Values', label: 'Explore business growth rooted in purpose and ethics' },
];

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const parasRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Label reveal
      gsap.fromTo(
        labelRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Heading reveal
      gsap.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
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

      // Paragraphs reveal
      if (parasRef.current) {
        gsap.fromTo(
          parasRef.current.children,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: parasRef.current,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      // Stats cards stagger
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.15,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
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
      id="about"
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(7,2,20,0.24)] backdrop-blur-xl sm:p-8 lg:p-10">
          {/* Label */}
          <span
            ref={labelRef}
            className="section-label text-primary block mb-3 sm:mb-5 opacity-0"
          >
            Summit Overview
          </span>

          {/* Heading — full width, smaller */}
          <h2
            ref={headingRef}
            className="font-['Syne'] text-xl sm:text-2xl lg:text-[2.1rem] font-bold text-white mb-6 sm:mb-8 opacity-0 leading-[1.12] tracking-tight max-w-3xl"
          >
            A summit for women who want stronger direction, deeper networks, and business growth that stays true to their values.
          </h2>

          {/* Paragraphs — full width, 3-col on lg */}
          <div
            ref={parasRef}
            className="grid gap-4 sm:gap-5 mb-7 sm:grid-cols-2 lg:grid-cols-3"
          >
            <p className="text-sm text-white/75 leading-relaxed font-light">
              Women Entrepreneurs Summit is designed as an immersive day for entrepreneurs,
              aspiring founders, professionals, and changemakers who are looking for more than
              generic motivation. The event is built to offer real perspective, meaningful
              connections, and practical learning.
            </p>
            <p className="text-sm text-white/75 leading-relaxed font-light">
              Across Kerala, many women-led ventures still face barriers around confidence,
              visibility, mentorship, market access, and sustainable strategy. WES brings those
              conversations into one room with a stronger sense of purpose and community.
            </p>
            <p className="text-sm text-white/75 leading-relaxed font-light sm:col-span-2 lg:col-span-1">
              Expect an environment that feels contemporary and welcoming, with focused sessions,
              thoughtful networking, and room for both business ambition and personal conviction.
            </p>
          </div>

          {/* Who / What — 2-col, full width */}
          <div className="grid gap-3 mb-7 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/12 bg-black/10 p-4 text-white/82">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/48 mb-2">Who should attend</p>
              <p className="text-sm leading-6">Women entrepreneurs, startup dreamers, home-business owners, creators, professionals, and community leaders.</p>
            </div>
            <div className="rounded-[20px] border border-white/12 bg-black/10 p-4 text-white/82">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/48 mb-2">What to expect</p>
              <p className="text-sm leading-6">Live sessions, peer exchange, practical insight, fresh encouragement, and a renewed sense of direction.</p>
            </div>
          </div>

          {/* Stats cards — icon + title on same line, 4-col */}
          <div
            ref={statsRef}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.number}
                className="glass-card relative overflow-hidden p-3.5 text-left text-white sm:p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-shrink-0 rounded-xl border border-white/12 bg-white/10 p-1.5 text-[#ffd2e8]">
                    <stat.icon size={14} />
                  </div>
                  <div className="font-['Syne'] text-sm font-bold leading-tight tracking-tight">
                    {stat.number}
                  </div>
                </div>
                <div className="text-xs leading-5 text-white/62">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
