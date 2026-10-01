import { useMemo } from 'react';
import { RichText } from './Primitives';

/** One card's worth of the page body. `heading` and `badge` are lifted from the content itself. */
type ContentSection = { heading: string; badge: string; html: string; textLength: number };

/* A section this short can share a row with the next short one on wider screens */
const SHORT_SECTION = 650;

const SEPARATOR = /^[-–—_*•]{3,}$/;
/* "01 | Title", "2. Title" or "3) Title" on a line of its own */
const NUMBERED_TITLE = /^(\d{1,2})\s*[|.)]\s+(.{2,120})$/;
const MEDIA = 'img, iframe, video, table, audio, embed, object';

const textOf = (node: Node) => (node.textContent || '').replace(/\s+/g, ' ').trim();
const htmlOf = (node: Node) => (node.nodeType === Node.ELEMENT_NODE ? (node as Element).outerHTML : node.textContent || '');

/** A lone short line with no closing punctuation reads as the section's title. */
function isTitleLine(node: Node, text: string) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  if (!/^(DIV|P)$/.test(el.tagName) || el.querySelector('ul, ol, br, ' + MEDIA)) return false;
  return text.length <= 90 && !/[.!?।:;,]$/.test(text);
}

/**
 * Splits CMS page HTML into sections at its own boundaries: "---" or <hr>
 * separators, numbered title lines ("01 | …") and h2/h3 headings. Nothing is
 * rewritten; only empty spacer lines are dropped. Without a DOM (server
 * rendering) the body stays as one section.
 */
export function splitContentSections(html: string): ContentSection[] {
  if (!html) return [];
  if (typeof DOMParser === 'undefined') return [{ heading: '', badge: '', html, textLength: html.length }];

  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  type Draft = { heading: string; badge: string; titleNode: Node | null; nodes: Node[] };
  const drafts: Draft[] = [];
  // Widened explicitly: `open()` reassigns it inside a closure
  let current = null as Draft | null;
  const open = () => {
    current = { heading: '', badge: '', titleNode: null, nodes: [] };
    drafts.push(current);
    return current;
  };

  for (const node of Array.from(body.childNodes)) {
    const text = textOf(node);
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
    const hasMedia = Boolean(el && (el.matches(MEDIA) || el.querySelector(MEDIA)));

    if (el?.tagName === 'HR' || SEPARATOR.test(text)) {
      current = null;
      continue;
    }
    if (!text && !hasMedia) continue; // spacer lines such as <div><br></div>

    const numbered = !hasMedia && el && !el.querySelector('br') ? text.match(NUMBERED_TITLE) : null;
    if ((el && /^H[1-4]$/.test(el.tagName)) || numbered) {
      const d: Draft = current && !current.nodes.length && !current.heading ? current : open();
      d.heading = numbered ? numbered[2] : text;
      d.badge = numbered ? numbered[1] : '';
      continue;
    }

    const d: Draft = current ?? open();
    if (!d.heading && !d.nodes.length && isTitleLine(node, text)) {
      d.heading = text;
      d.titleNode = node;
      continue;
    }
    d.nodes.push(node);
  }

  return drafts
    .map((d) => {
      // A "title" with nothing under it was really the content
      const nodes = !d.nodes.length && d.titleNode ? [d.titleNode] : d.nodes;
      const heading = !d.nodes.length && d.titleNode ? '' : d.heading;
      return {
        heading,
        badge: d.badge,
        html: nodes.map(htmlOf).join(''),
        textLength: nodes.reduce((n, node) => n + textOf(node).length, 0),
      };
    })
    .filter((s) => s.html || s.heading);
}

/**
 * Informational page body as a stack of content cards. Consecutive short
 * sections pair up two to a row from md; longer ones take the full width.
 */
export default function ContentCards({ html, size = 'md' }: { html: string; size?: 'md' | 'sm' }) {
  /* `sm`: tighter cards under a section heading (programme pages); card titles become h3 */
  const sm = size === 'sm';
  const Title = sm ? 'h3' : 'h2';
  const sections = useMemo(() => splitContentSections(html), [html]);
  if (!sections.length) return null;

  // Pair short sections in reading order (never reorder content to fill gaps)
  const wide: boolean[] = [];
  for (let i = 0; i < sections.length; i++) {
    const short = sections[i].textLength <= SHORT_SECTION;
    const nextShort = i + 1 < sections.length && sections[i + 1].textLength <= SHORT_SECTION;
    if (short && nextShort) {
      wide.push(false, false);
      i++;
    } else {
      wide.push(true);
    }
  }

  return (
    // `sm`: a short card paired with a long one keeps its own height instead of stretching
    <div className={`grid gap-4 md:grid-cols-2 md:gap-5 ${sm ? 'md:items-start' : ''}`}>
      {sections.map((section, i) => (
        <article
          key={i}
          className={`min-w-0 rounded-2xl border border-plum-100 bg-white shadow-soft ${sm ? 'p-5 md:p-6' : 'p-5 sm:p-6 md:p-7'} ${
            wide[i] ? 'md:col-span-2' : ''
          }`}
        >
          {section.heading && (
            <header className={`border-b border-plum-100/80 ${sm ? 'mb-3.5 pb-3' : 'mb-4 pb-3.5'}`}>
              <div className="flex min-w-0 items-start gap-3">
                {section.badge ? (
                  <span className="mt-0.5 grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-magenta-50 px-1.5 text-[12px] font-semibold text-magenta-600">
                    {section.badge}
                  </span>
                ) : (
                  <span className={`h-4 w-1 shrink-0 rounded-full bg-magenta-400 ${sm ? 'mt-1' : 'mt-2'}`} aria-hidden="true" />
                )}
                <Title
                  className={`user-text min-w-0 font-display font-semibold leading-snug text-plum-800 ${
                    sm ? 'text-[1rem] md:text-[1.1rem]' : 'text-[1.1rem] md:text-[1.25rem]'
                  }`}
                >
                  {section.heading}
                </Title>
              </div>
            </header>
          )}
          {section.html && (
            <RichText
              html={section.html}
              className={`content-card-body ${sm ? 'text-[14.5px] leading-[1.8] md:text-[15px]' : ''}`}
            />
          )}
        </article>
      ))}
    </div>
  );
}
