import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowRight, X } from 'lucide-react';

import Navbar from '../sections/Navbar';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Highlights from '../sections/Highlights';
import Guests from '../sections/Guests';
import SessionPosters from '../sections/SessionPosters';
import Schedule from '../sections/Schedule';
import Venue from '../sections/Venue';
import ShowcaseOpportunity from '../sections/ShowcaseOpportunity';
import RegistrationCTA from '../sections/RegistrationCTA';
import Footer from '../sections/Footer';
import RegistrationForm from '../components/RegistrationForm';

gsap.registerPlugin(ScrollTrigger);

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const hiddenTriggerRef = useRef<HTMLButtonElement>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  // Fetch registration toggle state
  useEffect(() => {
    fetch(`${API_URL}/api/registrations/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.registrationEnabled === 'boolean') {
          setRegistrationEnabled(data.registrationEnabled);
        }
      })
      .catch(() => { /* silently fail — stays disabled */ });
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      gestureOrientation: 'vertical',
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  const handlePopupRegister = () => {
    setShowPopup(false);
    setTimeout(() => hiddenTriggerRef.current?.click(), 180);
  };

  return (
    <div className="relative">
      <Navbar registrationEnabled={registrationEnabled} />
      <main>
        <Hero />
        <About />
        <Highlights />
        <Guests />
        <SessionPosters />
        <Schedule />
        <Venue />
        <ShowcaseOpportunity />
        <RegistrationCTA registrationEnabled={registrationEnabled} />
      </main>
      <Footer />

      {/* Hidden registration form trigger — opened programmatically from popup */}
      <div className="hidden" aria-hidden="true">
        <RegistrationForm
          trigger={
            <button ref={hiddenTriggerRef} tabIndex={-1}>
              hidden-trigger
            </button>
          }
        />
      </div>

      {/* Welcome popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(8, 1, 18, 0.78)', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[28px] shadow-[0_40px_100px_rgba(0,0,0,0.55)]"
            style={{
              background: 'linear-gradient(150deg, #1d0438 0%, #3c0a6e 35%, #8a1a9e 65%, #cc1e88 100%)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-1.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X size={17} />
            </button>

            <div className="p-6 text-center text-white sm:p-8">
              <img src="/Wes.png" alt="WES" className="mx-auto mb-4 h-12 object-contain" />

              <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/55">
                Jamaat-e-Islami Hind Women&apos;s Wing Kerala
              </p>
              <h2 className="font-['Syne'] mb-1 text-xl font-bold tracking-tight sm:text-2xl">
                Women Entrepreneurs Summit
              </h2>
              <p className="mb-1 text-sm text-white/68">20 June 2026 · Saturday</p>
              <p className="mb-5 text-sm text-white/68">KPM TRIPENTA HOTEL, Kozhikode</p>

              <div className="mb-6 rounded-[18px] border border-white/12 bg-black/15 px-4 py-3.5">
                <p className="text-sm leading-6 text-white/80">
                  Limited seats available. Register early to secure your place at Kerala&apos;s
                  premier women entrepreneurs summit.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePopupRegister}
                  className="pill-button inline-flex w-full items-center justify-center gap-2 font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #ffd4ea 100%)',
                    color: '#1a0335',
                    fontSize: '15px',
                  }}
                >
                  Register Now
                  <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="py-1.5 text-sm text-white/45 transition-colors hover:text-white/72"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
