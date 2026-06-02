'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useCart } from '../../cart/CartContext';
import { trackAddToCartToastShown, trackCartDrawerOpenedManually } from '../../analytics/events';
import { useDictionary } from '../../i18n/ui-locale';

const AUTO_DISMISS_MS = 5000;

export function AddToCartToast() {
  const { addToCartToastOpen, dismissAddToCartToast, lastAddedItem } = useCart();
  const copy = useDictionary();
  const toastCopy = copy.cart;
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);

  const close = useCallback(() => {
    dismissAddToCartToast();
  }, [dismissAddToCartToast]);

  useEffect(() => {
    if (!addToCartToastOpen) {
      document.documentElement.style.removeProperty('--horo-bottom-fab-offset');
      return;
    }
    document.documentElement.style.setProperty('--horo-bottom-fab-offset', '5.5rem');
    return () => {
      document.documentElement.style.removeProperty('--horo-bottom-fab-offset');
    };
  }, [addToCartToastOpen]);

  useEffect(() => {
    if (!addToCartToastOpen) {
      trackedRef.current = false;
      return;
    }
    if (!trackedRef.current && lastAddedItem) {
      trackedRef.current = true;
      trackAddToCartToastShown(lastAddedItem.productSlug);
    }
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [addToCartToastOpen, close, lastAddedItem]);

  useEffect(() => {
    if (!addToCartToastOpen) return;
    const onScroll = () => close();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [addToCartToastOpen, close]);

  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!addToCartToastOpen) return;
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      close();
    }
  }, [pathname, close, addToCartToastOpen]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
  }, [close]);

  const handleViewBag = useCallback(() => {
    trackCartDrawerOpenedManually('view_bag_toast');
    close();
    requestAnimationFrame(() => router.push('/cart'));
  }, [close, router]);

  if (!addToCartToastOpen || !lastAddedItem) return null;

  return createPortal(
    <div
      className="add-to-cart-toast-host"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onPointerEnter={pauseTimer}
      onPointerLeave={resumeTimer}
      onFocusCapture={pauseTimer}
      onBlurCapture={resumeTimer}
    >
      <div ref={panelRef} className="add-to-cart-toast">
        <p className="add-to-cart-toast__title">
          <span className="mini-cart-check" aria-hidden>
            ✓
          </span>
          {toastCopy.addedToBag}
        </p>
        <div className="add-to-cart-toast__actions">
          <button type="button" className="add-to-cart-toast__cta add-to-cart-toast__cta--primary" onClick={handleViewBag}>
            {toastCopy.viewBag}
          </button>
          <button type="button" className="add-to-cart-toast__cta add-to-cart-toast__cta--ghost" onClick={close}>
            {toastCopy.continueShopping}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
