import { useEffect, useRef, useState } from 'react';

/** How far below the visible area the next step starts loading, so it is ready before the reader arrives. */
const LOOKAHEAD = '0px 0px 900px 0px';

/**
 * Long content shown in steps, one more each time the reader scrolls close to the end
 * of what is already on the page. `steps` is how many there are in all; `resetKey`
 * changes when the content does (the reveal starts again from `initial` steps).
 * Put the returned `marker` ref on an element placed right after the content while
 * `more` is true.
 */
export function useRevealOnScroll(steps: number, resetKey: unknown, initial = 1) {
  const [state, setState] = useState({ key: resetKey, shown: initial });
  // New content: start again from the first step (state derived from props, so no extra paint)
  if (state.key !== resetKey) setState({ key: resetKey, shown: initial });
  const shown = state.key === resetKey ? Math.min(state.shown, steps) : initial;
  const more = shown < steps;
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = marker.current;
    if (!more || !el) return;
    // No IntersectionObserver (very old browsers): show everything rather than stall
    if (typeof IntersectionObserver === 'undefined') {
      setState({ key: resetKey, shown: steps });
      return;
    }
    // Re-created after every step, so a marker still in range reports again and the next step follows
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState((s) => (s.key === resetKey ? { key: resetKey, shown: s.shown + 1 } : s));
        }
      },
      { rootMargin: LOOKAHEAD }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [more, shown, steps, resetKey]);

  return { shown, more, marker };
}
