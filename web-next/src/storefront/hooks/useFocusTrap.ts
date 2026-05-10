'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([aria-hidden="true"])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap focus within a container element while it is active.
 * Restores focus to the previously focused element when deactivated.
 */
export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Focus first focusable element inside container
      const container = containerRef.current;
      if (container) {
        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const first = focusables[0];
        if (first) {
          window.setTimeout(() => first.focus(), 0);
        }
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusables = Array.from(
        (container as HTMLDivElement).querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  return containerRef;
}
