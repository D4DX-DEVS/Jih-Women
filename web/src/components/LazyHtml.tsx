import { useLayoutEffect, useMemo, useRef } from 'react';
import { useRevealOnScroll } from '../lib/reveal';
import { MoreContentSkeleton } from './Skeleton';

/** Bodies shorter than this render in one go; longer ones are cut into steps of about `CHUNK_CHARS`. */
const LAZY_FROM = 9000;
const CHUNK_CHARS = 6000;

const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Cuts a long HTML body into pieces at its top-level blocks (paragraphs, headings,
 * lists…), so no block is ever split. Short bodies, and anything that cannot be
 * parsed here (no DOM), stay as one piece.
 */
export function chunkHtml(html: string): string[] {
  if (html.length < LAZY_FROM || typeof DOMParser === 'undefined') return [html];

  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  const chunks: string[] = [];
  let current = '';
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) current += (node as Element).outerHTML;
    else if (node.nodeType === Node.TEXT_NODE) current += escapeText(node.textContent || '');
    else continue;
    if (current.length >= CHUNK_CHARS) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 1 ? chunks : [html];
}

/**
 * A rich-text body that loads as the reader scrolls: the first piece shows at once and
 * the rest follow when the end of the page nears, with a skeleton as the placeholder.
 * Pieces are added to one container, so the content's own styles (first child, spacing
 * between blocks…) behave exactly as if it had been rendered whole.
 */
export default function LazyHtml({ html, className = '' }: { html: string; className?: string }) {
  const chunks = useMemo(() => chunkHtml(html), [html]);
  const { shown, more, marker } = useRevealOnScroll(chunks.length, chunks);
  const box = useRef<HTMLDivElement>(null);
  const applied = useRef<{ chunks: string[] | null; count: number }>({ chunks: null, count: 0 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const done = applied.current;
    if (done.chunks !== chunks) {
      el.innerHTML = '';
      done.chunks = chunks;
      done.count = 0;
    }
    while (done.count < shown) el.insertAdjacentHTML('beforeend', chunks[done.count++]);
  }, [chunks, shown]);

  return (
    <>
      <div ref={box} className={className} />
      {more && (
        <div ref={marker}>
          <MoreContentSkeleton />
        </div>
      )}
    </>
  );
}
