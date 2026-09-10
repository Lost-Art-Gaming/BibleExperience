import { useEffect, useState } from 'react';

/**
 * Reactively tracks a media query. Used to render genuinely different
 * Tapestry experiences on desktop (the loom) vs mobile (pull-the-threads),
 * rather than scaling one layout down.
 */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (!('matchMedia' in window)) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
