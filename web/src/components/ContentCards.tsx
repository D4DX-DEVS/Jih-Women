import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { parseSections } from '../lib/sections';
import { useRevealOnScroll } from '../lib/reveal';
import { PanelSection, RichText } from './Primitives';
import SectionTabs from './SectionTabs';
import { MoreContentSkeleton } from './Skeleton';

/** One card's worth of the page body. `heading` and `badge` are lifted from the content itself. */
type ContentSection = { heading: string; badge: string; html: string; textLength: number };

/* A long page shows this much text (characters of HTML) at first and adds as much again
   each time the reader scrolls near the end */
const REVEAL_CHARS = 6000;

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
 * Informational page body as sections of the page's one content card
 * (`ContentPanel`): each section the content defines gets its own heading and is
 * separated from the next by a divider — no box per section. `firstTitle` names
 * an opening section that has no heading of its own (e.g. "Overview").
 */
export default function ContentSections({
  html,
  firstTitle,
  firstIcon,
}: {
  html: string;
  firstTitle?: string;
  firstIcon?: LucideIcon;
}) {
  const tabs = useMemo(() => parseSections(html), [html]);
  const sections = useMemo(() => (tabs ? [] : splitContentSections(html)), [tabs, html]);
  // Where each reveal step ends, as a count of sections (every step holds about REVEAL_CHARS)
  const stops = useMemo(() => {
    const ends: number[] = [];
    let used = 0;
    sections.forEach((section, i) => {
      used += section.html.length;
      if (used >= REVEAL_CHARS || i === sections.length - 1) {
        ends.push(i + 1);
        used = 0;
      }
    });
    return ends;
  }, [sections]);
  const { shown, more, marker } = useRevealOnScroll(stops.length, sections);
  // Editor-defined sections replace the automatic split: one button per section
  if (tabs) return <SectionTabs content={tabs} />;
  if (!sections.length) return null;

  return (
    <>
      {sections.slice(0, stops[shown - 1] ?? sections.length).map((section, i) => {
        const heading = section.heading || (i === 0 ? firstTitle : undefined);
        return (
          <PanelSection
            key={i}
            title={heading}
            badge={section.badge || undefined}
            icon={i === 0 && !section.heading ? firstIcon : undefined}
          >
            {section.html && <RichText html={section.html} className="content-card-body" />}
          </PanelSection>
        );
      })}
      {more && (
        <div ref={marker}>
          <MoreContentSkeleton />
        </div>
      )}
    </>
  );
}
