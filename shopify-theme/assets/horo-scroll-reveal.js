/**
 * HORO Scroll Reveal — IntersectionObserver-based reveal system
 * Ported from web-next data-reveal implementation.
 * Features:
 * - data-horo-reveal attribute matching
 * - Stagger delay support (stagger-1 … stagger-5)
 * - prefers-reduced-motion respect
 * - Scroll milestone tracking for GA4/GTM dataLayer
 */

(function () {
  'use strict';

  const DATA_ATTR = 'data-horo-reveal';
  const PENDING_CLASS = 'horo-reveal-pending';
  const REVEALED_CLASS = 'horo-revealed';
  const MILESTONE_ATTR = 'data-horo-scroll-milestone';

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll milestone tracking state
  const milestones = [25, 50, 75, 90];
  const firedMilestones = new Set();
  let maxScrollPercent = 0;

  function initReveal() {
    const elements = document.querySelectorAll(`[${DATA_ATTR}]`);
    if (!elements.length) return;

    if (prefersReducedMotion) {
      elements.forEach((el) => {
        el.classList.remove(PENDING_CLASS);
        el.classList.add(REVEALED_CLASS);
      });
      return;
    }

    // Set pending state before observing to avoid flash
    elements.forEach((el) => {
      if (!el.classList.contains(REVEALED_CLASS)) {
        el.classList.add(PENDING_CLASS);
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.remove(PENDING_CLASS);
            el.classList.add(REVEALED_CLASS);
            observer.unobserve(el);

            // Dispatch custom event for other components
            el.dispatchEvent(
              new CustomEvent('horo:revealed', { bubbles: true, detail: { element: el } })
            );
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.15,
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function trackScrollMilestones() {
    if (!window.dataLayer) return;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const currentPercent = Math.round((window.scrollY / docHeight) * 100);
    if (currentPercent > maxScrollPercent) {
      maxScrollPercent = currentPercent;
    }

    milestones.forEach((milestone) => {
      if (maxScrollPercent >= milestone && !firedMilestones.has(milestone)) {
        firedMilestones.add(milestone);
        window.dataLayer.push({
          event: 'horo_scroll_milestone',
          milestone_percent: milestone,
          page_path: window.location.pathname,
        });
      }
    });

    // Fire milestone attribute targets
    document.querySelectorAll(`[${MILESTONE_ATTR}]`).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elTopPercent = Math.round(
        ((window.scrollY + rect.top) / docHeight) * 100
      );
      const targetMilestone = parseInt(el.getAttribute(MILESTONE_ATTR), 10);
      if (elTopPercent <= maxScrollPercent && !firedMilestones.has('el-' + targetMilestone)) {
        firedMilestones.add('el-' + targetMilestone);
        window.dataLayer.push({
          event: 'horo_element_milestone',
          milestone_percent: targetMilestone,
          element_id: el.id || null,
          page_path: window.location.pathname,
        });
      }
    });
  }

  function initScrollMilestones() {
    if (!window.dataLayer) {
      window.dataLayer = window.dataLayer || [];
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          trackScrollMilestones();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initReveal();
      initScrollMilestones();
    });
  } else {
    initReveal();
    initScrollMilestones();
  }

  // Re-init after Shopify section re-renders (editor + dynamic sections)
  document.addEventListener('shopify:section:load', initReveal);
  document.addEventListener('shopify:block:select', initReveal);
})();
