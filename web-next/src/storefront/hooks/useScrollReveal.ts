import { useEffect } from 'react';

const SELECTOR = '[data-reveal]';
const PENDING_CLASS = 'data-reveal-pending';
const REVEALED_CLASS = 'revealed';

/**
 * Observes elements with `data-reveal` and adds `revealed` when they enter the viewport.
 * Content starts visible in CSS. This hook adds `data-reveal-pending` only to nodes
 * that are off-screen before observation starts, avoiding any visible→hidden→visible
 * flicker for content already in the viewport.
 * `prefers-reduced-motion: reduce` → all matching nodes get `revealed` immediately.
 */
function observeNode(
  el: HTMLElement,
  observer: IntersectionObserver,
  reduce: boolean,
) {
  if (reduce) {
    el.classList.remove(PENDING_CLASS);
    el.classList.add(REVEALED_CLASS);
    return;
  }
  const rect = el.getBoundingClientRect();
  const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
  if (inViewport) {
    observer.observe(el);
  } else {
    el.classList.add(PENDING_CLASS);
    observer.observe(el);
  }
}

export function useScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.remove(PENDING_CLASS);
            target.classList.add(REVEALED_CLASS);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    const initialNodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    initialNodes.forEach((el) => observeNode(el, observer, reduce));

    let mutationObserver: MutationObserver | null = null;
    if (!reduce && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.matches(SELECTOR)) {
                observeNode(node, observer, reduce);
              }
              node.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => observeNode(el, observer, reduce));
            }
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);
}
