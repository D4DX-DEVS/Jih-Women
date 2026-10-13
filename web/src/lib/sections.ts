/**
 * Section-wise CMS content. Editors can split a page body into sections in the
 * admin panel; each is stored as a top-level <section data-title="…">…</section>
 * block inside the usual HTML string, after an optional <section data-intro> that
 * holds content shown above the buttons (mirror of app/src/admin/shared/sections.ts).
 */
export type SectionDoc = { title: string; html: string };
export type SectionsDoc = { intro: string; sections: SectionDoc[] };

/**
 * Returns the intro and sections of sectioned HTML, or null for an ordinary body
 * (anything that is not made up entirely of top-level <section data-title> blocks
 * after an optional <section data-intro>), and whenever there is no DOM to parse
 * with (server rendering).
 */
export function parseSections(html: string): SectionsDoc | null {
  if (!html || typeof DOMParser === 'undefined' || !/<section\b/i.test(html)) return null;
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

  let intro = '';
  let seenIntro = false;
  const sections: SectionDoc[] = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) continue;
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent || '').trim()) continue;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
    if (!el || el.tagName !== 'SECTION') return null;
    if (el.hasAttribute('data-title')) {
      sections.push({ title: (el.getAttribute('data-title') || '').trim(), html: el.innerHTML });
    } else if (el.hasAttribute('data-intro') && !seenIntro && !sections.length) {
      intro = el.innerHTML;
      seenIntro = true;
    } else {
      return null;
    }
  }
  return seenIntro || sections.length ? { intro, sections } : null;
}
