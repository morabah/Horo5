import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TeeImageFrame } from '../components/TeeImage';
import { GIFT_WRAP_PRICE_EGP, useCart } from '../cart/CartContext';
import { getCartLineViews, type CartLineView } from '../cart/view';
import { CART_SCHEMA } from '../data/domain-config';
import { giftWrapPreview, heroStreet } from '../data/images';
import { formatEgp } from '../utils/formatPrice';

const ESTIMATED_SHIPPING_EGP = 60;

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
  onAddGiftWrap,
  onDeclineGiftWrap,
  onRemoveGiftWrap,
}: {
  totalQty: number;
  giftWrapSelected: boolean;
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
            {giftWrapSelected ? copy.giftUpsellIncludedBody : `${copy.giftUpsellBody} (${formatEgp(GIFT_WRAP_PRICE_EGP)}).`}
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
            <Link className="btn btn-ghost" to="/vibes">
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
}: {
  itemCount: number;
  subtotalEgp: number;
  giftWrapEgp: number;
  estimatedOrderTotal: number;
}) {
  const copy = CART_SCHEMA.copy;

  return (
    <aside className="cart-summary card-glass order-3 md:sticky md:top-20 md:col-start-2 md:row-start-1 md:row-span-2" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className="cart-summary-title">
        {copy.orderSummaryHeading}
      </h2>
      <p className="cart-summary-note">{copy.shippingExplainer}</p>

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
          <span>{formatEgp(ESTIMATED_SHIPPING_EGP)}</span>
        </p>
        <p className="cart-summary-total">
          <span>{copy.totalLabel}</span>
          <span>{formatEgp(estimatedOrderTotal)}</span>
        </p>
      </div>

      <div className="cart-summary-actions">
        <Link className="btn btn-primary" to="/checkout" style={{ width: '100%' }}>
          {copy.primaryCta}
        </Link>
        <Link className="btn btn-ghost" to="/vibes" style={{ width: '100%' }}>
          {copy.secondaryCta}
        </Link>
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
  onDecrease,
  onIncrease,
  onRemove,
}: {
  line: CartLineView;
  eager?: boolean;
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
              <button
                type="button"
                className="cart-stepper-button"
                aria-label={`Increase quantity for ${line.productName}`}
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
  const { items, removeItem, setLineQty, subtotalEgp, giftWrapEgp, setGiftWrapEgp } = useCart();
  const copy = CART_SCHEMA.copy;
  const [statusMessage, setStatusMessage] = useState('');
  const [giftUpsellDismissed, setGiftUpsellDismissed] = useState(false);

  const lineViews = useMemo(() => getCartLineViews(items), [items]);
  const itemCount = useMemo(() => lineViews.reduce((count, line) => count + line.qty, 0), [lineViews]);
  const estimatedOrderTotal = subtotalEgp + giftWrapEgp + ESTIMATED_SHIPPING_EGP;
  const showUpsell = itemCount > 0 && !(itemCount === 1 && giftUpsellDismissed && giftWrapEgp === 0);

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

  const handleDecrease = (line: CartLineView) => {
    if (line.qty <= 1) {
      setStatusMessage(formatMessage(copy.quantityMinReached, line.productName));
      return;
    }

    setLineQty(line.productSlug, line.size, line.qty - 1);
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleIncrease = (line: CartLineView) => {
    setLineQty(line.productSlug, line.size, line.qty + 1);
    setStatusMessage(formatMessage(copy.quantityUpdated, line.productName));
  };

  const handleRemove = (line: CartLineView) => {
    removeItem(line.productSlug, line.size);
    setStatusMessage(formatMessage(copy.itemRemoved, line.productName));
  };

  const handleAddGiftWrap = () => {
    setGiftUpsellDismissed(false);
    setGiftWrapEgp(GIFT_WRAP_PRICE_EGP);
    setStatusMessage(copy.giftWrapAdded);
  };

  const handleDeclineGiftWrap = () => {
    setGiftUpsellDismissed(true);
  };

  const handleRemoveGiftWrap = () => {
    setGiftWrapEgp(0);
    if (giftWrapEgp > 0) {
      setStatusMessage(copy.giftWrapRemoved);
    }
  };

  if (lineViews.length === 0) {
    return (
      <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <div className="container cart-page-shell">
          <section className="cart-empty card-glass" aria-labelledby="cart-empty-title">
            <div className="cart-empty-media">
              <TeeImageFrame
                src={heroStreet}
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
              <Link className="btn btn-primary" to="/vibes">
                {copy.emptyCta}
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
      <div className="container cart-page-shell">
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
          />
        </div>
      </div>
    </div>
  );
}
