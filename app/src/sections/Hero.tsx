import { useEffect, useRef, useState } from 'react';
import { CalendarDays, MapPin, Sparkles, Users } from 'lucide-react';
import gsap from 'gsap';

const spotlightCards = [
  {
    value: '250+',
    label: 'Founders, aspirants, and business leaders from across Kerala',
  },
  {
    value: '5+',
    label: 'Theme-led learning tracks on identity, ethics, marketing, and design thinking',
  },
  {
    value: '1 Day',
    label: 'A focused summit for insight, collaboration, and practical next steps',
  },
];

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);
  const shape1Ref = useRef<HTMLImageElement>(null);
  const shape2Ref = useRef<HTMLImageElement>(null);
  const shape3Ref = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating shapes continuous animation
      gsap.to(shape1Ref.current, {
        y: -20,
        scale: 1.05,
        rotation: 2,
        duration: 8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
      gsap.to(shape2Ref.current, {
        x: 15,
        scale: 1.1,
        duration: 10,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
      gsap.to(shape3Ref.current, {
        y: -15,
        scale: 1.08,
        duration: 7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // Entrance timeline
      const tl = gsap.timeline({ delay: 0.3 });
      const cardNodes = cardsRef.current ? Array.from(cardsRef.current.children) : [];

      tl.fromTo(
        topCardRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }
      )
        .fromTo(
        badgeRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo(
          titleRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
          '-=0.45'
        )
        .fromTo(
          subtitleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          metaRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.25'
        )
        .fromTo(
          ctaRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.2'
        )
        .fromTo(
          cardNodes,
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out' },
          '-=0.2'
        )
        .fromTo(
          sidePanelRef.current,
          { x: 24, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.55'
        )
        .fromTo(
          [shape1Ref.current, shape2Ref.current, shape3Ref.current],
          { opacity: 0 },
          { opacity: 0.7, stagger: 0.1, duration: 1.5, ease: 'power2.out' },
          0.5
        );

      // Particles animation
      if (particlesRef.current) {
        const particles = particlesRef.current.children;
        gsap.fromTo(
          particles,
          { opacity: 0, scale: 0 },
          {
            opacity: 1,
            scale: 1,
            stagger: 0.05,
            duration: 0.5,
            delay: 1.5,
            ease: 'power2.out',
          }
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const [particles] = useState(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    }))
  );

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden gradient-hero"
    >
      {/* Floating Organic Shapes */}
      <img
        ref={shape1Ref}
        src="/shape-coral.png"
        alt=""
        className="absolute right-[-18%] top-[8%] w-[72vw] max-w-[700px] opacity-0 pointer-events-none mix-blend-screen sm:right-[-10%] sm:top-[10%] sm:w-[60vw]"
        style={{ filter: 'blur(2px)' }}
      />
      <img
        ref={shape2Ref}
        src="/shape-gold.png"
        alt=""
        className="absolute right-[-4%] bottom-[10%] w-[44vw] max-w-[400px] opacity-0 pointer-events-none mix-blend-soft-light sm:right-[5%] sm:w-[35vw]"
        style={{ filter: 'blur(3px)' }}
      />
      <img
        ref={shape3Ref}
        src="/shape-magenta.png"
        alt=""
        className="absolute left-[-28%] top-[26%] w-[68vw] max-w-[550px] opacity-0 pointer-events-none mix-blend-screen sm:left-[-15%] sm:top-[30%] sm:w-[50vw]"
        style={{ filter: 'blur(4px)' }}
      />

      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-primary/20 animate-float"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24">
        <div
          ref={topCardRef}
          className="mx-auto mb-6 max-w-5xl overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-2 opacity-0 shadow-[0_24px_70px_rgba(6,2,18,0.35)] backdrop-blur-xl sm:mb-8"
        >
          <img
            src="/banner.jpeg"
            alt="Women Entrepreneurs Summit banner"
            className="h-auto w-full rounded-[22px] border border-white/10 object-cover"
          />
        </div>

        <div
          ref={contentRef}
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:gap-10"
        >
          <div>
            <div
              ref={badgeRef}
              className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-left opacity-0 backdrop-blur-md sm:mb-6"
            >
              <Sparkles className="h-4 w-4 text-[#ffd1ea]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffe7f5] sm:text-xs">
                Jamaat-e-Islami Hind Women&apos;s Wing Kerala presents
              </span>
            </div>

            <h1
              ref={titleRef}
              className="max-w-4xl text-[1.7rem] font-bold leading-[1.1] tracking-[-0.03em] text-white opacity-0 sm:text-[2.2rem] lg:text-[2.8rem]"
            >
              Build with purpose.
              <br />
              Lead with clarity.
              <br />
              Rise together.
            </h1>

            <p
              ref={subtitleRef}
              className="mt-5 max-w-2xl text-base leading-7 text-white/80 opacity-0 sm:mt-6 sm:text-lg"
            >
              Women Entrepreneurs Summit 2026 brings together founders, aspiring entrepreneurs,
              professionals, and community leaders for a high-energy day of insight, direction,
              networking, and values-led business conversations in Kozhikode.
            </p>

            <div
              ref={metaRef}
              className="mt-6 grid gap-3 opacity-0 sm:mt-8 sm:grid-cols-3"
            >
              <div className="glass-card flex items-center gap-3 px-4 py-4 text-left text-white sm:px-5">
                <div className="rounded-2xl bg-white/10 p-2.5 text-[#ffd0e8]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Date</p>
                  <p className="text-sm font-semibold sm:text-base">20 June 2026, Saturday</p>
                </div>
              </div>
              <div className="glass-card flex items-center gap-3 px-4 py-4 text-left text-white sm:px-5">
                <div className="rounded-2xl bg-white/10 p-2.5 text-[#ffd0e8]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Location</p>
                  <p className="text-sm font-semibold sm:text-base">Kozhikode, Kerala</p>
                </div>
              </div>
              <div className="glass-card flex items-center gap-3 px-4 py-4 text-left text-white sm:px-5">
                <div className="rounded-2xl bg-white/10 p-2.5 text-[#ffd0e8]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Access</p>
                  <p className="text-sm font-semibold sm:text-base">Limited seats, curated audience</p>
                </div>
              </div>
            </div>

            <div
              ref={ctaRef}
              className="mt-6 flex flex-col gap-3 opacity-0 sm:mt-8 sm:flex-row sm:items-center"
            >
              <div className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm sm:w-auto">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/90">
                  Registrations Closed
                </span>
              </div>
              <button
                onClick={() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' })}
                className="pill-button inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
              >
                Explore Sessions
              </button>
            </div>

            <div
              ref={cardsRef}
              className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3"
            >
              {spotlightCards.map((card) => (
                <div key={card.value} className="glass-card p-4 text-left text-white/90 sm:p-5">
                  <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={sidePanelRef}
            className="immersive-panel rounded-[30px] p-5 text-white opacity-0 backdrop-blur-xl sm:p-6 lg:sticky lg:top-28"
          >
            <img
              src="/Wes.png"
              alt="Women Entrepreneurs Summit"
              className="mb-5 h-16 object-contain sm:h-20"
            />
            <div className="rounded-[24px] border border-white/12 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Summit focus</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">A modern platform for women who want direction, visibility, and meaningful connections.</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
                <p>Explore conversations around values-led enterprise, women&apos;s leadership, branding, digital growth, and innovation.</p>
                <p>Meet founders, mentors, and peers who understand the realities of building and scaling with intention.</p>
                <p>Leave with sharper perspective, stronger networks, and practical energy to move forward.</p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/12 bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Registration</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xl font-bold tracking-tight text-white/35 line-through decoration-white/50">₹1,000</p>
                    <span className="rounded-full bg-primary/20 border border-primary/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Early Bird</span>
                  </div>
                  <p className="text-4xl font-bold tracking-tight">₹800</p>
                  <p className="mt-1 text-sm text-white/68">Per participant</p>
                </div>
                <div className="text-right text-xs uppercase tracking-[0.18em] text-white/55">
                  Limited
                  <br />
                  seats
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </section>
  );
}
