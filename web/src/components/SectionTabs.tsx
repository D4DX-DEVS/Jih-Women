import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SectionsDoc } from '../lib/sections';
import LazyHtml from './LazyHtml';

const STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

/**
 * A page body the editors split into sections: every section's title is a button,
 * and the chosen section's content shows beside it (below the buttons on phones, where
 * they form a row to swipe along). The buttons stay in view while a long section is read.
 * Untitled sections are numbered. The optional intro sits above all of it and stays put
 * whichever section is open.
 */
export default function SectionTabs({ content: { intro, sections } }: { content: SectionsDoc }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const count = sections.length;
  const current = Math.min(active, Math.max(count - 1, 0));

  // The buttons stay in view while a long section scrolls, so a new section can be picked from
  // deep inside the old one: bring its start back under the buttons
  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      return;
    }
    const el = panel.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [current]);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let next: number;
    if (e.key in STEP) next = (i + STEP[e.key] + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    else return;
    e.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  const introBlock = intro && (
    <div
      className={`prose-content ${
        count ? 'mb-4 border-b border-plum-100/80 pb-4 sm:mb-7 sm:pb-7' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: intro }}
    />
  );
  if (!count) return <>{introBlock}</>;

  return (
    <>
      {introBlock}
      <div className="md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
        {/* The buttons stay in view while a long section scrolls: a row under the header on
            phones (swipe sideways if there are many), a column beside the content from md */}
        <div
          role="tablist"
          className="slim-scroll max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden sticky top-11 z-20 -mx-3.5 mb-2.5 flex gap-1.5 overflow-x-auto bg-white/95 px-3.5 py-2 backdrop-blur sm:-mx-7 sm:px-7 md:top-24 md:-mx-1 md:-my-1 md:mb-0 md:max-h-[calc(100vh-7.5rem)] md:flex-col md:gap-2 md:self-start md:overflow-y-auto md:overflow-x-hidden md:bg-transparent md:p-1 md:pe-7 md:backdrop-blur-none"
        >
          {sections.map((section, i) => (
            <button
              key={i}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === current}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === current ? 0 : -1}
              onClick={() => {
                setActive(i);
                buttons.current[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`user-text shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-start md:whitespace-normal text-[12.5px] font-semibold leading-snug ring-1 transition sm:text-[13.5px] md:py-2.5 ${
                i === current
                  ? 'bg-magenta-500 text-white shadow-soft ring-magenta-500'
                  : 'bg-white text-plum-800 ring-inset ring-plum-100 hover:bg-magenta-50 hover:text-magenta-600 hover:ring-magenta-200'
              }`}
            >
              {section.title || i + 1}
            </button>
          ))}
        </div>
        <div
          key={current}
          ref={panel}
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${current}`}
          className="min-w-0 scroll-mt-28 animate-fade-in md:scroll-mt-24 md:border-s md:border-plum-100 md:ps-7"
        >
          {/* A long section loads a piece at a time as the reader scrolls */}
          <LazyHtml html={sections[current].html} className="prose-content" />
        </div>
      </div>
    </>
  );
}
