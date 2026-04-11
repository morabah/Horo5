import { Link, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { trackBeginCheckout, trackPurchase } from '../analytics/events';
import { CommerceContinuityPanel } from '../components/CommerceContinuityPanel';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { TeeImage } from '../components/TeeImage';
import { getCartLineViews } from '../cart/view';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { useCart } from '../cart/CartContext';
import { saveLastOrder } from '../cart/lastOrder';
import { MEDUSA_CART_ID_STORAGE_KEY } from '../cart/types';
import { CART_SCHEMA, CHECKOUT_SCHEMA, PDP_SCHEMA } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import { completeCart, createPaymentSessions, updateCart } from '../lib/medusa/client';
import { useStableNow } from '../runtime/render-time';

const STEP0_FIELD_ORDER = ['email', 'phone', 'name', 'line1', 'city'] as const;

type FieldErrors = Record<string, string>;

const CARD_DISCOUNT_EGP = 30;

const inputBaseClass =
  'w-full min-h-12 rounded-lg border border-stone bg-white px-3 text-base text-obsidian transition-[border-color,box-shadow] focus-visible:border-deep-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/25';
const inputErrorClass = 'border-ember shadow-[0_0_0_2px_rgba(232,89,60,0.15)]';
const labelClass = 'mb-1.5 mt-4 block text-xs font-medium text-label first:mt-0';
const errTextClass = 'mt-1.5 text-[0.8125rem] text-ember';

function validateStep0(
  fields: { email: string; phone: string; name: string; line1: string; city: string },
  isArabic: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.email.trim()) errors.email = isArabic ? 'نحتاج بريدك الإلكتروني لإرسال تحديثات الطلب.' : 'We need your email to send order updates.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.';
  if (!fields.phone.trim()) errors.phone = isArabic ? 'رقم الهاتف يساعدنا على التواصل بخصوص التوصيل.' : 'Your phone number helps us reach you about delivery.';
  if (!fields.name.trim()) errors.name = isArabic ? 'نحتاج الاسم الكامل لملصق الشحن.' : 'We need your full name for the shipping label.';
  if (!fields.line1.trim()) errors.line1 = isArabic ? 'إلى أين نرسل طلبك؟' : 'Where should we deliver your order?';
  if (!fields.city.trim()) errors.city = isArabic ? 'ما المدينة التي نشحن إليها؟' : 'Which city should we ship to?';
  return errors;
}

function radioCardClass(active: boolean) {
  return [
    'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
    active ? 'border-ember' : 'border-stone hover:border-stone/80',
  ].join(' ');
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotalEgp, giftWrapEgp, clearCart } = useCart();
  const { locale, copy } = useUiLocale();
  const now = useStableNow();
  const isArabic = locale === 'ar';
  const steps = [copy.checkout.stepInformation, copy.checkout.stepShipping, copy.checkout.stepPayment] as const;
  const stepsShort = steps;
  const [step, setStep] = useState(0);
  const [highestCompleted, setHighestCompleted] = useState(-1);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  /** Demo storefront: PayPal/Fawry/wallet are selectable for UX; no live PSP integration in this repo. */
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'paypal' | 'fawry' | 'wallet'>('cod');

  const [errors, setErrors] = useState<FieldErrors>({});
  /** Demo: express row sets preferred payment before the payment step. */
  const [expressNote, setExpressNote] = useState<string | null>(null);

  const shippingCost = shippingMethod === 'express' ? 120 : 60;

  const cardDiscount = paymentMethod === 'card' ? CARD_DISCOUNT_EGP : 0;
  const orderTotal = subtotalEgp + giftWrapEgp + shippingCost - cardDiscount;

  const estimatedDeliveryRange = useMemo(
    () =>
      shippingMethod === 'express'
        ? formatDeliveryWindow(1, 2, now)
        : formatDeliveryWindow(3, 5, now),
    [now, shippingMethod],
  );
  const paymentLabel =
    paymentMethod === 'card'
      ? isArabic ? 'بطاقة' : 'Card'
      : paymentMethod === 'paypal'
        ? copy.checkout.payPayPalTitle
        : paymentMethod === 'fawry'
          ? copy.checkout.payFawryTitle
          : paymentMethod === 'wallet'
            ? copy.checkout.payWalletTitle
            : isArabic ? 'الدفع عند الاستلام' : 'COD';
  const shippingLabel = shippingMethod === 'express' ? (isArabic ? 'سريع' : 'Express') : (isArabic ? 'عادي' : 'Standard');

  const beganCheckoutRef = useRef(false);
  useEffect(() => {
    if (items.length === 0 || beganCheckoutRef.current) return;
    beganCheckoutRef.current = true;
    trackBeginCheckout(items, subtotalEgp, giftWrapEgp);
  }, [items, subtotalEgp, giftWrapEgp]);

  function handleStepClick(targetStep: number) {
    if (targetStep <= highestCompleted) {
      setStep(targetStep);
    }
  }

  function handleContinueToShipping(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validateStep0({ email, phone, name: fullName, line1, city }, isArabic);
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

  async function handlePlaceOrder() {
    if (placingOrder) return;
    setPlacingOrder(true);
    try {
      const localCartId = typeof window !== 'undefined' ? localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY) : null;
      let medusaOrderId: string | undefined;
      let orderId = `HORO-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      if (localCartId) {
        await updateCart(localCartId, {
          email: email.trim(),
          shipping_address: {
            first_name: fullName.trim(),
            address_1: line1.trim(),
            city: city.trim(),
            phone: phone.trim(),
            country_code: 'eg',
          },
          billing_address: {
            first_name: fullName.trim(),
            address_1: line1.trim(),
            city: city.trim(),
            phone: phone.trim(),
            country_code: 'eg',
          },
        });
        await createPaymentSessions(localCartId);
        const completion = await completeCart(localCartId);
        if (completion.type === 'order' && completion.order) {
          medusaOrderId = completion.order.id;
          orderId = completion.order.display_id
            ? `HORO-${completion.order.display_id}`
            : completion.order.id;
        }
      }
      trackPurchase({
        transactionId: orderId,
        value: orderTotal,
        currency: 'EGP',
        lines: items.map((l) => ({ ...l })),
      });
      saveLastOrder({
        orderId,
        cartId: localCartId ?? undefined,
        medusaOrderId,
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
      flushSync(() => {
        navigate('/checkout/success');
      });
      setTimeout(() => {
        clearCart();
      }, 0);
    } catch {
      setPlacingOrder(false);
    }
  }

  const checkoutBreadcrumbItems = useMemo(
    () => [
      { label: copy.shell.home, to: '/' as const },
      { label: CART_SCHEMA.copy.heading, to: '/cart' as const },
      { label: copy.checkout.breadcrumbTitle },
    ],
    [copy.checkout.breadcrumbTitle, copy.shell.home],
  );

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-papyrus py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16">
        <div className="container mx-auto max-w-3xl px-4 md:px-8">
          <PageBreadcrumb className="mb-6" items={checkoutBreadcrumbItems} />
          <h1 className="font-headline text-[clamp(1.5rem,3vw,2rem)] font-semibold text-obsidian">
            {isArabic ? 'لا يوجد ما يمكن إتمامه الآن' : 'Nothing to check out'}
          </h1>
          <p className="mt-3 max-w-md font-body text-sm text-clay md:text-base">
            {isArabic
              ? 'سلتك فارغة. أضف تصميماً من المتجر ثم عد هنا لإتمام طلبك.'
              : 'Your bag is empty. Add a design from the shop, then return here to complete your order.'}
          </p>
          <Link className="btn btn-primary mt-6 inline-flex min-h-12 items-center" to="/feelings">
            {copy.shell.shopByFeeling}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-papyrus py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-8">
        <PageBreadcrumb className="mb-4" items={checkoutBreadcrumbItems} />

        <Link
          to="/cart"
          className="font-body mb-6 inline-flex min-h-12 items-center text-sm text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          {copy.checkout.backToCart}
        </Link>

        <p
          className="font-label mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-clay sm:text-xs sm:tracking-[0.22em]"
          aria-live="polite"
        >
          {isArabic
            ? `إتمام الشراء · الخطوة ${step + 1} من 3 · ${steps[step]}`
            : `Checkout · Step ${step + 1} of 3 · ${steps[step]}`}
        </p>

        <div
          className="mb-8 w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={isArabic ? `الخطوة ${step + 1} من 3: ${steps[step]}` : `Checkout step ${step + 1} of 3: ${steps[step]}`}
        >
          <div className="mx-auto flex w-max items-center justify-center gap-0 px-0.5">
            {steps.map((label, i) => {
              const isCompleted = i <= highestCompleted;
              const isCurrent = i === step;
              const isClickable = i <= highestCompleted;

              const dotClass = isCurrent
                ? 'h-3.5 w-3.5 bg-ember shadow-[0_0_0_4px_rgba(232,89,60,0.2)]'
                : isCompleted
                  ? 'h-3 w-3 bg-obsidian'
                  : 'h-3 w-3 bg-stone';

              const labelClassInner = isCurrent || isCompleted ? 'text-obsidian' : 'text-clay';

              return (
                <div key={label} className="flex items-center">
                  {i > 0 ? (
                    <div
                      className={`h-0.5 w-[clamp(2rem,8vw,5rem)] transition-colors ${isCompleted ? 'bg-obsidian' : 'bg-stone'}`}
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleStepClick(i)}
                    disabled={!isClickable && !isCurrent}
                    className={`flex min-h-12 min-w-12 flex-col items-center gap-2 border-0 bg-transparent px-2 py-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-label={`Step ${i + 1}: ${label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                  >
                    <span className={`shrink-0 rounded-full transition-all ${dotClass}`} />
                    <span className={`font-label text-[clamp(0.6875rem,2.8vw,0.8125rem)] uppercase tracking-[0.12em] ${isCurrent ? 'font-semibold' : 'font-normal'} ${labelClassInner}`}>
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{stepsShort[i]}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <p className="font-label -mt-5 mb-6 text-center text-[10px] uppercase tracking-wider text-clay sm:hidden">
          Swipe steps above if needed
        </p>

        <ul className="cart-trust-strip mb-6" aria-label="Checkout trust signals">
          {CHECKOUT_SCHEMA.trustStripItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mb-8 font-body text-xs text-clay">
          <Link to="/privacy" className="text-deep-teal underline decoration-deep-teal/30 underline-offset-2 hover:text-obsidian">
            Privacy policy
          </Link>
          <span aria-hidden className="px-2 text-stone">
            ·
          </span>
          <Link to="/terms" className="text-deep-teal underline decoration-deep-teal/30 underline-offset-2 hover:text-obsidian">
            Terms
          </Link>
        </p>

        <div className="mb-8">
          <CommerceContinuityPanel
            eyebrow="HORO checkout"
            title={copy.checkout.paymentContinuityTitle}
            body={copy.checkout.paymentContinuityBody}
            chips={PDP_SCHEMA.trustStripItems}
          />
        </div>

        {step === 0 && (
          <form onSubmit={handleContinueToShipping}>
            <div className="mb-8 rounded-2xl border border-stone/60 bg-white/70 p-4 shadow-sm md:p-5">
              <p className="font-headline text-base font-semibold text-obsidian">{copy.checkout.expressHeading}</p>
              <p className="mt-1.5 font-body text-sm leading-relaxed text-clay">{copy.checkout.expressSub}</p>
              {expressNote ? (
                <p className="mt-3 rounded-lg border border-deep-teal/20 bg-frost-blue/35 px-3 py-2 font-body text-sm text-obsidian" role="status">
                  {expressNote}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="font-label inline-flex min-h-12 min-w-[8.5rem] flex-1 items-center justify-center rounded-xl border border-obsidian bg-obsidian px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-obsidian/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:flex-none"
                  onClick={() => {
                    setPaymentMethod('wallet');
                    setExpressNote(`${copy.checkout.expressPickedPrefix}: ${copy.checkout.applePayLabel}`);
                  }}
                >
                  {copy.checkout.applePayLabel}
                </button>
                <button
                  type="button"
                  className="font-label inline-flex min-h-12 min-w-[8.5rem] flex-1 items-center justify-center rounded-xl border border-stone bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:flex-none"
                  onClick={() => {
                    setPaymentMethod('wallet');
                    setExpressNote(`${copy.checkout.expressPickedPrefix}: ${copy.checkout.googlePayLabel}`);
                  }}
                >
                  {copy.checkout.googlePayLabel}
                </button>
                <button
                  type="button"
                  className="font-label inline-flex min-h-12 min-w-[8.5rem] flex-1 items-center justify-center rounded-xl border border-stone bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:flex-none"
                  onClick={() => {
                    setPaymentMethod('paypal');
                    setExpressNote(`${copy.checkout.expressPickedPrefix}: ${copy.checkout.paypalExpressLabel}`);
                  }}
                >
                  {copy.checkout.paypalExpressLabel}
                </button>
              </div>
              <p className="mt-3 font-body text-[11px] leading-snug text-clay">{copy.checkout.expressWalletHint}</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
              <div>
                <h1 className="font-headline text-xl font-semibold text-obsidian">{copy.checkout.headingContact}</h1>
                <label htmlFor="email" className={labelClass}>
                  {isArabic ? 'البريد الإلكتروني *' : 'Email *'}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => {
                      const { email: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`${inputBaseClass} ${errors.email ? inputErrorClass : ''}`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email ? (
                  <p id="email-error" className={errTextClass}>
                    {errors.email}
                  </p>
                ) : null}

                <label htmlFor="phone" className={labelClass}>
                  {isArabic ? 'الهاتف (واتساب) *' : 'Phone (WhatsApp) *'}
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors((prev) => {
                      const { phone: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`${inputBaseClass} ${errors.phone ? inputErrorClass : ''}`}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone ? (
                  <p id="phone-error" className={errTextClass}>
                    {errors.phone}
                  </p>
                ) : null}

                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-obsidian">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="h-[18px] w-[18px] accent-deep-teal"
                  />
                  {copy.checkout.whatsappOptIn}
                </label>

                <p className="mt-3 text-[0.9375rem] font-semibold text-obsidian">{copy.checkout.guestCheckout}</p>
                <p className="mt-1.5 text-sm text-clay">
                  {isArabic
                    ? `الشحن يبدأ من ${formatEgp(60)}، وستختار السرعة في الخطوة التالية.`
                    : `Shipping from ${formatEgp(60)}; you'll choose speed on the next step.`}
                </p>

                <h2 className="font-headline mt-8 text-lg font-semibold text-obsidian">{copy.checkout.headingShippingAddress}</h2>
                <label htmlFor="name" className={labelClass}>
                  {isArabic ? 'الاسم الكامل *' : 'Full name *'}
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors((prev) => {
                      const { name: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name ? (
                  <p id="name-error" className={errTextClass}>
                    {errors.name}
                  </p>
                ) : null}

                <label htmlFor="line1" className={labelClass}>
                  {isArabic ? 'العنوان *' : 'Address line 1 *'}
                </label>
                <input
                  id="line1"
                  type="text"
                  autoComplete="address-line1"
                  value={line1}
                  onChange={(e) => {
                    setLine1(e.target.value);
                    setErrors((prev) => {
                      const { line1: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`${inputBaseClass} ${errors.line1 ? inputErrorClass : ''}`}
                  aria-invalid={!!errors.line1}
                  aria-describedby={errors.line1 ? 'line1-error' : undefined}
                />
                {errors.line1 ? (
                  <p id="line1-error" className={errTextClass}>
                    {errors.line1}
                  </p>
                ) : null}

                <label htmlFor="city" className={labelClass}>
                  {isArabic ? 'المدينة *' : 'City *'}
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setErrors((prev) => {
                      const { city: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`${inputBaseClass} ${errors.city ? inputErrorClass : ''}`}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city ? (
                  <p id="city-error" className={errTextClass}>
                    {errors.city}
                  </p>
                ) : null}

                <button type="submit" className="btn btn-primary mt-6 min-h-12 w-full">
                  {isArabic ? 'المتابعة إلى الشحن' : 'Continue to shipping'}
                </button>
              </div>
              <OrderSummary shipping={undefined} paymentMethod={undefined} />
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-headline text-xl font-semibold text-obsidian">{copy.checkout.headingShippingMethod}</h1>
              <label className={`${radioCardClass(shippingMethod === 'standard')} mb-3 mt-4`}>
                <input type="radio" name="ship" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{isArabic ? 'عادي' : 'Standard'}</strong> — {isArabic ? '3–5 أيام عمل' : '3–5 business days'} · {formatEgp(60)}
                </span>
              </label>
              <label className={radioCardClass(shippingMethod === 'express')}>
                <input type="radio" name="ship" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{isArabic ? 'سريع' : 'Express'}</strong> — {isArabic ? '1–2 يوم عمل' : '1–2 business days'} · {formatEgp(120)}
                </span>
              </label>
              <p className="mt-4 font-body text-sm text-obsidian">
                {isArabic
                  ? `${copy.checkout.deliveryLabel} (أيام العمل): ${estimatedDeliveryRange}`
                  : `${copy.checkout.deliveryLabel} (business days): ${estimatedDeliveryRange}`}
              </p>
              <p className="mt-3 text-sm text-clay">
                {isArabic ? `الإجمالي يشمل ${formatEgp(shippingCost)} للشحن. ` : `Total includes ${formatEgp(shippingCost)} shipping. `}
                <Link to="/exchange" className="text-deep-teal underline decoration-deep-teal/30 underline-offset-2 hover:text-obsidian">
                  {isArabic ? 'استبدال مجاني خلال 14 يوماً' : 'Free exchange within 14 days'}
                </Link>{' '}
                {isArabic ? 'إذا لم يكن المقاس مناسباً.' : "if size doesn't fit."}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-6 min-h-12 w-full"
                onClick={handleContinueToPayment}
                aria-label={isArabic ? 'المتابعة إلى خطوة الدفع' : 'Continue to payment step'}
              >
                {isArabic ? 'المتابعة إلى الدفع' : 'Continue to payment'}
              </button>
              <button
                type="button"
                className="mt-3 min-h-12 bg-transparent px-1 text-sm text-deep-teal hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                onClick={() => setStep(0)}
              >
                {isArabic ? '→ العودة إلى البيانات' : '← Back to information'}
              </button>
            </div>
            <OrderSummary shipping={shippingCost} paymentMethod={undefined} />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-headline text-xl font-semibold text-obsidian">{copy.checkout.headingPayment}</h1>
              <p className="font-label mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
                {isArabic ? 'الدفع عند الاستلام أو بالبطاقة' : 'Pay on delivery or card'}
              </p>
              <label className={`${radioCardClass(paymentMethod === 'cod')} mb-3 mt-2`}>
                <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery (COD)'}</strong>
                  <br />
                  {isArabic
                    ? `ادفع عند وصول طلبك. الإجمالي: ${formatEgp(subtotalEgp + shippingCost)}`
                    : `Pay when your order arrives. Total: ${formatEgp(subtotalEgp + shippingCost)}`}
                </span>
              </label>
              <label className={`${radioCardClass(paymentMethod === 'card')} mb-3`}>
                <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{isArabic ? 'الدفع بالبطاقة' : 'Pay with card'}</strong>
                  <span className="mt-1 block text-sm text-kohl-gold-dark">
                    {isArabic
                      ? `وفّر ${formatEgp(CARD_DISCOUNT_EGP)} عند الدفع بالبطاقة`
                      : `Save ${formatEgp(CARD_DISCOUNT_EGP)} with card payment`}
                  </span>
                </span>
              </label>
              <p className="font-label mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
                {isArabic ? 'المحافظ الرقمية وطرق الدفع في مصر' : 'Digital wallets & Egypt methods'}
              </p>
              <label className={`${radioCardClass(paymentMethod === 'paypal')} mb-3 mt-2`}>
                <input type="radio" name="pay" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{copy.checkout.payPayPalTitle}</strong>
                  <span className="mt-1 block text-sm text-kohl-gold-dark">{copy.checkout.payPayPalBody}</span>
                </span>
              </label>
              <label className={`${radioCardClass(paymentMethod === 'fawry')} mb-3`}>
                <input type="radio" name="pay" checked={paymentMethod === 'fawry'} onChange={() => setPaymentMethod('fawry')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{copy.checkout.payFawryTitle}</strong>
                  <span className="mt-1 block text-sm text-kohl-gold-dark">{copy.checkout.payFawryBody}</span>
                </span>
              </label>
              <label className={`${radioCardClass(paymentMethod === 'wallet')} mb-3`}>
                <input type="radio" name="pay" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                <span className="font-body text-sm text-obsidian">
                  <strong>{copy.checkout.payWalletTitle}</strong>
                  <span className="mt-1 block text-sm text-kohl-gold-dark">{copy.checkout.payWalletBody}</span>
                </span>
              </label>
              <p className="mt-6 text-sm text-clay" lang="ar" dir="rtl">
                {copy.checkout.secureDataArabic}
              </p>
              <p className="mt-2 text-sm text-obsidian">
                {copy.checkout.paymentExtraSecureLine}{' '}
                <Link to="/exchange" className="text-deep-teal underline decoration-deep-teal/30 underline-offset-2 hover:text-obsidian">
                  {isArabic ? 'استبدال مجاني خلال 14 يوماً' : 'Free exchange within 14 days'}
                </Link>{' '}
                {isArabic ? 'إذا لم يكن المقاس مناسباً. وتصل تحديثات واتساب إذا اخترت ذلك.' : "if size doesn't fit. WhatsApp updates if you opted in."}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-6 inline-flex min-h-12 w-full items-center justify-center disabled:pointer-events-none disabled:opacity-60"
                onClick={() => void handlePlaceOrder()}
                disabled={placingOrder}
                aria-busy={placingOrder}
              >
                {placingOrder ? copy.checkout.placingOrder : isArabic ? `أكّد الطلب — ${formatEgp(orderTotal)}` : `Place order — ${formatEgp(orderTotal)}`}
              </button>
              <button
                type="button"
                className="mt-3 min-h-12 bg-transparent px-1 text-sm text-deep-teal hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal disabled:opacity-50"
                onClick={() => setStep(1)}
                disabled={placingOrder}
              >
                {isArabic ? '→ العودة إلى الشحن' : '← Back to shipping'}
              </button>
            </div>
            <OrderSummary shipping={shippingCost} paymentMethod={paymentMethod} />
          </div>
        )}
      </div>
    </div>
  );
}

function OrderSummary({
  shipping,
  paymentMethod,
}: {
  shipping?: number;
  paymentMethod?: 'cod' | 'card' | 'paypal' | 'fawry' | 'wallet';
}) {
  const { locale, copy } = useUiLocale();
  const isArabic = locale === 'ar';
  const { items, subtotalEgp, giftWrapEgp } = useCart();
  const lineViews = useMemo(() => getCartLineViews(items), [items]);
  const cardDiscount = paymentMethod === 'card' ? CARD_DISCOUNT_EGP : 0;
  const total = subtotalEgp + giftWrapEgp + (shipping ?? 0) - cardDiscount;

  return (
    <aside className="h-fit rounded-xl border border-stone bg-papyrus/90 p-5 shadow-sm lg:sticky lg:top-28">
      <h2 className="font-headline mb-4 text-base font-semibold text-obsidian">{copy.checkout.orderSummaryHeading}</h2>
      {lineViews.map((line) => (
        <div key={line.key} className="mb-3 flex gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone">
            <TeeImage src={line.imageSrc} alt={line.imageAlt} w={128} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-obsidian">{line.productName}</p>
            <p className="mt-1 text-sm text-clay">
              {isArabic
                ? `المقاس ${line.size} · الكمية ${line.qty} · ${formatEgp(line.linePriceEgp)}`
                : `${line.size} · Qty ${line.qty} · ${formatEgp(line.linePriceEgp)}`}
            </p>
          </div>
        </div>
      ))}
      <p className="flex justify-between font-body text-sm text-obsidian">
        <span>{isArabic ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
        <span>{formatEgp(subtotalEgp)}</span>
      </p>
      {giftWrapEgp > 0 ? (
        <p className="mt-2 flex justify-between text-sm text-clay">
          <span>{CART_SCHEMA.copy.giftWrapLabel}</span>
          <span>{formatEgp(giftWrapEgp)}</span>
        </p>
      ) : null}
      <p className="mt-2 flex justify-between text-sm text-clay">
        <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
        <span>{shipping != null ? formatEgp(shipping) : '—'}</span>
      </p>
      {paymentMethod === 'card' ? (
        <p className="mt-2 flex justify-between text-sm text-clay">
          <span>{isArabic ? 'خصم البطاقة' : 'Card discount'}</span>
          <span>−{formatEgp(CARD_DISCOUNT_EGP)}</span>
        </p>
      ) : null}
      <p className="mt-4 flex justify-between border-t border-stone pt-4 font-semibold text-obsidian">
        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
        <span>{formatEgp(total)}</span>
      </p>
    </aside>
  );
}
