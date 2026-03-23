import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Tracks which homepage editorial vibe section sits in the reading band while scrolling.
 * Returns null when not on `/`, when trust/stories area clears context, or when no section matches.
 */
export function useHomeVibeScrollSpy(): string | null {
  const { pathname } = useLocation();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSlug(null);
      return;
    }

    let raf = 0;

    const compute = () => {
      const trust = document.querySelector('[data-home-end-vibes]');
      const sections = document.querySelectorAll<HTMLElement>('[data-home-vibe-section]');

      const vh = window.innerHeight;
      const bandTop = vh * 0.2;
      const bandBottom = vh * 0.55;

      if (trust) {
        const tr = trust.getBoundingClientRect();
        const overlapTrust = Math.max(0, Math.min(tr.bottom, bandBottom) - Math.max(tr.top, bandTop));
        if (overlapTrust > vh * 0.06) {
          setActiveSlug((prev) => (prev === null ? prev : null));
          return;
        }
      }

      let bestSlug: string | null = null;
      let bestOverlap = 0;
      sections.forEach((el) => {
        const slug = el.dataset.vibeSlug;
        if (!slug) return;
        const r = el.getBoundingClientRect();
        const overlap = Math.max(0, Math.min(r.bottom, bandBottom) - Math.max(r.top, bandTop));
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestSlug = slug;
        }
      });

      const next = bestOverlap > 0 ? bestSlug : null;
      setActiveSlug((prev) => (prev === next ? prev : next));
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    // After paint so Home’s articles exist
    const t = window.setTimeout(() => {
      compute();
    }, 0);

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [pathname]);

  return pathname === '/' ? activeSlug : null;
}
