import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackHoroFunnelStep } from '../analytics/funnel';

function pathSegment(pathname: string): { type: 'pdp'; slug: string } | { type: 'feelings' } | { type: 'other' } {
  if (pathname.startsWith('/products/')) {
    const slug = pathname.slice('/products/'.length).split('/')[0] ?? '';
    return slug ? { type: 'pdp', slug } : { type: 'other' };
  }
  if (pathname === '/feelings' || pathname.startsWith('/feelings/')) return { type: 'feelings' };
  if (pathname === '/vibes' || pathname.startsWith('/vibes/')) return { type: 'feelings' };
  return { type: 'other' };
}

/**
 * Detects navigation away from `/` to feelings (or legacy /vibes) or PDP for baseline funnel metrics.
 */
export function FunnelNavigationTracker() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;

    if (prev !== '/') return;

    const next = pathSegment(location.pathname);
    if (next.type === 'feelings') {
      trackHoroFunnelStep({ step: 'home_to_feelings' });
    } else if (next.type === 'pdp') {
      trackHoroFunnelStep({ step: 'home_to_pdp', target: next.slug });
    }
  }, [location.pathname]);

  return null;
}
