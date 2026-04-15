import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, usePathname } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useCart } from '../cart/CartContext';
import { getProduct } from '../data/site';
import { MINI_CART_SCHEMA } from '../data/domain-config';
import { imgUrl } from '../data/images';
import { formatEgp } from '../utils/formatPrice';
import { useUiLocale } from '../i18n/ui-locale';
import { AppIcon } from './AppIcon';

const AUTO_DISMISS_MS = 5000;

/** Pick English or Arabic copy from MINI_CART_SCHEMA */
function t(key: keyof typeof MINI_CART_SCHEMA.copy, isArabic: boolean): string {
  const arKey = `${key}Ar` as keyof typeof MINI_CART_SCHEMA.copy;
  return isArabic && arKey in MINI_CART_SCHEMA.copy
    ? MINI_CART_SCHEMA.copy[arKey]
    : MINI_CART_SCHEMA.copy[key];
}

export function MiniCartDrawer() {
  const { miniCartOpen, setMiniCartOpen, lastAddedItem, subtotalEgp, totalQty } = useCart();
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const navigate = useNavigate();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setMiniCartOpen(false);
  }, [setMiniCartOpen]);

  /* Auto-dismiss after a short idle window */
  useEffect(() => {
    if (!miniCartOpen) return;
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [miniCartOpen, close]);

  /* Dismiss when the user scrolls the page (they moved on from the toast) */
  useEffect(() => {
    if (!miniCartOpen) return;
    const onScroll = () => close();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [miniCartOpen, close]);

  /* Pause auto-dismiss on hover/focus */
  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
  }, [close]);

  /* Focus trap + ESC */
  useEffect(() => {
    if (!miniCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);

    requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [miniCartOpen, close]);

  /* Close when the route changes (not on first mount), so the drawer does not leak across pages */
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      close();
    }
  }, [pathname, close]);

  const handleViewBag = useCallback(() => {
    close();
    navigate('/cart');
  }, [close, navigate]);

  const handleCheckout = useCallback(() => {
    close();
    navigate('/checkout');
  }, [close, navigate]);

  if (!miniCartOpen || !lastAddedItem) return null;

  const addedProduct = getProduct(lastAddedItem.productSlug);
  const addedName = lastAddedItem.productName ?? addedProduct?.name ?? 'Item';
  const addedImage = lastAddedItem.imageSrc ?? addedProduct?.media?.main ?? addedProduct?.thumbnail;
  const addedPrice = lastAddedItem.unitPriceEgp ?? addedProduct?.priceEgp ?? 0;
  const itemCountLabel = totalQty === 1 ? t('itemSingular', isArabic) : t('itemPlural', isArabic);
  const trustItems = isArabic ? MINI_CART_SCHEMA.trustItemsAr : MINI_CART_SCHEMA.trustItems;

  return createPortal(
    <div className="mini-cart-overlay" aria-hidden={!miniCartOpen}>
      {/* Scrim */}
      <button
        type="button"
        tabIndex={-1}
        className="mini-cart-scrim"
        aria-label={t('scrimLabel', isArabic)}
        onClick={close}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('dialogLabel', isArabic)}
        className="mini-cart-panel"
        dir={isArabic ? 'rtl' : undefined}
        onPointerEnter={pauseTimer}
        onPointerLeave={resumeTimer}
        onFocusCapture={pauseTimer}
        onBlurCapture={resumeTimer}
      >
        {/* Header */}
        <div className="mini-cart-header">
          <div className="mini-cart-header-title">
            <span className="mini-cart-check" aria-hidden>✓</span>
            <span className="mini-cart-added-label">{t('addedLabel', isArabic)}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="mini-cart-close"
            aria-label={t('closeLabel', isArabic)}
            onClick={close}
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Added item */}
        <div className="mini-cart-item">
          {addedImage ? (
            <div className="mini-cart-item-image">
              <img
                src={imgUrl(addedImage, 200)}
                alt={`${addedName}`}
                width={200}
                height={250}
              />
            </div>
          ) : null}
          <div className="mini-cart-item-info">
            <p className="mini-cart-item-name">{addedName}</p>
            <p className="mini-cart-item-meta">
              {t('sizeLabel', isArabic)}: {lastAddedItem.size} · {t('qtyLabel', isArabic)}: {lastAddedItem.qty}
            </p>
            <p className="mini-cart-item-price">{formatEgp(addedPrice)}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mini-cart-summary">
          <p className="mini-cart-summary-line">
            <span>{t('subtotalLabel', isArabic)} ({totalQty} {itemCountLabel})</span>
            <span className="mini-cart-summary-value">{formatEgp(subtotalEgp)}</span>
          </p>
          <p className="mini-cart-summary-note font-body text-xs text-warm-charcoal">
            {t('shippingAtCheckoutNote', isArabic)}
          </p>
        </div>

        {/* Actions */}
        <div className="mini-cart-actions">
          <button
            type="button"
            className="mini-cart-cta-primary"
            onClick={handleCheckout}
          >
            {t('checkoutCta', isArabic)}
          </button>
          <button
            type="button"
            className="mini-cart-cta-secondary"
            onClick={handleViewBag}
          >
            {t('viewBagCta', isArabic)} ({totalQty})
          </button>
          <button
            type="button"
            className="mini-cart-cta-continue"
            onClick={close}
          >
            {t('continueCta', isArabic)}
          </button>
        </div>

        {/* Trust */}
        <ul className="mini-cart-trust" aria-label="Trust signals">
          {trustItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
