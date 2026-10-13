import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, X } from 'lucide-react';
import { useSite } from '../lib/site';
import { GradientText } from './Primitives';

/** Matches the .pm-* exit animation length in index.css */
const EXIT_MS = 180;
/** A hover popup closes this long after the pointer has left both the message and the popup */
const LEAVE_MS = 250;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 'hover': opened by the pointer, page stays usable, closes when the pointer leaves.
    'pinned': a modal (click, tap or Enter); closes on X, a click outside or Escape. */
export type PresidentPopupMode = 'hover' | 'pinned';

type Props = {
  mode: PresidentPopupMode;
  /** The pointer is over the message that opened the popup (keeps a hover popup open) */
  triggerHovered: boolean;
  /** Section label, e.g. "President's Message" */
  label: string;
  /** The message's own heading; shown under the label only when it differs from it */
  heading: string;
  /** Message HTML exactly as stored in the CMS */
  body: string;
  name: string;
  designation: string;
  photo: string;
  /** Turn a hover popup into a pinned one (the person clicked inside it) */
  onPin: () => void;
  onClose: () => void;
};

/* The full President's message in a popup. It fades and scales in and fades out on close.
   Hovered: the card floats over the page and goes away when the pointer leaves. Pinned:
   a modal that moves focus inside, keeps it there, locks page scroll and returns focus to
   whatever opened it; the message itself scrolls when it is long. */
export default function PresidentMessageModal({
  mode,
  triggerHovered,
  label,
  heading,
  body,
  name,
  designation,
  photo,
  onPin,
  onClose,
}: Props) {
  const { s } = useSite();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedOutside = useRef(false);
  const closingRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const onCloseRef = useRef(onClose);
  const pinnedRef = useRef(mode === 'pinned');
  const [closing, setClosing] = useState(false);
  const [dialogHovered, setDialogHovered] = useState(false);
  const pinned = mode === 'pinned';

  useEffect(() => {
    onCloseRef.current = onClose;
    pinnedRef.current = pinned;
  });

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(() => onCloseRef.current(), EXIT_MS);
  }, []);

  // Escape closes either kind; Tab stays inside only while pinned
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !pinnedRef.current) return;
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = root.contains(active);
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timerRef.current);
    };
  }, [requestClose]);

  // Pinned: lock the page behind, move focus in, give it back on the way out
  useEffect(() => {
    if (!pinned) return;
    const opener = document.activeElement as HTMLElement | null;
    const { body: page } = document;
    const prevOverflow = page.style.overflow;
    const prevPadding = page.style.paddingRight;
    // Keep the page from shifting sideways when the scrollbar disappears
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    page.style.overflow = 'hidden';
    if (gutter > 0) page.style.paddingRight = `${gutter}px`;
    closeRef.current?.focus();
    return () => {
      page.style.overflow = prevOverflow;
      page.style.paddingRight = prevPadding;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [pinned]);

  // Hover: leave the message and the popup, and it goes
  useEffect(() => {
    if (pinned || triggerHovered || dialogHovered) return;
    const id = window.setTimeout(requestClose, LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [pinned, triggerHovered, dialogHovered, requestClose]);

  const state = closing ? 'closed' : 'open';

  return createPortal(
    <div
      // Hovered: the dimmed page behind stays live, so the pointer can still be "over" the message
      className={`pm-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-plum-900/60 p-3 backdrop-blur-[2px] sm:p-6 ${
        pinned ? '' : 'pointer-events-none'
      }`}
      data-state={state}
      // A press that starts inside the card (e.g. selecting text) and ends on the backdrop must not close it
      onPointerDown={(e) => {
        pressedOutside.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pinned && pressedOutside.current && e.target === e.currentTarget) requestClose();
        pressedOutside.current = false;
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={pinned}
        aria-labelledby={titleId}
        data-state={state}
        onPointerEnter={(e) => e.pointerType !== 'touch' && setDialogHovered(true)}
        onPointerLeave={() => setDialogHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onPin();
        }}
        className="pm-dialog pointer-events-auto relative flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-magenta-100/80 bg-gradient-to-br from-white via-magenta-50 to-plum-50 shadow-lift sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          aria-label={s('close')}
          className="absolute end-2.5 top-2.5 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-plum-700 shadow-soft ring-1 ring-plum-100 transition hover:bg-magenta-50 hover:text-magenta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-500 sm:end-4 sm:top-4"
        >
          <X size={20} />
        </button>

        <header className="shrink-0 border-b border-magenta-100/80 py-4 ps-5 pe-16 sm:py-5 sm:ps-8 sm:pe-20">
          <h2
            id={titleId}
            className="responsive-copy font-display text-[1.15rem] font-semibold leading-snug sm:text-[1.4rem]"
          >
            <GradientText>{label}</GradientText>
          </h2>
          {heading && heading !== label && (
            <p className="responsive-copy mt-0.5 text-[12.5px] leading-snug text-ink-muted sm:text-[13.5px]">{heading}</p>
          )}
        </header>

        <div
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta-300 sm:px-8 sm:py-6"
        >
          {(name || photo) && (
            <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="h-20 w-16 shrink-0 rounded-t-[2rem] rounded-b-lg border-2 border-white object-cover shadow-soft sm:h-24 sm:w-20 sm:rounded-t-[2.5rem]"
                />
              ) : (
                <div className="grid h-20 w-16 shrink-0 place-items-center rounded-t-[2rem] rounded-b-lg border-2 border-white bg-plum-100 text-plum-300 shadow-soft sm:h-24 sm:w-20 sm:rounded-t-[2.5rem]">
                  <Users size={26} />
                </div>
              )}
              <div className="min-w-0">
                {name && (
                  <span className="user-text block font-display text-[15px] font-semibold text-plum-800 sm:text-[17px]">
                    <GradientText>{name}</GradientText>
                  </span>
                )}
                {designation && (
                  <span className="user-text block text-[12px] text-ink-muted sm:text-[13px]">{designation}</span>
                )}
              </div>
            </div>
          )}

          <div
            className="prose-content text-[14px] leading-[1.85] sm:text-[15.5px] sm:leading-[2]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
