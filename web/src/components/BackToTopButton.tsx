import { useCallback, useEffect, useState } from 'react';

const SHOW_THRESHOLD = 800; // px
const SCROLL_DEBOUNCE = 120; // ms

/**
 * Floating "↑ Back to top" button that appears after scrolling
 * past SHOW_THRESHOLD pixels. Hidden when the sticky ATC bar,
 * mini-cart drawer, or WhatsApp FAB occupy the bottom area.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setVisible(window.scrollY > SHOW_THRESHOLD);
      }, SCROLL_DEBOUNCE);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'back-to-top--visible' : ''}`}
      aria-label="Scroll to top"
      onClick={scrollToTop}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
