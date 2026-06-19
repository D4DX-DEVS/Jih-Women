import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import RegistrationForm from '../components/RegistrationForm';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  registrationEnabled: boolean;
};

export default function RegistrationCTA({ registrationEnabled }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        },
      });

      tl.fromTo(
        headingRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
        .fromTo(
          bodyRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          priceRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          ctaRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          infoRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
          '-=0.2'
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="register"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32 gradient-hero"
    >
      <img
        src="/shape-coral.png"
        alt=""
        className="absolute -left-[20%] top-[10%] w-[50%] opacity-20 pointer-events-none mix-blend-screen animate-float-slow"
        style={{ filter: 'blur(20px)' }}
      />
      <img
        src="/shape-gold.png"
        alt=""
        className="absolute -right-[15%] bottom-[5%] w-[40%] opacity-15 pointer-events-none mix-blend-soft-light animate-float"
        style={{ filter: 'blur(25px)' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.08] p-6 text-center shadow-[0_24px_70px_rgba(7,2,20,0.24)] backdrop-blur-xl sm:p-8 lg:p-10">

          {registrationEnabled ? (
            <>
              <h2
                ref={headingRef}
                className="font-['Syne'] text-3xl sm:text-5xl lg:text-[64px] font-bold text-white leading-[1.05] tracking-tight mb-4 sm:mb-6 opacity-0"
              >
                Register for WES 2026
              </h2>

              <p
                ref={bodyRef}
                className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed text-white/76 opacity-0 sm:text-lg"
              >
                Secure your place at Kerala&apos;s premier Women Entrepreneurs Summit — 20 June 2026,
                KPM TRIPENTA HOTEL, Kozhikode.
              </p>

              {/* Live badge */}
              <div
                ref={priceRef}
                className="mb-10 flex flex-col items-center gap-4 opacity-0"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 backdrop-blur-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-base font-bold uppercase tracking-widest text-emerald-300">
                    Registrations Open
                  </span>
                </div>
              </div>

              {/* CTA button */}
              <div ref={ctaRef} className="mb-7 opacity-0 sm:mb-8 flex justify-center">
                <RegistrationForm
                  trigger={
                    <button
                      className="pill-button inline-flex items-center gap-2.5 font-semibold text-base px-8 py-4"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #ffd4ea 100%)',
                        color: '#1a0335',
                      }}
                    >
                      Register Now
                      <ArrowRight size={18} />
                    </button>
                  }
                />
              </div>

              {/* Event Info */}
              <p
                ref={infoRef}
                className="mx-auto max-w-xl text-sm text-white/60 opacity-0 sm:text-base"
              >
                Saturday, June 20, 2026 · KPM TRIPENTA HOTEL, Kozhikode · Hosted by Jamaat-e-Islami Hind Women&apos;s Wing Kerala
              </p>
            </>
          ) : (
            <>
              <h2
                ref={headingRef}
                className="font-['Syne'] text-3xl sm:text-5xl lg:text-[64px] font-bold text-white leading-[1.05] tracking-tight mb-4 sm:mb-6 opacity-0"
              >
                Registrations are now closed.
              </h2>

              <p
                ref={bodyRef}
                className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed text-white/76 opacity-0 sm:text-lg"
              >
                We&apos;ve reached capacity for the Women Entrepreneurs Summit 2026. Thank you to everyone
                who signed up — we&apos;re excited to welcome you on 20 June in Kozhikode.
              </p>

              {/* Closed indicator */}
              <div
                ref={priceRef}
                className="mb-10 flex flex-col items-center gap-4 opacity-0"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-rose-400/40 bg-rose-500/10 px-6 py-3 backdrop-blur-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-base font-bold uppercase tracking-widest text-rose-300">
                    Entry Registrations Closed
                  </span>
                </div>
                <p className="text-sm text-white/50 uppercase tracking-widest">
                  No further registrations will be accepted
                </p>
              </div>

              {/* Thank you message */}
              <div
                ref={ctaRef}
                className="mb-7 opacity-0 sm:mb-8"
              >
                <p
                  className="font-['Syne'] text-xl sm:text-3xl font-semibold text-white/90"
                  style={{
                    background: 'linear-gradient(90deg, #ffffff, #ffd4ea, #ff8abb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Thank you for your support &amp; cooperation.
                </p>
              </div>

              {/* Event Info */}
              <p
                ref={infoRef}
                className="mx-auto max-w-xl text-sm text-white/60 opacity-0 sm:text-base"
              >
                Saturday, June 20, 2026 · KPM TRIPENTA HOTEL, Kozhikode · Hosted by Jamaat-e-Islami Hind Women&apos;s Wing Kerala
              </p>
            </>
          )}

        </div>
      </div>
    </section>
  );
}
