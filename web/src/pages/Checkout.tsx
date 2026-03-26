import { Link, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { trackBeginCheckout, trackPurchase } from '../analytics/events';
import { CommerceContinuityPanel } from '../components/CommerceContinuityPanel';
import { TeeImage } from '../components/TeeImage';
import { getCartLineViews } from '../cart/view';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { useCart } from '../cart/CartContext';
import { saveLastOrder } from '../cart/lastOrder';
import { CART_SCHEMA, PDP_SCHEMA } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';

const steps = ['Information', 'Shipping', 'Payment'] as const;
const stepsShort = ['Info', 'Ship', 'Pay'] as const;
const STEP0_FIELD_ORDER = ['email', 'phone', 'name', 'line1', 'city'] as const;

type FieldErrors = Record<string, string>;

const CARD_DISCOUNT_EGP = 30;

function validateStep0(fields: { email: string; phone: string; name: string; line1: string; city: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.email.trim()) errors.email = 'We need your email to send order updates.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!fields.phone.trim()) errors.phone = 'Your phone number helps us reach you about delivery.';
  if (!fields.name.trim()) errors.name = 'We need your full name for the shipping label.';
  if (!fields.line1.trim()) errors.line1 = 'Where should we deliver your order?';
  if (!fields.city.trim()) errors.city = 'Which city should we ship to?';
  return errors;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotalEgp, giftWrapEgp, clearCart } = useCart();
  const { copy } = useUiLocale();
  const [step, setStep] = useState(0);
  const [highestCompleted, setHighestCompleted] = useState(-1);

  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  // Errors
  const [errors, setErrors] = useState<FieldErrors>({});

  const shippingCost = shippingMethod === 'express' ? 120 : 60;

  const cardDiscount = paymentMethod === 'card' ? CARD_DISCOUNT_EGP : 0;
  const orderTotal = subtotalEgp + giftWrapEgp + shippingCost - cardDiscount;

  const estimatedDeliveryRange = useMemo(
    () =>
      shippingMethod === 'express'
        ? formatDeliveryWindow(1, 2)
        : formatDeliveryWindow(3, 5),
    [shippingMethod],
  );
  const paymentLabel = paymentMethod === 'card' ? 'Card' : 'COD';
  const shippingLabel = shippingMethod === 'express' ? 'Express' : 'Standard';

  const beganCheckoutRef = useRef(false);
  useEffect(() => {
    if (items.length === 0 || beganCheckoutRef.current) return;
    beganCheckoutRef.current = true;
    trackBeginCheckout(items, subtotalEgp, giftWrapEgp);
  }, [items, subtotalEgp, giftWrapEgp]);

  function handleStepClick(targetStep: number) {
    // Allow backward navigation to completed steps only
    if (targetStep <= highestCompleted) {
      setStep(targetStep);
    }
  }

  function handleContinueToShipping(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validateStep0({ email, phone, name: fullName, line1, city });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const firstInvalidField = STEP0_FIELD_ORDER.find((field) => fieldErrors[field]);
      if (firstInvalidField) {
        requestAnimationFrame(() => {
          document.getElementById(firstInvalidField)?.focus();
        });
      }
      return;
    }
    setHighestCompleted(Math.max(highestCompleted, 0));
    setStep(1);
  }

  function handleContinueToPayment() {
    setHighestCompleted(Math.max(highestCompleted, 1));
    setStep(2);
  }

  function handlePlaceOrder() {
    const orderId = `HORO-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    trackPurchase({
      transactionId: orderId,
      value: orderTotal,
      currency: 'EGP',
      lines: items.map((l) => ({ ...l })),
    });
    saveLastOrder({
      orderId,
      lines: items.map((l) => ({ ...l })),
      subtotal: subtotalEgp,
      giftWrapEgp: giftWrapEgp > 0 ? giftWrapEgp : undefined,
      shipping: shippingCost,
      cardDiscount,
      total: orderTotal,
      paymentMethod,
      shippingMethod,
      paymentLabel,
      shippingLabel,
      estimatedDeliveryWindow: estimatedDeliveryRange,
      contactEmail: email.trim() || undefined,
      contactName: fullName.trim() || undefined,
      contactPhone: phone.trim() || undefined,
      shippingLine1: line1.trim() || undefined,
      shippingCity: city.trim() || undefined,
      whatsappOptIn,
    });
    // Navigate first; defer clearCart so the router commits /checkout/success before cart empties
    // (otherwise Checkout can briefly show the empty state while the URL is already /checkout/success).
    flushSync(() => {
      navigate('/checkout/success');
    });
    setTimeout(() => {
      clearCart();
    }, 0);
  }

  if (items.length === 0) {
    return (
      <div
        className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
        style={{ padding: '2rem 0 3rem', background: 'var(--white)', minHeight: '60vh' }}
      >
        <div className="container" style={{ maxWidth: '960px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>Nothing to check out</h1>
          <p style={{ color: 'var(--clay-earth)', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            Your bag is empty. Add a design from the shop, then return here to complete your order.
          </p>
          <Link className="btn btn-primary" to="/vibes" style={{ minHeight: '48px', display: 'inline-flex', alignItems: 'center' }}>
            Shop by Vibe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
      style={{ padding: '2rem 0 3rem', background: 'var(--white)', minHeight: '60vh' }}
    >
      <div className="container" style={{ maxWidth: '960px' }}>
        <nav style={{ marginBottom: '1.5rem' }}>
          <Link to="/cart" style={{ color: 'var(--deep-teal)', fontSize: '0.9375rem', display: 'inline-flex', alignItems: 'center', minHeight: '48px', padding: '0.5rem 0' }}>
            ← Back to cart
          </Link>
        </nav>

        <p
          className="font-label mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--clay-earth)] sm:text-xs sm:tracking-[0.22em]"
          aria-live="polite"
        >
          Checkout · Step {step + 1} of 3 · {steps[step]}
        </p>

        {/* F11 — Visual progress indicator (dot-and-line); horizontal scroll on very narrow viewports */}
        <div
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: '0 0 2rem',
            width: '100%',
            maxWidth: '100%',
          }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Checkout step ${step + 1} of 3: ${steps[step]}`}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              width: 'max-content',
              margin: '0 auto',
              padding: '0 2px',
            }}
          >
          {steps.map((label, i) => {
            const isCompleted = i <= highestCompleted;
            const isCurrent = i === step;
            const isClickable = i <= highestCompleted;

            const dotColor = isCurrent
              ? 'var(--ember)'
              : isCompleted
                ? 'var(--obsidian)'
                : 'var(--stone)';

            const labelColor = isCurrent
              ? 'var(--obsidian)'
              : isCompleted
                ? 'var(--obsidian)'
                : 'var(--clay-earth)';

            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <div style={{
                    width: 'clamp(2rem, 8vw, 5rem)',
                    height: '2px',
                    background: isCompleted ? 'var(--obsidian)' : 'var(--stone)',
                    transition: 'background 0.3s ease',
                  }} />
                )}
                <button
                  type="button"
                  onClick={() => handleStepClick(i)}
                  disabled={!isClickable && !isCurrent}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: isClickable ? 'pointer' : 'default',
                    padding: '0.5rem',
                    minHeight: '48px',
                    minWidth: '48px',
                  }}
                  aria-label={`Step ${i + 1}: ${label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                >
                  <span style={{
                    width: isCurrent ? '14px' : '12px',
                    height: isCurrent ? '14px' : '12px',
                    borderRadius: '50%',
                    background: dotColor,
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(232, 89, 60, 0.2)' : 'none',
                    flexShrink: 0,
                  }} />
                  <span
                    className="font-label"
                    style={{
                      fontSize: 'clamp(0.6875rem, 2.8vw, 0.8125rem)',
                      fontWeight: isCurrent ? 600 : 400,
                      color: labelColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{stepsShort[i]}</span>
                  </span>
                </button>
              </div>
            );
          })}
          </div>
        </div>
        <p className="font-label -mt-3 mb-6 text-center text-[10px] uppercase tracking-wider text-[var(--clay-earth)] sm:hidden">
          Swipe steps above if needed
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <CommerceContinuityPanel
            eyebrow="HORO checkout"
            title={copy.checkout.paymentContinuityTitle}
            body={copy.checkout.paymentContinuityBody}
            chips={PDP_SCHEMA.trustStripItems}
          />
        </div>

        {step === 0 && (
          <form onSubmit={handleContinueToShipping}>
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Contact</h1>
                <label htmlFor="email" style={labelStyle}>
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => { const { email: _, ...rest } = prev; return rest; }); }}
                  style={{ ...inputStyle, ...(errors.email ? errorInputStyle : {}) }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" style={errorTextStyle}>{errors.email}</p>}

                <label htmlFor="phone" style={{ ...labelStyle, margin: '1rem 0 0.35rem' }}>
                  Phone (WhatsApp) *
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((prev) => { const { phone: _, ...rest } = prev; return rest; }); }}
                  style={{ ...inputStyle, ...(errors.phone ? errorInputStyle : {}) }}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && <p id="phone-error" style={errorTextStyle}>{errors.phone}</p>}

                {/* F21 — WhatsApp opt-in */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--deep-teal)' }}
                  />
                  {copy.checkout.whatsappOptIn}
                </label>

                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--obsidian)', marginTop: '0.5rem' }}>{copy.checkout.guestCheckout}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--clay-earth)', marginTop: '0.35rem' }}>
                  Shipping from {formatEgp(60)}; you&apos;ll choose speed on the next step.
                </p>

                <h2 style={{ fontSize: '1.125rem', margin: '1.5rem 0 1rem' }}>Shipping address</h2>
                <label htmlFor="name" style={labelStyle}>
                  Full name *
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setErrors((prev) => { const { name: _, ...rest } = prev; return rest; }); }}
                  style={{ ...inputStyle, ...(errors.name ? errorInputStyle : {}) }}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" style={errorTextStyle}>{errors.name}</p>}

                <label htmlFor="line1" style={labelStyle}>
                  Address line 1 *
                </label>
                <input
                  id="line1"
                  type="text"
                  autoComplete="address-line1"
                  value={line1}
                  onChange={(e) => { setLine1(e.target.value); setErrors((prev) => { const { line1: _, ...rest } = prev; return rest; }); }}
                  style={{ ...inputStyle, ...(errors.line1 ? errorInputStyle : {}) }}
                  aria-invalid={!!errors.line1}
                  aria-describedby={errors.line1 ? 'line1-error' : undefined}
                />
                {errors.line1 && <p id="line1-error" style={errorTextStyle}>{errors.line1}</p>}

                <label htmlFor="city" style={labelStyle}>
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setErrors((prev) => { const { city: _, ...rest } = prev; return rest; }); }}
                  style={{ ...inputStyle, ...(errors.city ? errorInputStyle : {}) }}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city && <p id="city-error" style={errorTextStyle}>{errors.city}</p>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem', minHeight: '48px' }}
                >
                  Continue to shipping
                </button>
              </div>
              <OrderSummary shipping={undefined} paymentMethod={undefined} />
            </div>
          </form>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Shipping method</h1>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: `1px solid ${shippingMethod === 'standard' ? 'var(--ember)' : 'var(--stone)'}`, borderRadius: 'var(--radius-card)', marginBottom: '0.75rem', cursor: 'pointer', minHeight: '48px', alignItems: 'center' }}>
                <input type="radio" name="ship" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} />
                <span>
                  <strong>Standard</strong> — 3–5 business days · {formatEgp(60)}
                </span>
              </label>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: `1px solid ${shippingMethod === 'express' ? 'var(--ember)' : 'var(--stone)'}`, borderRadius: 'var(--radius-card)', cursor: 'pointer', minHeight: '48px', alignItems: 'center' }}>
                <input type="radio" name="ship" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} />
                <span>
                  <strong>Express</strong> — 1–2 business days · {formatEgp(120)}
                </span>
              </label>
              <p style={{ marginTop: '1rem' }}>
                {copy.checkout.deliveryLabel} (business days): {estimatedDeliveryRange}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--clay-earth)', marginTop: '0.75rem' }}>
                Total includes {formatEgp(shippingCost)} shipping. <Link to="/exchange">Free exchange within 14 days</Link> if size doesn&apos;t fit.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', minHeight: '48px' }}
                onClick={handleContinueToPayment}
                aria-label="Continue to payment step"
              >
                Continue to payment
              </button>
              <button type="button" style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--deep-teal)', cursor: 'pointer', minHeight: '48px', padding: '0.5rem 0.75rem', fontSize: '0.9375rem' }} onClick={() => setStep(0)}>
                ← Back to information
              </button>
            </div>
            <OrderSummary shipping={shippingCost} paymentMethod={undefined} />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Payment</h1>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: `1px solid ${paymentMethod === 'cod' ? 'var(--ember)' : 'var(--stone)'}`, borderRadius: 'var(--radius-card)', marginBottom: '0.75rem', cursor: 'pointer', minHeight: '48px', alignItems: 'center' }}>
                <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span>
                  <strong>Cash on delivery (COD)</strong>
                  <br />
                  Pay when your order arrives. Total: {formatEgp(subtotalEgp + shippingCost)}
                </span>
              </label>
              <label style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: `1px solid ${paymentMethod === 'card' ? 'var(--ember)' : 'var(--stone)'}`, borderRadius: 'var(--radius-card)', cursor: 'pointer', minHeight: '48px', alignItems: 'center' }}>
                <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <span>
                  <strong>Pay with card</strong>
                  <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--kohl-gold-dark)', marginTop: '0.25rem' }}>
                    Save {formatEgp(CARD_DISCOUNT_EGP)} with card payment
                  </span>
                </span>
              </label>
              <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }} lang="ar" dir="rtl">
                {copy.checkout.secureDataArabic}
              </p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {copy.checkout.secureData} COD or card. <Link to="/exchange">Free exchange within 14 days</Link> if size doesn&apos;t fit. WhatsApp updates if you opted in.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', display: 'inline-flex', minHeight: '48px', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                onClick={handlePlaceOrder}
              >
                Place order — {formatEgp(orderTotal)}
              </button>
              <button type="button" style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--deep-teal)', cursor: 'pointer', minHeight: '48px', padding: '0.5rem 0.75rem', fontSize: '0.9375rem' }} onClick={() => setStep(1)}>
                ← Back to shipping
              </button>
            </div>
            <OrderSummary shipping={shippingCost} paymentMethod={paymentMethod} />
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
  transition: 'border-color 0.2s ease',
};

const errorInputStyle: CSSProperties = {
  borderColor: 'var(--ember)',
  boxShadow: '0 0 0 2px rgba(232, 89, 60, 0.15)',
};

const errorTextStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--ember)',
  margin: '0.35rem 0 0',
  fontStyle: 'normal',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  margin: '1rem 0 0.35rem',
  color: 'var(--label-brown)',
};

function OrderSummary({
  shipping,
  paymentMethod,
}: {
  shipping?: number;
  paymentMethod?: 'cod' | 'card';
}) {
  const { items, subtotalEgp, giftWrapEgp } = useCart();
  const lineViews = useMemo(() => getCartLineViews(items), [items]);
  const cardDiscount = paymentMethod === 'card' ? CARD_DISCOUNT_EGP : 0;
  const total = subtotalEgp + giftWrapEgp + (shipping ?? 0) - cardDiscount;

  return (
      <aside style={{ padding: '1.25rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--stone)', background: 'var(--papyrus)' }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Order summary</h2>
      {lineViews.map((line) => {
        return (
          <div key={line.key} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--stone)' }}>
              <TeeImage src={line.imageSrc} alt={line.imageAlt} w={128} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 500 }}>{line.productName}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
                {line.size} · Qty {line.qty} · {formatEgp(line.linePriceEgp)}
              </p>
            </div>
          </div>
        );
      })}
      <p style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span>
        <span>{formatEgp(subtotalEgp)}</span>
      </p>
      {giftWrapEgp > 0 ? (
        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
          <span>{CART_SCHEMA.copy.giftWrapLabel}</span>
          <span>{formatEgp(giftWrapEgp)}</span>
        </p>
      ) : null}
      <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
        <span>Shipping</span>
        <span>{shipping != null ? formatEgp(shipping) : '—'}</span>
      </p>
      {paymentMethod === 'card' ? (
        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
          <span>Card discount</span>
          <span>−{formatEgp(CARD_DISCOUNT_EGP)}</span>
        </p>
      ) : null}
      <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--stone)' }}>
        <span>Total</span>
        <span>{formatEgp(total)}</span>
      </p>
    </aside>
  );
}
