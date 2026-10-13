/**
 * Section-wise content. A rich-text field normally holds one HTML string. In
 * "sections" mode the same string holds a run of top-level
 * <section data-title="…">…</section> blocks, one per section, so no schema or
 * API change is needed. An optional first <section data-intro>…</section> holds
 * content shown above the section buttons whichever section is open. The public
 * site (web/src/lib/sections.ts) reads the same format and shows each section's
 * title as a button.
 */

export type Section = { id: string; title: string; html: string };
/** Sections mode content: the constant intro (may be empty) and the sections */
export type SectionsDraft = { intro: string; sections: Section[] };

let counter = 0;
export const newSectionId = () => `section-${++counter}`;

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** True when the HTML has no visible text and no media (e.g. "<div><br></div>"). */
export function isBlankHtml(html: string): boolean {
  if (/<(img|iframe|video|audio|embed|object|table)\b/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * Reads sectioned HTML. Returns null for ordinary content: anything that is not
 * made up entirely of top-level <section data-title> blocks (after an optional
 * leading <section data-intro>) stays a plain body.
 */
export function parseSections(html: string): SectionsDraft | null {
  if (!html || !/<section\b/i.test(html)) return null;
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

  let intro = '';
  let seenIntro = false;
  const sections: Section[] = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) continue;
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent || '').trim()) continue;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
    if (!el || el.tagName !== 'SECTION') return null;
    if (el.hasAttribute('data-title')) {
      sections.push({ id: newSectionId(), title: el.getAttribute('data-title') || '', html: el.innerHTML });
    } else if (el.hasAttribute('data-intro') && !seenIntro && !sections.length) {
      intro = el.innerHTML;
      seenIntro = true;
    } else {
      return null;
    }
  }
  return seenIntro || sections.length ? { intro, sections } : null;
}

/** Writes sections back to a single HTML string. Blank intro and completely empty sections are dropped. */
export function serializeSections({ intro, sections }: SectionsDraft): string {
  const head = isBlankHtml(intro) ? '' : `<section data-intro>${intro}</section>`;
  return (
    head +
    sections
      .filter((s) => s.title.trim() || !isBlankHtml(s.html))
      .map((s) => `<section data-title="${escapeAttr(s.title.trim())}">${s.html}</section>`)
      .join('')
  );
}

/** Merges everything into one body for the single-editor mode; titles become H2 headings. */
export function flattenSections({ intro, sections }: SectionsDraft): string {
  return (
    (isBlankHtml(intro) ? '' : intro) +
    sections.map((s) => (s.title.trim() ? `<h2>${escapeText(s.title.trim())}</h2>` : '') + s.html).join('')
  );
}
