import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { X } from 'lucide-react';

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
import Feedback from '../sections/Feedback';
import Footer from '../sections/Footer';
import RegistrationForm from '../components/RegistrationForm';

gsap.registerPlugin(ScrollTrigger);

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export default function Home() {
  const [showPopup, setShowPopup] = useState(true);
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
        <Feedback />
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

      {/* See You There popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(8, 1, 18, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}
        >
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white/15 p-2 text-white/80 transition-all hover:bg-white/25 hover:text-white shadow-lg"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <img
              src="/see-you.webp"
              alt="See You at WES 2026"
              className="w-full rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
