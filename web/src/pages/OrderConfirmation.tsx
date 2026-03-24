import { Link } from 'react-router-dom';
import { getProduct } from '../data/site';
import { getProductMedia } from '../data/images';
import { TeeImage } from '../components/TeeImage';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { loadLastOrder } from '../cart/lastOrder';
import type { CartLine } from '../cart/types';

export function OrderConfirmation() {
  const order = loadLastOrder();

  const lines: { line: CartLine; p: NonNullable<ReturnType<typeof getProduct>>; lineSub: number }[] = [];
  if (order) {
    for (const line of order.lines) {
      const p = getProduct(line.productSlug);
      if (!p) continue;
      lines.push({ line, p, lineSub: p.priceEgp * line.qty });
    }
  }

  const displayOrderId = order?.orderId ?? 'HORO-2026-0847';
  const displayTotal = order?.total ?? 0;
  const paymentLabel =
    order?.paymentMethod === 'card' ? 'Card' : order?.paymentMethod === 'cod' ? 'COD' : 'COD';
  const shippingLabel = order?.shippingMethod === 'express' ? 'Express' : 'Standard';

  const arrivalWindow =
    order?.shippingMethod === 'express'
      ? formatDeliveryWindow(1, 2)
      : formatDeliveryWindow(3, 5);

  return (
    <div
      className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
      style={{ padding: '2rem 0 3rem' }}
    >
      <div className="container" style={{ maxWidth: '720px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.25rem',
            borderRadius: 'var(--radius-card)',
            background: 'var(--mint-frost)',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid var(--nile-dark)',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--nile-dark)',
            }}
            aria-hidden
          >
            ✓
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem' }}>You completed this design</h1>
          <p style={{ margin: '0 0 0.5rem' }}>Order #{displayOrderId} confirmed.</p>
          <p style={{ margin: 0, color: 'var(--clay-earth)' }}>A WhatsApp confirmation is on its way.</p>
        </div>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>Order summary</h2>
            {lines.length > 0 ? (
              <>
                {lines.map(({ line, p, lineSub }) => (
                  <div key={`${line.productSlug}-${line.size}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <TeeImage src={getProductMedia(p.slug).main} alt={`HORO “${p.name}” graphic tee`} w={200} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0.25rem 0 0' }}>
                        Size {line.size} · Qty {line.qty} · {formatEgp(lineSub)}
                      </p>
                    </div>
                  </div>
                ))}
                {order?.giftWrapEgp ? (
                  <p
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--clay-earth)',
                    }}
                  >
                    <span>Gift wrap + story card</span>
                    <span>{formatEgp(order.giftWrapEgp)}</span>
                  </p>
                ) : null}
                <p style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span>Total</span>
                  <strong>{formatEgp(displayTotal)}</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginTop: '1rem' }}>
                  Payment: {paymentLabel} · Delivery: {shippingLabel}
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--clay-earth)', margin: 0 }}>
                Thank you for your order. Your order details were sent to your phone.
              </p>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>What&apos;s next</h2>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--warm-charcoal)' }}>
              <li style={{ marginBottom: '0.5rem' }}>WhatsApp confirmation sent to your phone</li>
              <li style={{ marginBottom: '0.5rem' }}>We prepare your order (1–2 days)</li>
              <li style={{ marginBottom: '0.5rem' }}>Tracking link via WhatsApp</li>
              <li>Arrives at your door (typical window {arrivalWindow}, business days)</li>
            </ol>
            <a
              href={`https://wa.me/201234567890?text=Track%20order%20%23${encodeURIComponent(displayOrderId)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '48px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Track on WhatsApp
            </a>
          </div>
        </div>

        <div className="card-glass" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--warm-glow)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Tag us in your first wear</h2>
          <p style={{ margin: '0 0 1rem' }}>Snap a photo, tag @horoegypt on Instagram.</p>
          <a className="btn btn-ghost" href="https://instagram.com" target="_blank" rel="noreferrer">
            Follow @horoegypt →
          </a>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>Keep exploring</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link className="btn btn-ghost" to="/vibes">
              Shop by Vibe
            </Link>
            <Link className="btn btn-ghost" to="/">
              New arrivals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
