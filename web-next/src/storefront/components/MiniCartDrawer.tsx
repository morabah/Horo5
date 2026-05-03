import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { useCart } from '../cart/CartContext';
import { getProduct } from '../data/site';
import { MINI_CART_SCHEMA } from '../data/domain-config';
import { imgUrl } from '../data/images';
import { formatEgp } from '../utils/formatPrice';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import {
  fetchStorefrontIncentivesClient,
  pickLocalizedText,
  type StorefrontIncentivesClient,
} from '../lib/storefront/incentives-client';
import { AppIcon } from './AppIcon';

const AUTO_DISMISS_MS = 5000;


export function MiniCartDrawer() {
  const {
    miniCartOpen,
    setMiniCartOpen,
    items,
    lastAddedItem,
    subtotalEgp,
    totalQty,
    cartPromotionDiscountEgp,
    giftWrapEgp,
    giftWrapCatalogPriceEgp,
    addGiftWrap,
    removeGiftWrap,
  } =
    useCart();
  const { locale } = useUiLocale();
  const cartCopy = useDictionary().cart;
  const copy = useDictionary().miniCart;
  const isArabic = locale === 'ar';
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [incentives, setIncentives] = useState<StorefrontIncentivesClient | null>(null);

  /* Fetch incentives after mount so SSR / first client render stay matched. */
  useEffect(() => {
    if (!miniCartOpen) return;
    let cancelled = false;
    void fetchStorefrontIncentivesClient().then((data) => {
      if (cancelled) return;
      setIncentives(data);
    });
    return () => {
      cancelled = true;
    };
  }, [miniCartOpen]);

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
    requestAnimationFrame(() => router.push('/cart'));
  }, [close, router]);

  const handleCheckout = useCallback(() => {
    close();
    requestAnimationFrame(() => router.push('/checkout'));
  }, [close, router]);

  const productPromoSavingsEgp = useMemo(() => {
    return items.reduce((sum, line) => {
      const product = getProduct(line.productSlug);
      const variant = product?.variantsBySize?.[line.size];
      const salePrice = line.unitPriceEgp ?? variant?.priceEgp ?? product?.priceEgp ?? 0;
      const originalPrice = variant?.originalPriceEgp ?? product?.originalPriceEgp ?? null;
      if (typeof originalPrice !== 'number' || originalPrice <= salePrice) return sum;
      return sum + (originalPrice - salePrice) * line.qty;
    }, 0);
  }, [items]);
  const giftWrapDisplayPriceEgp = incentives?.giftWrapPriceEgp ?? giftWrapCatalogPriceEgp;

  if (!miniCartOpen || !lastAddedItem) return null;

  const addedProduct = getProduct(lastAddedItem.productSlug);
  const addedName = lastAddedItem.productName ?? addedProduct?.name ?? 'Item';
  const addedImage = lastAddedItem.imageSrc ?? addedProduct?.media?.main ?? addedProduct?.thumbnail;
  const addedPrice = lastAddedItem.unitPriceEgp ?? addedProduct?.priceEgp ?? 0;
  const itemCountLabel = totalQty === 1 ? copy.itemSingular : copy.itemPlural;
  const trustItems = isArabic ? MINI_CART_SCHEMA.trustItemsAr : MINI_CART_SCHEMA.trustItems;

  return createPortal(
    <div className="mini-cart-overlay" aria-hidden={!miniCartOpen}>
      {/* Scrim */}
      <button
        type="button"
        tabIndex={-1}
        className="mini-cart-scrim"
        aria-label={copy.scrimLabel}
        onClick={close}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialogLabel}
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
            <span className="mini-cart-added-label">{copy.addedLabel}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="mini-cart-close"
            aria-label={copy.closeLabel}
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
              {copy.sizeLabel}: {lastAddedItem.size} · {copy.qtyLabel}: {lastAddedItem.qty}
            </p>
            <p className="mini-cart-item-price">{formatEgp(addedPrice)}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mini-cart-summary">
          {productPromoSavingsEgp > 0 ? (
            <p className="mini-cart-summary-line text-deep-teal">
              <span>{isArabic ? 'وفرت' : 'You saved'}</span>
              <span className="mini-cart-summary-value">{formatEgp(productPromoSavingsEgp)}</span>
            </p>
          ) : null}
          <p className="mini-cart-summary-line">
            <span>{copy.subtotalLabel} ({totalQty} {itemCountLabel})</span>
            <span className="mini-cart-summary-value">{formatEgp(subtotalEgp)}</span>
          </p>
          {cartPromotionDiscountEgp > 0 ? (
            <p className="mini-cart-summary-line text-deep-teal">
              <span>{copy.promotionDiscountLabel}</span>
              <span className="mini-cart-summary-value">−{formatEgp(cartPromotionDiscountEgp)}</span>
            </p>
          ) : null}
          <p className="mini-cart-summary-note font-body text-xs text-warm-charcoal">
            {copy.shippingAtCheckoutNote}
          </p>
        </div>

        {/*
          Audit S8: free-shipping progress.
          Threshold + label come from the native Medusa Promotion via /storefront/incentives.
          Cart math (shipping_total going to 0 once subtotal ≥ threshold) is computed by Medusa,
          not the storefront. Hidden when no automatic free-ship promotion is configured.
        */}
        {incentives?.freeShipping && incentives.freeShipping.thresholdEgp > 0 ? (() => {
          const threshold = incentives.freeShipping.thresholdEgp;
          const remaining = Math.max(0, threshold - subtotalEgp);
          const pct = Math.min(100, Math.max(0, Math.round((subtotalEgp / threshold) * 100)));
          const unlocked = subtotalEgp >= threshold;
          const labelFromOps = pickLocalizedText(incentives.freeShipping.label, isArabic ? 'ar' : 'en');
          const headline = unlocked
            ? isArabic
              ? 'مبروك! تم تفعيل الشحن المجاني'
              : 'Free shipping unlocked'
            : isArabic
              ? `أضف ${formatEgp(remaining)} للحصول على شحن مجاني`
              : `Add ${formatEgp(remaining)} for free shipping`;
          return (
            <div className="mini-cart-freeship" role="status" aria-live="polite">
              <p className="mini-cart-freeship-headline">{headline}</p>
              <div
                className="mini-cart-freeship-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <span className="mini-cart-freeship-fill" style={{ width: `${pct}%` }} />
              </div>
              {labelFromOps ? (
                <p className="mini-cart-freeship-label">{labelFromOps}</p>
              ) : null}
            </div>
          );
        })() : null}

        {(incentives?.giftWrapProductHandle || giftWrapDisplayPriceEgp) ? (
          <div className="rounded-xl border border-stone/45 bg-white/75 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                  {pickLocalizedText(incentives?.giftWrapLabel, isArabic ? 'ar' : 'en') ?? (isArabic ? 'تغليف هدية' : 'Gift wrap')}
                </p>
                <p className="font-body mt-1 text-xs text-warm-charcoal">
                  {giftWrapDisplayPriceEgp
                    ? `${isArabic ? 'أضفها للطلب' : 'Add it to this order'} (+${formatEgp(giftWrapDisplayPriceEgp)})`
                    : isArabic ? 'جاهزة كإضافة في السلة' : 'Available as a cart add-on'}
                </p>
              </div>
              <button
                type="button"
                className="font-label inline-flex min-h-11 shrink-0 items-center rounded-full border border-obsidian px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-obsidian hover:text-white"
                onClick={() => {
                  if (giftWrapEgp > 0) {
                    removeGiftWrap();
                  } else {
                    void addGiftWrap();
                  }
                }}
              >
                {giftWrapEgp > 0 ? (isArabic ? 'إزالة' : 'Remove') : (isArabic ? 'أضف' : 'Add')}
              </button>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="mini-cart-actions">
          <button
            type="button"
            className="mini-cart-cta-primary"
            onClick={handleCheckout}
          >
            {copy.checkoutCta}
          </button>
          <button
            type="button"
            className="mini-cart-cta-secondary"
            onClick={handleViewBag}
          >
            {copy.viewBagCta} ({totalQty})
          </button>
          <button
            type="button"
            className="mini-cart-cta-continue"
            onClick={close}
          >
            {copy.continueCta}
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
