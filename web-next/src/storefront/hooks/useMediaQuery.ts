import { useEffect, useState } from 'react';

/**
 * Client-only breakpoint match; avoids duplicate responsive trees (e.g. PDP layout).
 */
export function useMediaQuery(query: string): boolean {
  // Keep first server + client render aligned; hydrate the media query after mount.
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
