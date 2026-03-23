import { Link } from 'react-router-dom';
import { useState, type CSSProperties } from 'react';
import { getProductMedia } from '../data/images';
import { TeeImage } from '../components/TeeImage';

const steps = ['Information', 'Shipping', 'Payment'] as const;

export function Checkout() {
  const [step, setStep] = useState(0);

  return (
    <div style={{ padding: '2rem 0 3rem', background: 'var(--white)', minHeight: '60vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <nav style={{ marginBottom: '1.5rem' }}>
          <Link to="/cart" style={{ color: 'var(--deep-teal)', fontSize: '0.9375rem' }}>
            ← Back to cart
          </Link>
        </nav>

        <ol style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: '0 0 2rem', alignItems: 'center' }}>
          {steps.map((label, i) => (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span aria-hidden style={{ color: 'var(--stone)' }}>—</span>}
              <button
                type="button"
                onClick={() => setStep(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: step === i ? 'var(--obsidian)' : 'var(--clay-earth)',
                  fontWeight: step === i ? 600 : 400,
                  borderBottom: step === i ? '2px solid var(--ember)' : '2px solid transparent',
                  paddingBottom: '0.25rem',
                }}
              >
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Contact</h1>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--label-brown)' }}>
                Email *
              </label>
              <input id="email" type="email" autoComplete="email" style={inputStyle} />
              <label htmlFor="phone" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, margin: '1rem 0 0.35rem', color: 'var(--label-brown)' }}>
                Phone (WhatsApp) *
              </label>
              <input id="phone" type="tel" autoComplete="tel" style={inputStyle} />
              <p style={{ fontSize: '0.8125rem', color: 'var(--clay-earth)', marginTop: '1rem' }}>Guest checkout — no account required.</p>
              <h2 style={{ fontSize: '1.125rem', margin: '1.5rem 0 1rem' }}>Shipping address</h2>
              <label htmlFor="name" style={labelStyle}>
                Full name *
              </label>
              <input id="name" type="text" autoComplete="name" style={inputStyle} />
              <label htmlFor="line1" style={labelStyle}>
                Address line 1 *
              </label>
              <input id="line1" type="text" autoComplete="address-line1" style={inputStyle} />
              <label htmlFor="city" style={labelStyle}>
                City *
              </label>
              <input id="city" type="text" autoComplete="address-level2" style={inputStyle} />
              <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} onClick={() => setStep(1)}>
                Continue to shipping
              </button>
            </div>
            <OrderSummary />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Shipping method</h1>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--ember)', borderRadius: 'var(--radius-card)', marginBottom: '0.75rem', cursor: 'pointer' }}>
                <input type="radio" name="ship" defaultChecked />
                <span>
                  <strong>Standard</strong> — 3–5 business days · 60 EGP
                </span>
              </label>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--stone)', borderRadius: 'var(--radius-card)', cursor: 'pointer' }}>
                <input type="radio" name="ship" />
                <span>
                  <strong>Express</strong> — 1–2 business days · 120 EGP
                </span>
              </label>
              <p style={{ marginTop: '1rem' }}>Expected delivery: March 25 – March 27</p>
              <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} onClick={() => setStep(2)}>
                Continue to payment
              </button>
              <button type="button" style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--deep-teal)', cursor: 'pointer' }} onClick={() => setStep(0)}>
                ← Back to information
              </button>
            </div>
            <OrderSummary shipping={60} />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Payment</h1>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--ember)', borderRadius: 'var(--radius-card)', marginBottom: '0.75rem', cursor: 'pointer' }}>
                <input type="radio" name="pay" defaultChecked />
                <span>
                  <strong>Cash on delivery (COD)</strong>
                  <br />
                  Pay when your order arrives. Total: 1,658 EGP
                </span>
              </label>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--stone)', borderRadius: 'var(--radius-card)', cursor: 'pointer' }}>
                <input type="radio" name="pay" />
                <span>
                  <strong>Pay with card</strong>
                  <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--kohl-gold-dark)', marginTop: '0.25rem' }}>Save 30 EGP with card payment</span>
                </span>
              </label>
              <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }} lang="ar" dir="rtl">
                بياناتك آمنة معنا
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                <Link to="/">Free exchange within 14 days</Link> if size doesn&apos;t fit.
              </p>
              <Link className="btn btn-primary" to="/checkout/success" style={{ width: '100%', marginTop: '1.25rem', display: 'inline-flex' }}>
                Place order — 1,658 EGP
              </Link>
              <button type="button" style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--deep-teal)', cursor: 'pointer' }} onClick={() => setStep(1)}>
                ← Back to shipping
              </button>
            </div>
            <OrderSummary shipping={60} />
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: '48px',
  padding: '0 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--stone)',
  background: 'var(--white)',
  fontSize: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  margin: '1rem 0 0.35rem',
  color: 'var(--label-brown)',
};

function OrderSummary({ shipping }: { shipping?: number }) {
  return (
    <aside style={{ padding: '1.25rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--stone)', background: 'var(--papyrus)' }}>
      <h2 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Order summary</h2>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--stone)' }}>
          <TeeImage src={getProductMedia('the-weight-of-light').main} alt="" w={128} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>The Weight of Light</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>M · Qty 1 · 799 EGP</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--stone)' }}>
          <TeeImage src={getProductMedia('midnight-compass').main} alt="" w={128} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>Midnight Compass</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>L · Qty 1 · 799 EGP</p>
        </div>
      </div>
      <p style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span>
        <span>1,598 EGP</span>
      </p>
      <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
        <span>Shipping</span>
        <span>{shipping != null ? `${shipping} EGP` : '—'}</span>
      </p>
      <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--stone)' }}>
        <span>Total</span>
        <span>{shipping != null ? '1,658' : '1,598'} EGP</span>
      </p>
    </aside>
  );
}
