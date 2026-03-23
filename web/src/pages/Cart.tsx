import { Link } from 'react-router-dom';
import { products } from '../data/site';
import { getProductMedia } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';

export function Cart() {
  const items = products.slice(0, 2);
  const subtotal = items.reduce((s, p) => s + p.priceEgp, 0);
  const giftUpsell = items.length === 1;

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.25rem' }}>Your cart</h1>
        <p style={{ color: 'var(--clay-earth)', marginBottom: '2rem' }}>{items.length} items</p>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
          <div>
            {items.map((p, idx) => (
              <div key={p.slug} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--stone)' }}>
                <div style={{ width: '100px', flexShrink: 0 }}>
                  <TeeImageFrame src={getProductMedia(p.slug).main} alt={`HORO “${p.name}” tee in cart`} w={300} aspectRatio="1" borderRadius="12px" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.25rem' }}>{p.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0 0 0.5rem' }}>Size: {idx === 0 ? 'M' : 'L'}</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{p.priceEgp} EGP</p>
                  <button type="button" style={{ marginTop: '0.5rem', background: 'none', border: 'none', padding: 0, color: 'var(--deep-teal)', cursor: 'pointer', fontSize: '0.875rem' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {giftUpsell && (
              <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--warm-glow)', marginTop: '0.5rem' }}>
                <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Make it a gift</h2>
                <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>Add story card + gift wrap for +200 EGP.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-primary">
                    Add gift wrap +200
                  </button>
                  <button type="button" className="btn btn-ghost">
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {!giftUpsell && items.length >= 2 && (
              <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--warm-glow)', marginTop: '0.5rem' }}>
                <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Add a 3rd, save 100 EGP</h2>
                <p style={{ margin: '0 0 1rem' }}>Pick one more design and get 100 EGP off your order.</p>
                <Link className="btn btn-ghost" to="/vibes">
                  Browse designs →
                </Link>
              </div>
            )}
          </div>

          <aside className="card-glass" style={{ padding: '1.25rem', position: 'sticky', top: '5rem' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.5rem' }}>
              <span>Subtotal</span>
              <span>{subtotal} EGP</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
              <span>Shipping</span>
              <span>At checkout</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.25rem' }}>
              <span>Total</span>
              <span>{subtotal} EGP</span>
            </p>
            <Link className="btn btn-primary" to="/checkout" style={{ width: '100%', marginBottom: '0.75rem' }}>
              Proceed to checkout
            </Link>
            <Link className="btn btn-ghost" to="/vibes" style={{ width: '100%' }}>
              Continue shopping
            </Link>
            <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--clay-earth)' }}>Free exchange 14d · COD · 220 GSM cotton</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
