import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TeeImageFrame } from '../components/TeeImage';
import { useCart } from '../cart/CartContext';
import { getCartLineViews, type CartLineView } from '../cart/view';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import type { CartLine } from '../cart/types';
import { CART_SCHEMA } from '../data/domain-config';
import { giftWrapPreview, heroVectorizedV2 } from '../data/images';
import { useUiLocale, type UiLocale } from '../i18n/ui-locale';
import { useStableNow } from '../runtime/render-time';
import { getProduct, type ProductSizeKey } from '../data/site';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { getCart, listShippingOptions } from '../lib/medusa/client';
import { getFreshShippingOptions } from '../lib/medusa/checkout-aux-cache';
import {
  readCheckoutDisplayShippingFallbackEgpFromEnv,
  resolveShippingQuoteFromCartAndOptions,
} from '../lib/medusa/cart-money';
import type { MedusaCart, MedusaShippingOption } from '../lib/medusa/types';

type CartShippingFetchState =
  | { kind: 'inactive' }
  | { kind: 'pending_cart_id' }
  | { kind: 'loading' }
  | { kind: 'ok'; cart: MedusaCart; options: MedusaShippingOption[] }
  | { kind: 'error' };

function formatMessage(template: string, name: string) {
  return template.replace('{name}', name);
}

function formatItemCount(count: number) {
  const label = count === 1 ? CART_SCHEMA.copy.itemLabelSingular : CART_SCHEMA.copy.itemLabelPlural;
  return `${count} ${label}`;
}

function CartUpsell({
  totalQty,
  giftWrapSelected,
  giftWrapPriceEgp,
  onAddGiftWrap,
  onDeclineGiftWrap,
  onRemoveGiftWrap,
}: {
  totalQty: number;
  giftWrapSelected: boolean;
  giftWrapPriceEgp: number | null;
  onAddGiftWrap: () => void;
  onDeclineGiftWrap: () => void;
  onRemoveGiftWrap: () => void;
}) {
  const copy = CART_SCHEMA.copy;

  if (totalQty === 1) {
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

  if (totalQty >= 2) {
    return (
      <section className="cart-upsell card-glass" aria-labelledby="cart-upsell-title">
        <div className="cart-upsell-content cart-upsell-content--compact">
          <h2 id="cart-upsell-title" className="cart-upsell-title">
            {copy.bundleUpsellHeading}
          </h2>
          <p className="cart-upsell-body">{copy.bundleUpsellBody}</p>
          <div className="cart-upsell-actions">
            <Link className="btn btn-ghost" to="/feelings">
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
  giftWrapEgp,
  estimatedOrderTotal,
  shippingRow,
  now,
  locale,
  cartService,
}: {
  itemCount: number;
  subtotalEgp: number;
  giftWrapEgp: number;
  estimatedOrderTotal: number | null;
  shippingRow: { mode: 'loading' } | { mode: 'amount'; egp: number } | { mode: 'copy' };
  now: Date;
  locale: UiLocale;
  cartService: { shippingExplainerArabic: string; estimatedDeliveryCheckoutNoteArabic: string };
}) {
  const copy = CART_SCHEMA.copy;
  const navigate = useNavigate();
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
        {locale === 'ar'
          ? 'تُعرض هذه الأرقام كمعاينة سريعة. يتم تثبيت قيمة الشحن النهائية بعد حفظ العنوان في الدفع.'
          : 'These numbers are a fast preview. Final shipping is locked after your address is saved in checkout.'}
      </p>

      <div className="cart-summary-rows">
        <p className="cart-summary-row">
          <span>
            {copy.subtotalLabel} ({formatItemCount(itemCount)})
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
              <span
                className="inline-block h-4 w-16 animate-pulse rounded bg-stone/70 align-middle"
                aria-label={locale === 'ar' ? 'جاري تحميل الشحن' : 'Loading shipping'}
              />
            ) : null}
            {shippingRow.mode === 'amount' ? formatEgp(shippingRow.egp) : null}
            {shippingRow.mode === 'copy' ? (
              <span className="font-body text-sm text-warm-charcoal">{copy.shippingConfirmedAtCheckout}</span>
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
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => navigate('/checkout')}
        >
          {copy.primaryCta}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => navigate('/feelings')}
        >
          {locale === 'ar' ? 'متابعة التسوق' : 'Continue shopping'}
        </button>
      </div>

      <ul className="cart-trust-strip" aria-label="Cart trust signals">
        {CART_SCHEMA.trustStripItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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
  const copy = CART_SCHEMA.copy;

  return (
    <article className="cart-item">
      <Link className="cart-item-media" to={line.productUrl} aria-label={`Open ${line.productName}`}>
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
            <Link className="cart-item-name" to={line.productUrl}>
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

export function Cart() {
  const {
    medusaCartId,
    items,
    removeItem,
    setLineQty,
    subtotalEgp,
    giftWrapEgp,
    giftWrapCatalogPriceEgp,
    addGiftWrap,
    removeGiftWrap,
    addItem,
    lineQtySaving,
  } = useCart();
  const { copy: shellCopy, locale } = useUiLocale();
  const now = useStableNow();
  const copy = CART_SCHEMA.copy;
  const [statusMessage, setStatusMessage] = useState('');
  const [giftUpsellDismissed, setGiftUpsellDismissed] = useState(false);
  const [undoLine, setUndoLine] = useState<CartLine | null>(null);
  const [clientReady, setClientReady] = useState(false);

  const lineViews = useMemo(() => getCartLineViews(items), [items]);
  const itemCount = useMemo(() => lineViews.reduce((count, line) => count + line.qty, 0), [lineViews]);
  const [shippingFetch, setShippingFetch] = useState<CartShippingFetchState>({ kind: 'inactive' });

  useEffect(() => {
    if (lineViews.length === 0) {
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
        const { cart } = await getCart(medusaCartId);
        let options = getFreshShippingOptions(medusaCartId) ?? [];
        if (options.length === 0) {
          const { shipping_options } = await listShippingOptions(medusaCartId);
          options = shipping_options ?? [];
        }
        if (cancelled) return;
        setShippingFetch({ kind: 'ok', cart, options });
      } catch {
        if (!cancelled) setShippingFetch({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lineViews.length, medusaCartId, itemCount, giftWrapEgp, subtotalEgp]);

  const { shippingRow, estimatedOrderTotal } = useMemo(() => {
    const base = subtotalEgp + giftWrapEgp;
    if (shippingFetch.kind === 'inactive' || shippingFetch.kind === 'pending_cart_id') {
      return {
        shippingRow: { mode: 'loading' as const },
        estimatedOrderTotal: null as number | null,
      };
    }
    if (shippingFetch.kind === 'loading') {
      const fb = readCheckoutDisplayShippingFallbackEgpFromEnv();
      if (fb != null && fb > 0) {
        return {
          shippingRow: { mode: 'amount' as const, egp: fb },
          estimatedOrderTotal: base + fb,
        };
      }
      return {
        shippingRow: { mode: 'loading' as const },
        estimatedOrderTotal: null as number | null,
      };
    }
    if (shippingFetch.kind === 'error') {
      return {
        shippingRow: { mode: 'copy' as const },
        estimatedOrderTotal: base,
      };
    }
    const quoteEgp = resolveShippingQuoteFromCartAndOptions(
      shippingFetch.cart,
      shippingFetch.options,
    );
    return {
      shippingRow: { mode: 'amount' as const, egp: quoteEgp },
      estimatedOrderTotal: base + quoteEgp,
    };
  }, [shippingFetch, subtotalEgp, giftWrapEgp]);

  const showUpsell = itemCount > 0 && !(itemCount === 1 && giftUpsellDismissed && giftWrapEgp === 0);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (itemCount !== 1 || giftWrapEgp > 0) {
      setGiftUpsellDismissed(false);
    }
  }, [giftWrapEgp, itemCount]);

  useEffect(() => {
    if (!undoLine) return undefined;
    const id = window.setTimeout(() => setUndoLine(null), 5000);
    return () => window.clearTimeout(id);
  }, [undoLine]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (undoLine) {
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

    setLineQty(line.productSlug, line.size, line.qty - 1);
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleIncrease = (line: CartLineView) => {
    if (line.qty >= 99) {
      setStatusMessage(locale === 'ar' ? 'الحد الأقصى ٩٩ لكل مقاس.' : 'Maximum quantity is 99 per size.');
      return;
    }
    setLineQty(line.productSlug, line.size, line.qty + 1, line.variantId);
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleRemove = (line: CartLineView) => {
    setUndoLine({
      productSlug: line.productSlug,
      size: line.size as ProductSizeKey,
      qty: line.qty,
      variantId: line.variantId,
    });
    removeItem(line.productSlug, line.size, line.variantId);
    setStatusMessage('');
  };

  const handleUndoRemove = () => {
    if (!undoLine) return;
    const name = getProduct(undoLine.productSlug)?.name ?? 'Item';
    addItem(undoLine.productSlug, undoLine.size, undoLine.qty, undoLine.variantId);
    setUndoLine(null);
    setStatusMessage(formatMessage(copy.itemRestored, name));
  };

  const handleAddGiftWrap = () => {
    setGiftUpsellDismissed(false);
    addGiftWrap();
    setStatusMessage(copy.giftWrapAdded);
  };

  const handleDeclineGiftWrap = () => {
    setGiftUpsellDismissed(true);
  };

  const handleRemoveGiftWrap = () => {
    removeGiftWrap();
    if (giftWrapEgp > 0) {
      setStatusMessage(copy.giftWrapRemoved);
    }
  };

  if (!clientReady) {
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
              { label: CART_SCHEMA.copy.heading },
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
              <p className="cart-page-count">{formatItemCount(0)}</p>
              <p className="cart-empty-copy">{copy.emptyBody}</p>
              <Link className="btn btn-primary" to="/feelings">
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
              <Link className="btn btn-ghost min-h-12 inline-flex items-center px-6" to="/feelings">
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
          <p className="cart-page-count">{formatItemCount(itemCount)}</p>
          <p className={`cart-feedback ${statusMessage ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
            {statusMessage || ' '}
          </p>
        </header>

        <div className="cart-grid">
          <div className="order-1 md:col-start-1 md:row-start-1">
            {lineViews.map((line, index) => (
              <CartLineItem
                key={line.key}
                line={line}
                eager={index === 0}
                lineQtySaving={lineQtySaving}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {showUpsell ? (
            <div className="order-2 md:col-start-1 md:row-start-2 md:self-start">
              <CartUpsell
                totalQty={itemCount}
                giftWrapSelected={giftWrapEgp > 0}
                giftWrapPriceEgp={giftWrapCatalogPriceEgp}
                onAddGiftWrap={handleAddGiftWrap}
                onDeclineGiftWrap={handleDeclineGiftWrap}
                onRemoveGiftWrap={handleRemoveGiftWrap}
              />
            </div>
          ) : null}

          <CartSummary
            itemCount={itemCount}
            subtotalEgp={subtotalEgp}
            giftWrapEgp={giftWrapEgp}
            estimatedOrderTotal={estimatedOrderTotal}
            shippingRow={shippingRow}
            now={now}
            locale={locale}
            cartService={shellCopy.cartService}
          />
        </div>
      </div>
    </div>
  );
}
