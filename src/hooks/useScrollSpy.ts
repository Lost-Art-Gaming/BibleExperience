import { useEffect, useState } from 'react';

/**
 * Tracks which of the given element ids is currently "in view" while the
 * user scrolls, for driving a section-rail's active highlight.
 *
 * Uses an IntersectionObserver over the elements (skipping any id that
 * doesn't resolve to a mounted element). Among the entries currently
 * intersecting the viewport band, picks the topmost one (smallest
 * `boundingClientRect.top`) so the highlight tracks the section the reader
 * is actually at, not just the first one that ever intersected.
 *
 * Falls back to the first id (or '') when nothing is intersecting yet, e.g.
 * before the first scroll/layout pass.
 */
export function useScrollSpy(ids: string[]): string {
  const key = ids.join('|');
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (ids.length === 0) {
      setActiveId('');
      return;
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      setActiveId(ids[0]);
      return;
    }

    setActiveId((current) => (ids.includes(current) ? current : ids[0]));

    const visible = new Map<string, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry);
          else visible.delete(entry.target.id);
        });

        if (visible.size === 0) return;

        const topmost = Array.from(visible.values()).reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        setActiveId(topmost.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // `ids` is intentionally excluded: `key` (its joined value) already
    // captures every change that matters, and re-deriving `ids` here would
    // just re-run this effect on every render for referentially-new but
    // content-identical arrays.
  }, [key]);

  return activeId;
}
