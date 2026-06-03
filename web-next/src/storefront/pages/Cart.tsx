'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useRef, useState } from 'react';

import { trackCartViewed, trackGiftWrapToggle, trackShippingEstimateView } from '../analytics/events';
import { TeeImageFrame } from '../components/TeeImage';
import { useCart } from '../cart/CartContext';
import { formatCartStockMessage } from '../cart/stock';
import { getCartLineViews, type CartLineView } from '../cart/view';
import { cartLineIdentityKey, type CartLine } from '../cart/types';
import { ExitIntentModal } from '../components/ExitIntentModal';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { Skeleton } from '../components/ui/Skeleton';
import { CART_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { getProductCardImageSrc, giftWrapPreview, heroVectorizedV2 } from '../data/images';
import {  useUiLocale, useDictionary, type UiLocale  } from '../i18n/ui-locale';
import { useStableNow } from '../runtime/render-time';
import { getProduct, getProducts, productHasRealImage, type Product, type ProductSizeKey } from '../data/site';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { getCart, listShippingOptions } from '../lib/medusa/client';
import { productAvailableSizes } from '../utils/productSizes';
import { getFreshShippingOptions } from '../lib/medusa/checkout-aux-cache';
import {
  merchandiseSubtotalFromCartLines,
  readCheckoutDisplayShippingFallbackEgpFromEnv,
  resolveShippingQuoteFromCartAndOptions,
} from '../lib/medusa/cart-money';
import type { MedusaCart, MedusaShippingOption } from '../lib/medusa/types';
import {
  fetchStorefrontIncentivesClient,
  pickLocalizedText,
  type StorefrontIncentivesClient,
} from '../lib/storefront/incentives-client';
import { CheckoutGate } from '../components/cart/CheckoutGate';
import { DeliveryEstimatePanel } from '../components/cart/DeliveryEstimatePanel';
import { GovernorateModal } from '../components/cart/GovernorateModal';
import { cartCostPreviewCheckoutNote } from '../data/commerce-copy';
import { shippingEgpForGovernorateCode, type GovernorateRate } from '../lib/delivery/governorates';
import { useDeliveryGovernorate } from '../lib/delivery/useDeliveryGovernorate';
import { trackShippingGovernoratePrompted } from '../analytics/events';

type CartShippingFetchState =
  | { kind: 'inactive' }
  | { kind: 'pending_cart_id' }
  | { kind: 'loading' }
  | { kind: 'ok'; cart: MedusaCart; options: MedusaShippingOption[] }
  | { kind: 'error' };

type CartInitialState = 'unknown' | 'empty' | 'cart';

type CartProps = {
  /** Raw Medusa cart from RSC; when present, seeds CartContext to skip the auto-sync round-trip. */
  initialCart?: MedusaCart | null;
  initialLines?: CartLine[];
  initialGiftWrapEgp?: number;
  initialState?: CartInitialState;
};

function formatMessage(template: string, name: string) {
  return template.replace('{name}', name);
}

function formatItemCount(count: number, singular: string, plural: string) {
  const label = count === 1 ? singular : plural;
  return `${count} ${label}`;
}

function CartUpsell({
  totalQty,
  giftWrapSelected,
  giftWrapPriceEgp,
  bundle,
  locale,
  onAddGiftWrap,
  onDeclineGiftWrap,
  onRemoveGiftWrap,
}: {
  totalQty: number;
  giftWrapSelected: boolean;
  giftWrapPriceEgp: number | null;
  /** Operator-configured bundle promotion. When null the bundle slot stays hidden. */
  bundle: StorefrontIncentivesClient['bundle'];
  locale: UiLocale;
  onAddGiftWrap: () => void;
  onDeclineGiftWrap: () => void;
  onRemoveGiftWrap: () => void;
}) {
  const copy = (useDictionary().cart);

  if (totalQty === 1) {
    if (!giftWrapSelected && (!giftWrapPriceEgp || giftWrapPriceEgp <= 0)) {
      return null;
    }
    return (
      <section className="cart-upsell card-glass" aria-labelledby="cart-upsell-title">
        <div className="cart-upsell-media">
          <img src={giftWrapPreview} alt="Preview of the HORO story card and gift wrap add-on." />
        </div>
        <div className="cart-upsell-content">
          <h2 id="cart-upsell-title" className="cart-upsell-title">
            {giftWrapSelected ? copy.giftUpsellIncludedHeading : copy.giftUpsellHeading}
          </h2>
          <p className="cart-upsell-body">
            {giftWrapSelected
              ? copy.giftUpsellIncludedBody
              : giftWrapPriceEgp
                ? `${copy.giftUpsellBody} (${formatEgp(giftWrapPriceEgp)}).`
                : copy.giftUpsellBody}
          </p>
          <div className="cart-upsell-actions">
            {giftWrapSelected ? (
              <button type="button" className="btn btn-ghost" onClick={onRemoveGiftWrap}>
                {copy.giftUpsellRemove}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={onAddGiftWrap}>
                  {copy.giftUpsellCta}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onDeclineGiftWrap}>
                  {copy.giftUpsellDecline}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (totalQty >= 2 && bundle && totalQty < bundle.requireQuantity) {
    const bundleHeading = pickLocalizedText(bundle.label, locale === 'ar' ? 'ar' : 'en') ?? copy.bundleUpsellHeading;
    const remainingItems = bundle.requireQuantity - totalQty;
    const bundleBody = locale === 'ar'
      ? `أضف ${remainingItems} تصميم${remainingItems > 1 ? 'ات' : ''} آخر${remainingItems > 1 ? '' : ''} من فنان مختلف ووفّر ${bundle.applicationValue} ج.م.`
      : `Add ${remainingItems} more design${remainingItems > 1 ? 's' : ''} by a different artist and save ${bundle.applicationValue} EGP.`;
    return (
      <section className="cart-upsell card-glass" aria-labelledby="cart-upsell-title">
        <div className="cart-upsell-content cart-upsell-content--compact">
          <h2 id="cart-upsell-title" className="cart-upsell-title">
            {bundleHeading}
          </h2>
          <p className="cart-upsell-body">{bundleBody}</p>
          <div className="cart-upsell-actions">
            <Link className="btn btn-ghost" href="/products">
              {copy.bundleUpsellCta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function CartSummary({
  itemCount,
  subtotalEgp,
  productPromoSavingsEgp,
  giftWrapEgp,
  estimatedOrderTotal,
  shippingRow,
  originalShippingEgp,
  now,
  locale,
  cartService,
  incentives,
  showDeliveryEstimate,
  selectedRate,
  isDefaultEstimate,
  deliveryShippingEgp,
  deliveryEstimatedTotal,
  onChooseGovernorate,
  onChangeGovernorate,
  onProceedCheckout,
}: {
  itemCount: number;
  subtotalEgp: number;
  productPromoSavingsEgp: number;
  giftWrapEgp: number;
  estimatedOrderTotal: number | null;
  shippingRow: { mode: 'loading' } | { mode: 'amount'; egp: number } | { mode: 'copy' };
  /** Original shipping cost before free-shipping deduction (for strikethrough display). */
  originalShippingEgp: number;
  now: Date;
  locale: UiLocale;
  cartService: { shippingExplainerArabic: string; estimatedDeliveryCheckoutNoteArabic: string };
  /** Operator-controlled free-shipping incentive used for the progress bar. */
  incentives: StorefrontIncentivesClient | null;
  showDeliveryEstimate: boolean;
  selectedRate: GovernorateRate | null;
  isDefaultEstimate: boolean;
  deliveryShippingEgp: number | null;
  deliveryEstimatedTotal: number | null;
  onChooseGovernorate: () => void;
  onChangeGovernorate: () => void;
  onProceedCheckout: () => void;
}) {
  const dict = useDictionary();
  const copy = dict.cart;
  const pdpCopy = dict.pdp;
  const router = useRouter();
  const shippingNote =
    locale === 'ar' && cartService.shippingExplainerArabic.trim()
      ? cartService.shippingExplainerArabic
      : copy.shippingExplainer;
  const deliveryNote =
    locale === 'ar' && cartService.estimatedDeliveryCheckoutNoteArabic.trim()
      ? cartService.estimatedDeliveryCheckoutNoteArabic
      : copy.estimatedDeliveryCheckoutNote;

  return (
    <aside className="cart-summary card-glass order-3 md:sticky md:top-20 md:col-start-2 md:row-start-1 md:row-span-2" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className="cart-summary-title">
        {copy.orderSummaryHeading}
      </h2>
      <p className="cart-summary-note">{shippingNote}</p>
      <p className="font-body mt-1 text-xs text-clay">
        {copy.shippingEstimateBeforeCheckoutNote || cartCostPreviewCheckoutNote(locale === 'ar')}
      </p>

      {showDeliveryEstimate ? (
        <div className="mt-4">
          <DeliveryEstimatePanel
            subtotalEgp={subtotalEgp}
            shippingEgp={deliveryShippingEgp}
            estimatedTotalEgp={deliveryEstimatedTotal}
            selectedRate={selectedRate}
            isDefaultEstimate={isDefaultEstimate}
            onChooseGovernorate={onChooseGovernorate}
            onChangeGovernorate={onChangeGovernorate}
          />
        </div>
      ) : null}

      {/*
        Audit S8: free-shipping progress on the full cart page (mirrors mini-cart drawer).
        Threshold + label come from the native Medusa Promotion via /storefront/incentives.
        Cart math (shipping going to 0) is computed by Medusa at checkout, not the storefront.
      */}
      {incentives?.freeShipping && incentives.freeShipping.thresholdEgp > 0 ? (() => {
        const threshold = incentives.freeShipping.thresholdEgp;
        const remaining = Math.max(0, threshold - subtotalEgp);
        const pct = Math.min(100, Math.max(0, Math.round((subtotalEgp / threshold) * 100)));
        const unlocked = subtotalEgp >= threshold;
        const labelFromOps = pickLocalizedText(incentives.freeShipping.label, locale === 'ar' ? 'ar' : 'en');
        const headline = unlocked
          ? locale === 'ar'
            ? 'مبروك! تم تفعيل الشحن المجاني'
            : 'Free shipping unlocked'
          : locale === 'ar'
            ? `أضف ${formatEgp(remaining)} للحصول على شحن مجاني`
            : `Add ${formatEgp(remaining)} for free shipping`;
        return (
          <div className="mini-cart-freeship mt-3" role="status" aria-live="polite">
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
            {labelFromOps ? <p className="mini-cart-freeship-label">{labelFromOps}</p> : null}
          </div>
        );
      })() : null}

      <div className="cart-summary-rows">
        {productPromoSavingsEgp > 0 ? (
          <p className="cart-summary-row cart-summary-row--meta text-deep-teal">
            <span>{locale === 'ar' ? 'وفرت' : 'You saved'}</span>
            <span>{formatEgp(productPromoSavingsEgp)}</span>
          </p>
        ) : null}
        <p className="cart-summary-row">
          <span>
            {copy.subtotalLabel} ({formatItemCount(itemCount, copy.itemLabelSingular, copy.itemLabelPlural)})
          </span>
          <span>{formatEgp(subtotalEgp)}</span>
        </p>
        {giftWrapEgp > 0 ? (
          <p className="cart-summary-row cart-summary-row--meta">
            <span>{copy.giftWrapLabel}</span>
            <span>{formatEgp(giftWrapEgp)}</span>
          </p>
        ) : null}
        <p className="cart-summary-row cart-summary-row--meta">
          <span>{copy.shippingLabel}</span>
          <span className="text-right">
            {shippingRow.mode === 'loading' ? (
              <Skeleton className="inline-block h-4 w-16 align-middle" />
            ) : null}
            {shippingRow.mode === 'amount' ? (() => {
              const threshold = incentives?.freeShipping?.thresholdEgp ?? 0;
              const unlocked = threshold > 0 && subtotalEgp >= threshold;
              return unlocked ? (
                <span className="inline-flex items-baseline gap-1.5">
                  {originalShippingEgp > 0 ? (
                    <span className="font-body text-sm text-clay line-through">{formatEgp(originalShippingEgp)}</span>
                  ) : null}
                  <span className="font-body text-sm text-deep-teal">
                    {locale === 'ar' ? 'مجاني' : 'Free'}
                  </span>
                </span>
              ) : (
                formatEgp(shippingRow.egp)
              );
            })() : null}
            {shippingRow.mode === 'copy' ? (
              <span className="font-body text-sm text-warm-charcoal">
                {showDeliveryEstimate && !selectedRate
                  ? copy.cartGovernorateEmpty
                  : copy.shippingConfirmedAtCheckout}
              </span>
            ) : null}
          </span>
        </p>
        <p className="cart-summary-row cart-summary-row--meta">
          <span>{copy.estimatedDeliveryLabel}</span>
          <span className="text-right font-body text-sm">{formatDeliveryWindow(3, 5, now)}</span>
        </p>
        <p className="-mt-1 mb-2 font-body text-xs text-warm-charcoal">{deliveryNote}</p>
        <p className="cart-summary-total">
          <span>{copy.totalLabel}</span>
          <span>{estimatedOrderTotal === null ? '—' : formatEgp(estimatedOrderTotal)}</span>
        </p>
      </div>

      <div className="cart-summary-actions">
        <CheckoutGate subtotalEgp={subtotalEgp + giftWrapEgp} onProceed={onProceedCheckout}>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }}>
            {copy.primaryCta}
          </button>
        </CheckoutGate>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => router.push('/products')}
        >
          {locale === 'ar' ? 'متابعة التسوق' : 'Continue shopping'}
        </button>
      </div>

      <ul className="cart-trust-strip" aria-label="Cart trust signals">
        {CART_SCHEMA.trustStripItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl) ? (
        <a
          href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-2 font-body text-xs font-medium text-deep-teal transition-colors hover:text-obsidian"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          {pdpCopy.whatsappHelpLabel}
        </a>
      ) : null}
    </aside>
  );
}

function CartLineItem({
  line,
  eager = false,
  lineQtySaving,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  line: CartLineView;
  eager?: boolean;
  lineQtySaving?: boolean;
  onDecrease: (line: CartLineView) => void;
  onIncrease: (line: CartLineView) => void;
  onRemove: (line: CartLineView) => void;
}) {
  const copy = (useDictionary().cart);

  return (
    <article className="cart-item">
      <Link className="cart-item-media" href={line.productUrl} aria-label={`Open ${line.productName}`}>
        <TeeImageFrame
          src={line.imageSrc}
          alt={line.imageAlt}
          w={384}
          eager={eager}
          aspectRatio="1"
          borderRadius="18px"
          frameStyle={{ height: '100%' }}
        />
      </Link>

      <div className="cart-item-content">
        <div className="cart-item-header">
          <div>
            <Link className="cart-item-name" href={line.productUrl}>
              {line.productName}
            </Link>
            {line.artistName ? <p className="cart-item-artist">Illustrated by {line.artistName}</p> : null}
          </div>
          <p className="cart-item-price">{formatEgp(line.linePriceEgp)}</p>
        </div>

        <div className="cart-item-meta">
          <p className="cart-item-size">Size: {line.size}</p>
          <div className="cart-item-controls">
            <span className="cart-item-qty-label">{copy.quantityLabel}</span>
            <div className="cart-stepper" role="group" aria-label={`Quantity for ${line.productName}`}>
              <button
                type="button"
                className="cart-stepper-button"
                aria-label={`Decrease quantity for ${line.productName}`}
                disabled={line.qty <= 1}
                onClick={() => onDecrease(line)}
              >
                −
              </button>
              <span className="cart-stepper-value" aria-live="polite" aria-atomic="true">
                {line.qty}
              </span>
              {lineQtySaving ? (
                <span
                  className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-deep-teal"
                  aria-label="Saving quantity"
                  title="Saving…"
                />
              ) : null}
              <button
                type="button"
                className="cart-stepper-button"
                aria-label={`Increase quantity for ${line.productName}`}
                disabled={line.qty >= 99}
                onClick={() => onIncrease(line)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button type="button" className="cart-remove-button" onClick={() => onRemove(line)}>
          {copy.removeLabel}
        </button>
      </div>
    </article>
  );
}

function CartPairWithStrip({
  products,
  bundle,
  locale,
  onAddProduct,
}: {
  products: Product[];
  bundle: StorefrontIncentivesClient['bundle'];
  locale: UiLocale;
  onAddProduct: (product: Product) => void;
}) {
  if (products.length === 0) return null;
  const bundleLabel = bundle ? pickLocalizedText(bundle.label, locale === 'ar' ? 'ar' : 'en') : null;
  return (
    <section className="mt-5 rounded-2xl border border-stone/45 bg-white/75 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
            {locale === 'ar' ? 'نسّقها مع' : 'Pair with'}
          </p>
          {bundleLabel ? <p className="mt-1 font-body text-xs text-warm-charcoal">{bundleLabel}</p> : null}
        </div>
        <Link href="/products" className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-deep-teal">
          {locale === 'ar' ? 'كل التصاميم' : 'All designs'}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <article key={product.slug} className="flex gap-3 rounded-xl border border-stone/35 bg-papyrus/70 p-2">
            <Link href={`/products/${product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone/30">
              <TeeImageFrame
                src={getProductCardImageSrc(product)}
                alt={`HORO ${product.name}`}
                w={220}
                aspectRatio="1"
                borderRadius="0"
                frameStyle={{ height: '100%' }}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${product.slug}`} className="font-body line-clamp-2 text-sm font-medium text-obsidian">
                {product.name}
              </Link>
              <p className="mt-1 font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">
                {formatEgp(product.priceEgp)}
              </p>
              <button
                type="button"
                className="font-label mt-2 inline-flex min-h-10 items-center rounded-full border border-obsidian px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-obsidian"
                onClick={() => onAddProduct(product)}
              >
                {locale === 'ar' ? 'أضف' : 'Add'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Cart({
  initialCart = null,
  initialLines = [],
  initialGiftWrapEgp = 0,
  initialState = 'unknown',
}: CartProps = {}) {
  const {
    medusaCartId,
    storageReady,
    seedFromServerCart,
    items,
    removeItem,
    setLineQty,
    subtotalEgp,
    giftWrapEgp,
    giftWrapCatalogPriceEgp,
    addGiftWrap,
    removeGiftWrap,
    addItem,
    lineQtySavingKeys,
  } = useCart();

  // Seed CartContext from the server-rendered cart so the first paint matches RSC and we
  // skip the auto `getCart` round-trip on cold loads. Child useEffect runs before the
  // CartProvider parent effect, so the storage-load path is bypassed cleanly.
  useEffect(() => {
    if (initialCart) seedFromServerCart(initialCart);
  }, [initialCart, seedFromServerCart]);
  const { locale } = useUiLocale();
  const shellCopy = useDictionary();
  const now = useStableNow();
  const copy = (useDictionary().cart);
  const [statusMessage, setStatusMessage] = useState('');
  const [giftUpsellDismissed, setGiftUpsellDismissed] = useState(false);
  const [undoLine, setUndoLine] = useState<CartLine | null>(null);
  const trackedCartViewRef = useRef(false);

  const useInitialSnapshot = !storageReady && initialState !== 'unknown';
  const displayItems = useInitialSnapshot ? initialLines : items;
  const displayGiftWrapEgp = useInitialSnapshot ? initialGiftWrapEgp : giftWrapEgp;
  const displaySubtotalEgp = useMemo(
    () => (useInitialSnapshot ? merchandiseSubtotalFromCartLines(displayItems) : subtotalEgp),
    [displayItems, subtotalEgp, useInitialSnapshot],
  );

  const lineViews = useMemo(() => getCartLineViews(displayItems), [displayItems]);
  const itemCount = useMemo(() => lineViews.reduce((count, line) => count + line.qty, 0), [lineViews]);
  const productPromoSavingsEgp = useMemo(() => {
    return lineViews.reduce((sum, line) => {
      const product = getProduct(line.productSlug);
      const variant = product?.variantsBySize?.[line.size];
      const originalPrice = variant?.originalPriceEgp ?? product?.originalPriceEgp ?? null;
      if (typeof originalPrice !== 'number' || originalPrice <= line.unitPriceEgp) return sum;
      return sum + (originalPrice - line.unitPriceEgp) * line.qty;
    }, 0);
  }, [lineViews]);
  const pairWithProducts = useMemo(() => {
    const inCart = new Set(displayItems.map((item) => item.productSlug));
    return getProducts()
      .filter((product) => !inCart.has(product.slug) && productHasRealImage(product))
      .slice(0, 2);
  }, [displayItems]);
  const [shippingFetch, setShippingFetch] = useState<CartShippingFetchState>({ kind: 'inactive' });
  const [incentives, setIncentives] = useState<StorefrontIncentivesClient | null>(null);
  const [governorateModalOpen, setGovernorateModalOpen] = useState(false);
  const router = useRouter();
  const {
    selectedCode,
    selectedRate,
    setGovernorate,
    hydrated: governorateHydrated,
    hasStoredGovernorate,
    isDefaultEstimate,
  } = useDeliveryGovernorate();

  /* Fetch incentives after mount (per repo hydration baseline: server render uses null). */
  useEffect(() => {
    let cancelled = false;
    void fetchStorefrontIncentivesClient().then((data) => {
      if (cancelled) return;
      setIncentives(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) {
      setShippingFetch(lineViews.length > 0 ? { kind: 'pending_cart_id' } : { kind: 'inactive' });
      return;
    }
    if (items.length === 0) {
      setShippingFetch({ kind: 'inactive' });
      return;
    }
    if (!medusaCartId) {
      setShippingFetch({ kind: 'pending_cart_id' });
      return;
    }
    let cancelled = false;
    setShippingFetch({ kind: 'loading' });
    void (async () => {
      try {
        const [cartResponse, options] = await Promise.all([
          getCart(medusaCartId),
          (async () => {
            const cached = getFreshShippingOptions(medusaCartId);
            if (cached && cached.length > 0) return cached;
            const { shipping_options } = await listShippingOptions(medusaCartId);
            return shipping_options ?? [];
          })(),
        ]);
        if (cancelled) return;
        setShippingFetch({ kind: 'ok', cart: cartResponse.cart, options });
      } catch {
        if (!cancelled) setShippingFetch({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
    /* lineViews derives from items; items.length captures add/remove. Including lineViews.length
       would re-fetch shipping on every qty change, causing the order-summary flicker we fixed. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, items.length, medusaCartId, giftWrapEgp]);

  useEffect(() => {
    if (shippingFetch.kind === 'ok') {
      trackShippingEstimateView('cart');
    }
  }, [shippingFetch.kind]);

  const freeShippingUnlocked =
    !!incentives?.freeShipping &&
    incentives.freeShipping.thresholdEgp > 0 &&
    displaySubtotalEgp >= incentives.freeShipping.thresholdEgp;
  const giftWrapDisplayPriceEgp = incentives?.giftWrapPriceEgp ?? giftWrapCatalogPriceEgp;

  const lastKnownShippingEgpRef = useRef<number | null>(null);

  const { shippingRow, estimatedOrderTotal, originalShippingEgp } = useMemo(() => {
    const base = displaySubtotalEgp + displayGiftWrapEgp;
    /* Audit S8: when an operator-configured free-shipping promo is unlocked, the
       preview must agree with what Medusa will compute at checkout. */
    if (freeShippingUnlocked) {
      // Preserve the last known shipping quote so the UI can show a strikethrough.
      const original = lastKnownShippingEgpRef.current ?? readCheckoutDisplayShippingFallbackEgpFromEnv() ?? 0;
      return {
        shippingRow: { mode: 'amount' as const, egp: 0 },
        estimatedOrderTotal: base,
        originalShippingEgp: original,
      };
    }
    if (shippingFetch.kind === 'inactive') {
      return {
        shippingRow: { mode: 'copy' as const },
        estimatedOrderTotal: base,
        originalShippingEgp: 0,
      };
    }
    if (shippingFetch.kind === 'pending_cart_id') {
      if (!selectedCode) {
        return {
          shippingRow: { mode: 'copy' as const },
          estimatedOrderTotal: base,
          originalShippingEgp: 0,
        };
      }
      const previewEgp = shippingEgpForGovernorateCode(selectedCode);
      return {
        shippingRow: { mode: 'amount' as const, egp: previewEgp },
        estimatedOrderTotal: base + previewEgp,
        originalShippingEgp: 0,
      };
    }
    if (shippingFetch.kind === 'loading') {
      // Prioritize the last known quote to prevent flickering during debounced qty updates
      const fb = lastKnownShippingEgpRef.current ?? readCheckoutDisplayShippingFallbackEgpFromEnv();
      if (fb != null && fb >= 0) {
        return {
          shippingRow: { mode: 'amount' as const, egp: fb },
          estimatedOrderTotal: base + fb,
          originalShippingEgp: 0,
        };
      }
      return {
        shippingRow: { mode: 'loading' as const },
        estimatedOrderTotal: null as number | null,
        originalShippingEgp: 0,
      };
    }
    if (shippingFetch.kind === 'error') {
      return {
        shippingRow: { mode: 'copy' as const },
        estimatedOrderTotal: base,
        originalShippingEgp: 0,
      };
    }
    const quoteEgp = resolveShippingQuoteFromCartAndOptions(
      shippingFetch.cart,
      shippingFetch.options,
    );
    lastKnownShippingEgpRef.current = quoteEgp;
    return {
      shippingRow: { mode: 'amount' as const, egp: quoteEgp },
      estimatedOrderTotal: base + quoteEgp,
      originalShippingEgp: 0,
    };
  }, [shippingFetch, displaySubtotalEgp, displayGiftWrapEgp, freeShippingUnlocked, selectedCode]);

  const showDeliveryEstimate = lineViews.length > 0 && governorateHydrated;
  const deliveryShippingEgp =
    selectedRate && shippingRow.mode === 'amount'
      ? shippingRow.egp
      : selectedRate
        ? selectedRate.shippingEgp
        : null;
  const deliveryEstimatedTotal =
    deliveryShippingEgp != null ? displaySubtotalEgp + displayGiftWrapEgp + deliveryShippingEgp : null;

  const openGovernoratePicker = () => {
    trackShippingGovernoratePrompted('cart');
    setGovernorateModalOpen(true);
  };

  const showUpsell =
    itemCount > 0 &&
    (itemCount !== 1 ||
      ((giftWrapDisplayPriceEgp ?? 0) > 0 && !(giftUpsellDismissed && displayGiftWrapEgp === 0)));

  useEffect(() => {
    if (trackedCartViewRef.current || lineViews.length === 0) return;
    trackedCartViewRef.current = true;
    trackCartViewed(displayItems, displaySubtotalEgp, displayGiftWrapEgp);
  }, [displayGiftWrapEgp, displayItems, displaySubtotalEgp, lineViews.length]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (itemCount !== 1 || displayGiftWrapEgp > 0) {
      setGiftUpsellDismissed(false);
    }
  }, [displayGiftWrapEgp, itemCount]);

  useEffect(() => {
    if (!undoLine) return undefined;
    const id = window.setTimeout(() => setUndoLine(null), 5000);
    return () => window.clearTimeout(id);
  }, [undoLine]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (undoLine != null) {
      root.style.setProperty('--horo-bottom-fab-offset', '5.5rem');
    } else {
      root.style.removeProperty('--horo-bottom-fab-offset');
    }
    return () => {
      root.style.removeProperty('--horo-bottom-fab-offset');
    };
  }, [undoLine]);

  const undoProductName = undoLine ? getProduct(undoLine.productSlug)?.name ?? 'Item' : '';

  const handleDecrease = (line: CartLineView) => {
    if (line.qty <= 1) {
      setStatusMessage(formatMessage(copy.quantityMinReached, line.productName));
      return;
    }

    const result = setLineQty(line.productSlug, line.size, line.qty - 1, line.variantId, line.lineId);
    if (!result.ok) {
      setStatusMessage(formatCartStockMessage(result, line.productName, locale === 'ar'));
      return;
    }
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleIncrease = (line: CartLineView) => {
    if (line.qty >= 99) {
      setStatusMessage(locale === 'ar' ? 'الحد الأقصى ٩٩ لكل مقاس.' : 'Maximum quantity is 99 per size.');
      return;
    }
    const result = setLineQty(line.productSlug, line.size, line.qty + 1, line.variantId, line.lineId);
    if (!result.ok) {
      setStatusMessage(formatCartStockMessage(result, line.productName, locale === 'ar'));
      return;
    }
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleRemove = (line: CartLineView) => {
    setUndoLine({
      productSlug: line.productSlug,
      size: line.size as ProductSizeKey,
      qty: line.qty,
      variantId: line.variantId,
    });
    removeItem(line.productSlug, line.size, line.variantId, line.lineId);
    setStatusMessage('');
  };

  const handleUndoRemove = () => {
    if (!undoLine) return;
    const name = getProduct(undoLine.productSlug)?.name ?? 'Item';
    const result = addItem(undoLine.productSlug, undoLine.size, undoLine.qty, undoLine.variantId);
    if (!result.ok) {
      setUndoLine(null);
      setStatusMessage(formatCartStockMessage(result, name, locale === 'ar'));
      return;
    }
    setUndoLine(null);
    setStatusMessage(formatMessage(copy.itemRestored, name));
  };

  const handleAddGiftWrap = async () => {
    setGiftUpsellDismissed(false);
    try {
      await addGiftWrap();
      trackGiftWrapToggle(true, 'cart');
      setStatusMessage(copy.giftWrapAdded);
    } catch {
      setStatusMessage(locale === 'ar' ? 'تعذر إضافة التغليف الهدايا حالياً' : 'Gift wrap unavailable right now');
    }
  };

  const handleDeclineGiftWrap = () => {
    setGiftUpsellDismissed(true);
  };

  const handleRemoveGiftWrap = () => {
    removeGiftWrap();
    trackGiftWrapToggle(false, 'cart');
    if (displayGiftWrapEgp > 0) {
      setStatusMessage(copy.giftWrapRemoved);
    }
  };
  const handleAddPairWithProduct = (product: Product) => {
    const size = productAvailableSizes(product)[0];
    if (!size) return;
    const result = addItem(product.slug, size as ProductSizeKey, 1, product.variantsBySize?.[size as ProductSizeKey]?.id);
    if (!result.ok) {
      setStatusMessage(formatCartStockMessage(result, product.name, locale === 'ar'));
      return;
    }
    setStatusMessage(locale === 'ar' ? 'تمت إضافة القطعة للسلة.' : 'Added to your bag.');
  };

  if (!storageReady && initialState === 'unknown') {
    return (
      <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <div className="container cart-page-shell">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: shellCopy.shell.home, to: '/' },
              { label: copy.heading },
            ]}
          />
          <section className="card-glass rounded-2xl border border-stone/60 px-6 py-8" aria-live="polite">
            <p className="font-body text-sm text-warm-charcoal">
              {locale === 'ar' ? 'جاري تحميل السلة…' : 'Loading your bag…'}
            </p>
          </section>
        </div>
      </div>
    );
  }

  if (lineViews.length === 0 && !undoLine) {
    return (
      <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <div className="container cart-page-shell">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: shellCopy.shell.home, to: '/' },
              { label: shellCopy.cart.heading },
            ]}
          />
          <section className="cart-empty card-glass" aria-labelledby="cart-empty-title">
            <div className="cart-empty-media">
              <TeeImageFrame
                src={heroVectorizedV2}
                alt="HORO editorial tee image for the empty cart state."
                w={960}
                eager
                aspectRatio="4 / 5"
                borderRadius="24px"
                frameStyle={{ height: '100%' }}
              />
            </div>
            <div className="cart-empty-content">
              <h1 id="cart-empty-title" className="cart-page-title" style={{ marginBottom: '0.375rem' }}>
                {copy.heading}
              </h1>
              <p className="cart-page-count">{formatItemCount(0, copy.itemLabelSingular, copy.itemLabelPlural)}</p>
              <p className="cart-empty-copy">{copy.emptyBody}</p>
              <Link className="btn btn-primary" href="/products">
                {copy.emptyCta}
              </Link>
            </div>
          </section>
          <RecentlyViewedStrip className="mt-10 border-0 pt-0" />
        </div>
      </div>
    );
  }

  if (lineViews.length === 0 && undoLine) {
    return (
      <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <div className="container cart-page-shell max-w-2xl">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: shellCopy.shell.home, to: '/' },
              { label: copy.heading },
            ]}
          />
          <section
            className="card-glass flex flex-col gap-4 rounded-2xl border border-stone/60 px-6 py-8"
            aria-live="polite"
            role="status"
          >
            <h1 className="cart-page-title">{copy.heading}</h1>
            <p className="font-body text-warm-charcoal">{formatMessage(copy.removeUndoPrompt, undoProductName)}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary min-h-12 px-6" onClick={handleUndoRemove}>
                {copy.undoRemoveCta}
              </button>
              <Link className="btn btn-ghost min-h-12 inline-flex items-center px-6" href="/products">
                {copy.secondaryCta}
              </Link>
            </div>
          </section>
          <RecentlyViewedStrip className="mt-10 border-0 pt-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
      <div className="container cart-page-shell">
        <PageBreadcrumb
          className="mb-6"
          items={[
            { label: shellCopy.shell.home, to: '/' },
            { label: copy.heading },
          ]}
        />
        {undoLine ? (
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="pointer-events-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-3 rounded-xl border border-stone/70 bg-white px-4 py-3 shadow-[0_-8px_40px_-12px_rgba(26,26,26,0.35)]">
              <p className="font-body text-sm text-warm-charcoal">{formatMessage(copy.removeUndoPrompt, undoProductName)}</p>
              <button
                type="button"
                className="font-label min-h-11 shrink-0 rounded-sm border border-obsidian px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                onClick={handleUndoRemove}
              >
                {copy.undoRemoveCta}
              </button>
            </div>
          </div>
        ) : null}
        <header className="cart-page-header">
          <h1 className="cart-page-title">{copy.heading}</h1>
          <p className="cart-page-count">{formatItemCount(itemCount, copy.itemLabelSingular, copy.itemLabelPlural)}</p>
          <p className={`cart-feedback ${statusMessage ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
            {statusMessage || ' '}
          </p>
        </header>

        {/* Prominent free-shipping progress banner at top of cart (visible on mobile before scrolling). */}
        {incentives?.freeShipping && incentives.freeShipping.thresholdEgp > 0 ? (() => {
          const threshold = incentives.freeShipping.thresholdEgp;
          const remaining = Math.max(0, threshold - displaySubtotalEgp);
          const pct = Math.min(100, Math.max(0, Math.round((displaySubtotalEgp / threshold) * 100)));
          const unlocked = displaySubtotalEgp >= threshold;
          const labelFromOps = pickLocalizedText(incentives.freeShipping.label, locale === 'ar' ? 'ar' : 'en');
          const headline = unlocked
            ? locale === 'ar'
              ? 'مبروك! تم تفعيل الشحن المجاني'
              : 'Free shipping unlocked'
            : locale === 'ar'
              ? `أضف ${formatEgp(remaining)} للحصول على شحن مجاني`
              : `Add ${formatEgp(remaining)} for free shipping`;
          return (
            <div className="mini-cart-freeship mb-4" role="status" aria-live="polite">
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
              {labelFromOps ? <p className="mini-cart-freeship-label">{labelFromOps}</p> : null}
            </div>
          );
        })() : null}

        <div className="cart-grid">
          <div className="order-1 md:col-start-1 md:row-start-1">
            {lineViews.map((line, index) => (
              <CartLineItem
                key={line.key}
                line={line}
                eager={index === 0}
                lineQtySaving={lineQtySavingKeys.includes(cartLineIdentityKey(line))}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
                onRemove={handleRemove}
              />
            ))}
            <CartPairWithStrip
              products={pairWithProducts}
              bundle={incentives?.bundle ?? null}
              locale={locale}
              onAddProduct={handleAddPairWithProduct}
            />
            {isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl) ? (
              <a
                href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-body text-xs font-medium text-deep-teal transition-colors hover:text-obsidian"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                {locale === 'ar' ? copy.whatsappSizeHelpLabel : copy.whatsappSizeHelpLabel}
              </a>
            ) : null}
          </div>

          {showUpsell ? (
            <div className="order-2 md:col-start-1 md:row-start-2 md:self-start">
              <CartUpsell
                totalQty={itemCount}
                giftWrapSelected={displayGiftWrapEgp > 0}
                giftWrapPriceEgp={giftWrapDisplayPriceEgp}
                bundle={incentives?.bundle ?? null}
                locale={locale}
                onAddGiftWrap={handleAddGiftWrap}
                onDeclineGiftWrap={handleDeclineGiftWrap}
                onRemoveGiftWrap={handleRemoveGiftWrap}
              />
            </div>
          ) : null}

          <CartSummary
            itemCount={itemCount}
            subtotalEgp={displaySubtotalEgp}
            productPromoSavingsEgp={productPromoSavingsEgp}
            giftWrapEgp={displayGiftWrapEgp}
            estimatedOrderTotal={estimatedOrderTotal}
            shippingRow={shippingRow}
            originalShippingEgp={originalShippingEgp}
            now={now}
            locale={locale}
            cartService={shellCopy.cartService}
            incentives={incentives}
            showDeliveryEstimate={showDeliveryEstimate}
            selectedRate={selectedRate}
            isDefaultEstimate={isDefaultEstimate}
            deliveryShippingEgp={deliveryShippingEgp}
            deliveryEstimatedTotal={deliveryEstimatedTotal}
            onChooseGovernorate={openGovernoratePicker}
            onChangeGovernorate={openGovernoratePicker}
            onProceedCheckout={() => router.push('/checkout')}
          />
        </div>

        <GovernorateModal
          open={governorateModalOpen}
          subtotalEgp={displaySubtotalEgp + displayGiftWrapEgp}
          showContinueButton={hasStoredGovernorate}
          onClose={() => setGovernorateModalOpen(false)}
          onSelect={(code) => {
            setGovernorate(code, { surface: 'cart_modal' });
            setGovernorateModalOpen(false);
          }}
          onContinueToCheckout={() => {
            if (!hasStoredGovernorate) {
              setStatusMessage(copy.cartCheckoutNeedsGovernorate);
              return;
            }
            setGovernorateModalOpen(false);
            router.push('/checkout');
          }}
        />

        <ExitIntentModal surface="cart" cartValueEgp={displaySubtotalEgp} cartId={medusaCartId} />
      </div>
    </div>
  );
}
