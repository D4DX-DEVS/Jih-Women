import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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
import Gallery from '../sections/Gallery';
import Footer from '../sections/Footer';
import RegistrationForm from '../components/RegistrationForm';

gsap.registerPlugin(ScrollTrigger);

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export default function Home() {
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
        <Gallery />
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


    </div>
  );
}
