import type { ReactNode } from 'react';
import { useSite } from '../lib/site';

/**
 * Loading placeholders: soft blocks shaped like the content that is on its way, so
 * a page keeps its layout while the data arrives. These are the building blocks;
 * the whole-page skeletons are in PageSkeletons.tsx.
 */

export function Skeleton({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return <div aria-hidden="true" className={`${dark ? 'skeleton-dark' : 'skeleton'} ${className}`} />;
}

/** Announces the loading state to screen readers; the blocks themselves are hidden from them. */
export function Status({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { s } = useSite();
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{s('loading')}</span>
      {children}
    </div>
  );
}

/** Lines of text, the last one shorter. */
export function TextLines({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 sm:space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 sm:h-3.5 ${i === lines - 1 ? 'w-3/5' : i % 2 ? 'w-11/12' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Stands in for the rest of a long body that is still to be revealed as the reader scrolls. */
export function MoreContentSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 pt-3 sm:space-y-5 sm:pt-5 ${className}`} aria-hidden="true">
      <TextLines lines={4} />
      <TextLines lines={3} />
    </div>
  );
}
