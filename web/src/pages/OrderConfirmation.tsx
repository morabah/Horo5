import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommerceContinuityPanel } from '../components/CommerceContinuityPanel';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { getProduct } from '../data/site';
import { getProductMedia } from '../data/images';
import { TeeImage } from '../components/TeeImage';
import { formatEgp } from '../utils/formatPrice';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { loadLastOrder, type LastOrderSnapshot } from '../cart/lastOrder';
import type { CartLine } from '../cart/types';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, withSupportMessage } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import { useStableNow } from '../runtime/render-time';

export function OrderConfirmation() {
  const { locale, copy } = useUiLocale();
  const now = useStableNow();
  const isArabic = locale === 'ar';
  const [order, setOrder] = useState<LastOrderSnapshot | null>(null);

  useEffect(() => {
    setOrder(loadLastOrder());
  }, []);

  const lines: { line: CartLine; p: NonNullable<ReturnType<typeof getProduct>>; lineSub: number }[] = [];
  if (order) {
    for (const line of order.lines) {
      const p = getProduct(line.productSlug);
      if (!p) continue;
      lines.push({ line, p, lineSub: p.priceEgp * line.qty });
    }
  }

  const displayOrderId = order?.orderId ?? null;
  const displayTotal = order?.total ?? null;
  const paymentLabel =
    order?.paymentLabel ??
    (order?.paymentMethod === 'card'
      ? isArabic ? 'بطاقة' : 'Card'
      : order?.paymentMethod === 'paypal'
        ? isArabic ? 'باي بال' : 'PayPal'
        : order?.paymentMethod === 'cod'
          ? isArabic ? 'الدفع عند الاستلام' : 'COD'
          : order?.paymentMethod === 'fawry'
            ? isArabic ? 'فوري' : 'Fawry'
            : order?.paymentMethod === 'wallet'
              ? isArabic ? 'محفظة إلكترونية' : 'Mobile wallet'
              : null);
  const shippingLabel =
    order?.shippingLabel ??
    (order?.shippingMethod === 'express'
      ? isArabic ? 'سريع' : 'Express'
      : order?.shippingMethod === 'standard'
        ? isArabic ? 'عادي' : 'Standard'
        : null);

  const arrivalWindow = order?.estimatedDeliveryWindow ??
    (order
      ? order.shippingMethod === 'express'
        ? formatDeliveryWindow(1, 2, now)
        : formatDeliveryWindow(3, 5, now)
      : isArabic ? 'قيد التأكيد' : 'Pending');
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;
  const whatsappBaseUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappTrackingUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappTrackingUrl
    : isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
      ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
      : null;
  const whatsappOrderUrl =
    order?.whatsappOptIn && order?.contactPhone && displayOrderId
      ? withSupportMessage(whatsappBaseUrl, `Track order #${displayOrderId}`)
      : null;
  const canReferenceWhatsapp = Boolean(whatsappOrderUrl);
  const hasOrderSummary = lines.length > 0;
  const statusCards = [
    {
      label: copy.confirmation.orderReceived,
      value: displayOrderId ? `Order #${displayOrderId}` : isArabic ? 'تم الاستلام' : 'Received',
      detail: order?.contactName
        ? isArabic ? `باسم ${order.contactName}` : `For ${order.contactName}`
        : isArabic ? 'طلبك الآن ضمن قائمة التجهيز.' : 'Your order is now in the fulfillment queue.',
    },
    {
      label: copy.confirmation.paymentChosen,
      value: paymentLabel ?? (isArabic ? 'قيد التأكيد' : 'Pending'),
      detail: shippingLabel
        ? isArabic ? `تم اختيار شحن ${shippingLabel}` : `${shippingLabel} delivery selected`
        : isArabic ? 'سيتم اتباع سرعة التوصيل التي اخترتها عند الدفع.' : 'Delivery speed will follow your checkout selection.',
    },
    {
      label: copy.confirmation.deliveryWindow,
      value: arrivalWindow,
      detail: order?.shippingCity
        ? isArabic ? `الشحن إلى ${order.shippingCity}` : `Shipping to ${order.shippingCity}`
        : isArabic ? 'سنؤكد التسليم باستخدام التفاصيل المحفوظة عند الدفع.' : 'We will confirm handoff with the details saved at checkout.',
    },
    {
      label: copy.confirmation.whatsappStatus,
      value: order?.whatsappOptIn ? copy.confirmation.whatsappEnabled : copy.confirmation.whatsappDisabled,
      detail: canReferenceWhatsapp
        ? isArabic ? 'استخدم رابط المساعدة بالأسفل لهذا الطلب.' : 'Use the order help link below for this purchase.'
        : copy.confirmation.followUpFallback,
    },
  ] as const;

  return (
    <div
      className="pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"
      style={{ padding: '2rem 0 3rem' }}
    >
      <div className="container" style={{ maxWidth: '720px' }}>
        <PageBreadcrumb
          className="mb-6"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.checkout.breadcrumbTitle, to: '/checkout' },
            { label: copy.confirmation.breadcrumbTitle },
          ]}
        />
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
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem' }}>{copy.confirmation.breadcrumbTitle}</h1>
          <p style={{ margin: '0 0 0.5rem' }}>
            {displayOrderId
              ? isArabic ? `تم تأكيد الطلب #${displayOrderId}.` : `Order #${displayOrderId} confirmed.`
              : isArabic ? 'تم استلام طلبك.' : 'Your order was received.'}
          </p>
          <p style={{ margin: 0, color: 'var(--clay-earth)' }}>
            {canReferenceWhatsapp
              ? copy.confirmation.whatsappOrderHelp
              : copy.confirmation.followUpFallback}
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <CommerceContinuityPanel
            eyebrow={copy.checkout.breadcrumbTitle}
            title={copy.confirmation.continuityTitle}
            body={copy.confirmation.continuityBody}
            chips={[copy.confirmation.orderReceived, paymentLabel ?? copy.confirmation.paymentChosen, arrivalWindow]}
          />
        </div>

        <section style={{ marginBottom: '2rem' }} aria-labelledby="order-status-heading">
          <div style={{ marginBottom: '1rem' }}>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.confirmation.statusHeading}</p>
            <h2 id="order-status-heading" style={{ fontSize: '1.25rem', margin: '0.5rem 0 0' }}>{copy.confirmation.statusAtGlance}</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {statusCards.map((card) => (
              <div key={card.label} className="card-glass" style={{ padding: '1.1rem 1rem', border: '1px solid rgba(212, 207, 197, 0.7)' }}>
                <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--clay-earth)]">{card.label}</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', fontWeight: 600 }}>{card.value}</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)', lineHeight: 1.5 }}>{card.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>{copy.confirmation.summaryHeading}</h2>
            {hasOrderSummary ? (
              <>
                {lines.map(({ line, p, lineSub }) => (
                  <div key={`${line.productSlug}-${line.size}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <TeeImage src={getProductMedia(p.slug).main} alt={`HORO “${p.name}” graphic tee`} w={200} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0.25rem 0 0' }}>
                        {isArabic
                          ? `المقاس ${line.size} · الكمية ${line.qty} · ${formatEgp(lineSub)}`
                          : `Size ${line.size} · Qty ${line.qty} · ${formatEgp(lineSub)}`}
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
                    <span>{isArabic ? 'تغليف هدية + بطاقة القصة' : 'Gift wrap + story card'}</span>
                    <span>{formatEgp(order.giftWrapEgp)}</span>
                  </p>
                ) : null}
                <p style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                  <strong>{displayTotal != null ? formatEgp(displayTotal) : isArabic ? 'قيد التأكيد' : 'Pending'}</strong>
                </p>
                {paymentLabel && shippingLabel ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginTop: '1rem' }}>
                    {isArabic ? `الدفع: ${paymentLabel} · التوصيل: ${shippingLabel}` : `Payment: ${paymentLabel} · Delivery: ${shippingLabel}`}
                  </p>
                ) : null}
                {order?.contactEmail || order?.shippingLine1 || order?.shippingCity ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                    {order?.contactEmail ? `${order.contactEmail}` : ''}
                    {order?.shippingLine1 ? `${order?.contactEmail ? ' · ' : ''}${order.shippingLine1}` : ''}
                    {order?.shippingCity ? `${order?.contactEmail || order?.shippingLine1 ? ' · ' : ''}${order.shippingCity}` : ''}
                  </p>
                ) : null}
              </>
            ) : (
              <p style={{ color: 'var(--clay-earth)', margin: 0 }}>
                {isArabic
                  ? 'ملخص طلبك الأخير غير متاح في هذه الجلسة. إذا أكملت الدفع الآن، اترك هذه الصفحة مفتوحة حتى ينتهي مسار التأكيد.'
                  : 'Your latest order summary is not available in this session. If you just checked out, keep this page open until the confirmation flow finishes.'}
              </p>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>{copy.confirmation.nextHeading}</h2>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--warm-charcoal)' }}>
              {canReferenceWhatsapp ? (
                <li style={{ marginBottom: '0.5rem' }}>
                  {isArabic ? 'دعم واتساب متاح لهذا الطلب' : 'WhatsApp support is available for this order'}
                </li>
              ) : (
                <li style={{ marginBottom: '0.5rem' }}>
                  {isArabic ? 'نراجع تفاصيل الطلب ونبدأ التجهيز' : 'We review your order details and prepare fulfillment'}
                </li>
              )}
              <li style={{ marginBottom: '0.5rem' }}>
                {isArabic ? 'نجهز طلبك خلال 1–2 يوم' : 'We prepare your order (1–2 days)'}
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                {canReferenceWhatsapp
                  ? isArabic ? 'مساعدة الطلب متاحة على واتساب' : 'Order help is available on WhatsApp'
                  : isArabic ? 'يتم تسليم الشحنة بمجرد الانتهاء من التجهيز' : 'Delivery handoff follows once your order is packed'}
              </li>
              <li>
                {isArabic
                  ? `يصل إلى بابك خلال النافذة المعتادة (${arrivalWindow}) في أيام العمل`
                  : `Arrives at your door (typical window ${arrivalWindow}, business days)`}
              </li>
            </ol>
            {whatsappOrderUrl ? (
              <a
                href={whatsappOrderUrl}
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
                {copy.confirmation.whatsappOrderHelp}
              </a>
            ) : (
              <Link
                to="/exchange"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '48px',
                }}
              >
                {copy.confirmation.exchangeCta}
              </Link>
            )}
          </div>
        </div>

        {instagramUrl ? (
          <div className="card-glass" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--warm-glow)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
              {isArabic ? 'شاركنا أول ظهور لها' : 'Tag us in your first wear'}
            </h2>
            <p style={{ margin: '0 0 1rem' }}>{copy.confirmation.instagramPrompt}</p>
            <a className="btn btn-ghost" href={instagramUrl} target="_blank" rel="noreferrer">
              {isArabic ? 'تابع @horoegypt →' : 'Follow @horoegypt →'}
            </a>
          </div>
        ) : null}

        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>
            {isArabic ? 'واصل الاستكشاف' : 'Keep exploring'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link className="btn btn-ghost" to="/feelings">
              {copy.shell.shopByFeeling}
            </Link>
            <Link className="btn btn-ghost" to="/">
              {copy.confirmation.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
