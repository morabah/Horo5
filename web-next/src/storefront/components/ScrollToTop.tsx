import { usePathname } from 'next/navigation';
import { useEffect } from 'react';


/**
 * Scrolls the window to top on every route change.
 * Mount once inside the router (e.g. Layout).
 *
 * Hash-based scroll (e.g. #feeling-collection-products) is intentionally
 * excluded — those anchors manage their own scrollIntoView.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
