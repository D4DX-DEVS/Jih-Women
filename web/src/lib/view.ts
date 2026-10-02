import { useSyncExternalStore } from 'react';

/** How listing screens lay out their items on phones: stacked cards (default) or compact rows. */
export type ViewMode = 'card' | 'list';

const KEY = 'wes-view-mode';
const PHONE = '(max-width: 639px)';

const listeners = new Set<() => void>();

function read(): ViewMode {
  try {
    return localStorage.getItem(KEY) === 'list' ? 'list' : 'card';
  } catch {
    return 'card';
  }
}

let mode: ViewMode = read();

function setMode(next: ViewMode) {
  mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode: the choice just lasts for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PHONE) : null;
  mq?.addEventListener?.('change', cb);
  return () => {
    listeners.delete(cb);
    mq?.removeEventListener?.('change', cb);
  };
}

const isPhone = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(PHONE).matches;

/**
 * The chosen listing layout, shared by every listing screen. `view` is what to render:
 * it is only ever 'list' on phones, so tablets and desktop always show the card layout
 * whatever was picked on a phone.
 */
export function useViewMode() {
  const phone = useSyncExternalStore(subscribe, isPhone, () => false);
  const chosen = useSyncExternalStore(subscribe, () => mode, () => 'card' as ViewMode);
  return { view: (phone ? chosen : 'card') as ViewMode, mode: chosen, setMode };
}
