import { Link } from 'react-router-dom';
import { getProductMedia } from '../data/images';
import { TeeImage } from '../components/TeeImage';

export function OrderConfirmation() {
  return (
    <div style={{ padding: '2rem 0 3rem' }}>
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
          <p style={{ margin: '0 0 0.5rem' }}>Order #HORO-2026-0847 confirmed.</p>
          <p style={{ margin: 0, color: 'var(--clay-earth)' }}>A WhatsApp confirmation is on its way.</p>
        </div>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>Order summary</h2>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <TeeImage src={getProductMedia('the-weight-of-light').main} alt="HORO The Weight of Light tee" w={200} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>The Weight of Light</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0.25rem 0 0' }}>Size M · Qty 1 · 799 EGP</p>
              </div>
            </div>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span>
              <strong>1,658 EGP</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginTop: '1rem' }}>Payment: COD · Delivery: Standard · Cairo</p>
          </div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>What&apos;s next</h2>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--warm-charcoal)' }}>
              <li style={{ marginBottom: '0.5rem' }}>WhatsApp confirmation sent to your phone</li>
              <li style={{ marginBottom: '0.5rem' }}>We prepare your order (1–2 days)</li>
              <li style={{ marginBottom: '0.5rem' }}>Tracking link via WhatsApp</li>
              <li>Arrives at your door (March 25–27)</li>
            </ol>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
              Track order
            </button>
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
