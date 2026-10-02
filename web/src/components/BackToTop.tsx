import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { str } from '../lib/i18n';

/* Show the button once the page has scrolled this far (px). */
const SHOW_AFTER = 600;

/**
 * Round "back to top" button pinned to the bottom-right corner. It fades and scales
 * in once the page is scrolled down, and scrolls smoothly to the top (instantly for
 * prefers-reduced-motion). It sits below the header and overlays (lightbox, menu),
 * and lifts above any `[data-back-to-top-avoid]` element (footer links and icons)
 * that is on screen underneath it.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(0);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER);
      // Rise above the highest marked element that is on screen and horizontally
      // under the button (only its horizontal position is compared, which the lift
      // doesn't change)
      const button = ref.current?.getBoundingClientRect();
      let next = 0;
      if (button) {
        for (const el of document.querySelectorAll('[data-back-to-top-avoid]')) {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.right > button.left - 8 && r.left < button.right + 8) {
            next = Math.max(next, Math.round(window.innerHeight - r.top + 8));
          }
        }
      }
      setLift(next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={toTop}
      aria-label={str('backToTop', 'en')}
      title={str('backToTop', 'en')}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      style={{ '--lift': `${lift}px` } as React.CSSProperties}
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+var(--lift))] end-3 z-40 grid h-9 w-9 place-items-center rounded-full bg-magenta-500 text-white shadow-pink transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-magenta-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta-400 active:scale-95 motion-reduce:transition-none md:bottom-[calc(1.5rem+var(--lift))] md:end-6 md:h-11 md:w-11 ${
        visible ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'
      }`}
    >
      <ArrowUp size={17} strokeWidth={2.4} />
    </button>
  );
}
