'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useCart } from '../../cart/CartContext';
import { getProduct } from '../../data/site';
import { imgUrl } from '../../data/images';
import { trackAddToCartToastShown, trackCartDrawerOpenedManually } from '../../analytics/events';
import { useDictionary } from '../../i18n/ui-locale';
import { formatEgp } from '../../utils/formatPrice';
import { AppIcon } from '../AppIcon';

const DESKTOP_DISMISS_MS = 10_000;
const MOBILE_DISMISS_MS = 5_500;
const MOBILE_MAX_WIDTH_PX = 640;

export function AddToCartToast() {
  const { addToCartToastOpen, dismissAddToCartToast, lastAddedItem } = useCart();
  const copy = useDictionary();
  const toastCopy = copy.cart;
  const miniCopy = copy.miniCart;
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);
  const [compactViewport, setCompactViewport] = useState(false);

  const dismissMs = compactViewport ? MOBILE_DISMISS_MS : DESKTOP_DISMISS_MS;

  const close = useCallback(() => {
    dismissAddToCartToast();
  }, [dismissAddToCartToast]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const sync = () => setCompactViewport(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!addToCartToastOpen) {
      trackedRef.current = false;
      return;
    }
    if (!trackedRef.current && lastAddedItem) {
      trackedRef.current = true;
      trackAddToCartToastShown(lastAddedItem.productSlug);
    }
    timerRef.current = setTimeout(close, dismissMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [addToCartToastOpen, close, dismissMs, lastAddedItem]);

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
    timerRef.current = setTimeout(close, dismissMs);
  }, [close, dismissMs]);

  const handleViewBag = useCallback(() => {
    trackCartDrawerOpenedManually('view_bag_toast');
    close();
    requestAnimationFrame(() => router.push('/cart'));
  }, [close, router]);

  if (!addToCartToastOpen || !lastAddedItem) return null;

  const addedProduct = getProduct(lastAddedItem.productSlug);
  const addedName = lastAddedItem.productName ?? addedProduct?.name ?? 'Item';
  const addedImage = lastAddedItem.imageSrc ?? addedProduct?.media?.main ?? addedProduct?.thumbnail;
  const addedPrice = lastAddedItem.unitPriceEgp ?? addedProduct?.priceEgp ?? 0;

  return createPortal(
    <div
      className={`add-to-cart-toast-host${compactViewport ? ' add-to-cart-toast-host--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={miniCopy.dialogLabel}
      onPointerEnter={pauseTimer}
      onPointerLeave={resumeTimer}
      onFocusCapture={pauseTimer}
      onBlurCapture={resumeTimer}
    >
      <div ref={panelRef} className={`add-to-cart-toast${compactViewport ? ' add-to-cart-toast--compact' : ''}`}>
        <header className="add-to-cart-toast__header">
          <div className="add-to-cart-toast__header-title">
            <span className="mini-cart-check" aria-hidden>
              ✓
            </span>
            <span className="mini-cart-added-label">{toastCopy.addedToBag}</span>
          </div>
          <button
            type="button"
            className="mini-cart-close add-to-cart-toast__close"
            aria-label={miniCopy.closeLabel}
            onClick={close}
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </header>

        <div className="add-to-cart-toast__rich">
          <div className="mini-cart-item add-to-cart-toast__item">
            {addedImage ? (
              <div className="mini-cart-item-image">
                <img src={imgUrl(addedImage, 240)} alt="" width={92} height={115} />
              </div>
            ) : (
              <div className="mini-cart-item-image add-to-cart-toast__image-placeholder" aria-hidden />
            )}
            <div className="mini-cart-item-info">
              <p className="mini-cart-item-name">{addedName}</p>
              <p className="mini-cart-item-meta">
                {miniCopy.sizeLabel}: {lastAddedItem.size} · {miniCopy.qtyLabel}: {lastAddedItem.qty}
              </p>
              <p className="mini-cart-item-price">{formatEgp(addedPrice)}</p>
            </div>
          </div>
        </div>

        <div className="add-to-cart-toast__actions">
          <button type="button" className="mini-cart-cta-primary add-to-cart-toast__cta" onClick={handleViewBag}>
            {toastCopy.viewBag}
          </button>
          <button type="button" className="mini-cart-cta-continue add-to-cart-toast__cta" onClick={close}>
            {toastCopy.continueShopping}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
