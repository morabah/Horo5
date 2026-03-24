import { Link } from 'react-router-dom';
import { getProduct } from '../data/site';
import { getProductMedia } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';
import { formatEgp } from '../utils/formatPrice';
import { GIFT_WRAP_PRICE_EGP, useCart } from '../cart/CartContext';
import { cartLineKey } from '../cart/types';

const ESTIMATED_SHIPPING_EGP = 60;

export function Cart() {
  const { items, removeItem, setLineQty, subtotalEgp, giftWrapEgp, setGiftWrapEgp } = useCart();
  const estimatedOrderTotal = subtotalEgp + giftWrapEgp + ESTIMATED_SHIPPING_EGP;
  const giftUpsell = items.length === 1;

  const upsellBlock =
    giftUpsell ? (
      giftWrapEgp > 0 ? (
        <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--warm-glow)', marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Gift add-ons</h2>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>
            Story card + gift wrap ({formatEgp(GIFT_WRAP_PRICE_EGP)}) is included in your estimate.
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => setGiftWrapEgp(0)}>
            Remove gift wrap
          </button>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--warm-glow)', marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Make it a gift</h2>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>
            Add story card + gift wrap ({formatEgp(GIFT_WRAP_PRICE_EGP)}).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => setGiftWrapEgp(GIFT_WRAP_PRICE_EGP)}>
              Add gift wrap — {formatEgp(GIFT_WRAP_PRICE_EGP)}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setGiftWrapEgp(0)}>
              No thanks
            </button>
          </div>
        </div>
      )
    ) : items.length >= 2 ? (
      <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--warm-glow)', marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Add a 3rd, save {formatEgp(100)}</h2>
        <p style={{ margin: '0 0 1rem' }}>Pick one more design and get {formatEgp(100)} off your order.</p>
        <Link className="btn btn-ghost" to="/vibes">
          Browse designs →
        </Link>
      </div>
    ) : null;

  if (items.length === 0) {
    return (
      <div
        className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
        style={{ paddingTop: '2rem', paddingBottom: '3rem' }}
      >
        <div className="container">
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.25rem' }}>Your cart</h1>
          <p style={{ color: 'var(--clay-earth)', marginBottom: '2rem' }}>0 items</p>
          <p style={{ marginBottom: '1.5rem', maxWidth: '28rem' }}>
            Your bag is empty. Explore vibes and add a design in your size when you&apos;re ready.
          </p>
          <Link className="btn btn-primary" to="/vibes" style={{ minHeight: '48px', display: 'inline-flex', alignItems: 'center' }}>
            Shop by vibe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
      style={{ paddingTop: '2rem', paddingBottom: '3rem' }}
    >
      <div className="container">
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.25rem' }}>Your cart</h1>
        <p style={{ color: 'var(--clay-earth)', marginBottom: '2rem' }}>{items.reduce((n, l) => n + l.qty, 0)} items</p>

        {/* Mobile: line items → summary+CTA → upsell. Desktop: items+upsell left, summary right (aside spans 2 rows). */}
        <div
          className="flex flex-col gap-8 md:grid md:grid-cols-[1fr_minmax(280px,380px)] md:items-start md:gap-8"
          style={{ alignItems: 'stretch' }}
        >
          <div className="order-1 md:col-start-1 md:row-start-1">
            {items.map((line) => {
              const p = getProduct(line.productSlug);
              if (!p) return null;
              const key = cartLineKey(line);
              const lineTotal = p.priceEgp * line.qty;
              return (
                <div
                  key={key}
                  style={{ display: 'flex', gap: '1rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--stone)' }}
                >
                  <div style={{ width: '100px', flexShrink: 0 }}>
                    <TeeImageFrame
                      src={getProductMedia(p.slug).main}
                      alt={`HORO “${p.name}” tee in cart`}
                      w={300}
                      aspectRatio="1"
                      borderRadius="12px"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.25rem' }}>{p.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0 0 0.5rem' }}>
                      Size: {line.size}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--clay-earth)' }} htmlFor={`qty-${key}`}>
                        Qty
                      </label>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          id={`qty-${key}`}
                          aria-label={`Decrease quantity for ${p.name}`}
                          style={{
                            minWidth: '44px',
                            minHeight: '44px',
                            border: '1px solid var(--stone)',
                            borderRadius: '8px',
                            background: 'var(--white)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setLineQty(line.productSlug, line.size, line.qty - 1)}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600 }}>{line.qty}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${p.name}`}
                          style={{
                            minWidth: '44px',
                            minHeight: '44px',
                            border: '1px solid var(--stone)',
                            borderRadius: '8px',
                            background: 'var(--white)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setLineQty(line.productSlug, line.size, line.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{formatEgp(lineTotal)}</p>
                    <button
                      type="button"
                      style={{
                        marginTop: '0.5rem',
                        background: 'none',
                        border: 'none',
                        padding: '0.5rem 0',
                        minHeight: '44px',
                        color: 'var(--deep-teal)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                      onClick={() => removeItem(line.productSlug, line.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="card-glass order-2 md:sticky md:top-20 md:col-start-2 md:row-start-1 md:row-span-2" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--clay-earth)', margin: '0 0 1rem', lineHeight: 1.45 }}>
              Estimated shipping (standard, Egypt): you&apos;ll confirm speed at checkout.
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.5rem' }}>
              <span>Subtotal ({items.reduce((n, l) => n + l.qty, 0)} items)</span>
              <span>{formatEgp(subtotalEgp)}</span>
            </p>
            {giftWrapEgp > 0 ? (
              <p
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '0 0 0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--clay-earth)',
                }}
              >
                <span>Gift wrap + story card</span>
                <span>{formatEgp(giftWrapEgp)}</span>
              </p>
            ) : null}
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
              <span>Est. shipping</span>
              <span>{formatEgp(ESTIMATED_SHIPPING_EGP)}</span>
            </p>
            <p
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '0 0 1.25rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--stone)',
              }}
            >
              <span>Est. order total</span>
              <span>{formatEgp(estimatedOrderTotal)}</span>
            </p>
            <Link
              className="btn btn-primary"
              to="/checkout"
              style={{ width: '100%', marginBottom: '0.75rem', minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Proceed to checkout
            </Link>
            <Link className="btn btn-ghost" to="/vibes" style={{ width: '100%' }}>
              Continue shopping
            </Link>
            <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--clay-earth)' }}>Free exchange 14d · COD · 220 GSM cotton</p>
          </aside>

          {upsellBlock ? (
            <div className="order-3 md:col-start-1 md:row-start-2 md:self-start" style={{ width: '100%' }}>
              {upsellBlock}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
