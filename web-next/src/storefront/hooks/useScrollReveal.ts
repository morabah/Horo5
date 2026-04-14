import { useEffect } from 'react';

const SELECTOR = '[data-reveal]';

/**
 * Observes elements with `data-reveal` and adds `revealed` when they enter the viewport.
 * `prefers-reduced-motion: reduce` → all matching nodes get `revealed` immediately (no wait).
 */
export function useScrollReveal() {
  useEffect(() => {
    // Runs once on mount: only nodes present in the DOM at this moment are observed.
    // Dynamically inserted `[data-reveal]` nodes later in the tree are not picked up.
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    if (nodes.length === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      nodes.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
