import { useEffect, useState } from 'react';

/**
 * Client-only breakpoint match. Use ONLY for non-critical post-hydration behavior
 * (e.g. closing a mobile panel on resize). Do NOT use for first-paint layout
 * branches or conditional rendering that affects SSR/hydration alignment.
 * For layout differences, prefer Tailwind responsive prefixes (md:, lg:) instead.
 */
export function useMediaQuery(query: string): boolean {
  // Default false on SSR and first client render; hydrate the actual match after mount.
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
