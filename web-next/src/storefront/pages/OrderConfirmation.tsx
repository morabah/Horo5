import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { TeeImage } from '../components/TeeImage';
import { getCartLineViews } from '../cart/view';
import { loadLastOrder, saveLastOrder, type LastOrderSnapshot } from '../cart/lastOrder';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, withSupportMessage } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import { getOrder } from '../lib/medusa/client';
import { getOrderGiftWrapEgp, toOrderLines } from '../lib/medusa/adapters';
import { medusaAmountToEgp } from '../lib/medusa/egp-amount';
import { useStableNow } from '../runtime/render-time';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { formatEgp } from '../utils/formatPrice';

function buildPaymentMethodLabel(paymentMethod: LastOrderSnapshot['paymentMethod'], isArabic: boolean) {
  return paymentMethod === 'card'
    ? isArabic ? 'بطاقة' : 'Card'
    : isArabic ? 'الدفع عند الاستلام' : 'COD';
}

function createSnapshotFromOrder(args: {
  fallback: LastOrderSnapshot | null;
  isArabic: boolean;
  order: Awaited<ReturnType<typeof getOrder>>['order'];
  now: Date;
}): LastOrderSnapshot {
  const { fallback, isArabic, order, now } = args;
  const lines = toOrderLines(order);
  const giftWrapEgp = getOrderGiftWrapEgp(order);
  const shipping = medusaAmountToEgp((order.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0) || 0);
  const subtotal = medusaAmountToEgp((order.subtotal ?? 0) || 0);
  const total = medusaAmountToEgp((order.total ?? 0) || 0);
  const firstPaymentSession = order.payment_collections?.[0]?.payment_sessions?.[0];
  const providerId = firstPaymentSession?.provider_id || '';
  const paymentMethod: LastOrderSnapshot['paymentMethod'] =
    providerId.includes('paymob') ? 'card' : 'cod';
  const paymentLabel = buildPaymentMethodLabel(paymentMethod, isArabic);
  const shippingLabel = order.shipping_methods?.[0]?.name || (isArabic ? 'عادي' : 'Standard');
  const displayOrderId = order.display_id ? `HORO-${order.display_id}` : order.id;
  const contactName = [order.shipping_address?.first_name, order.shipping_address?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    orderId: displayOrderId,
    lines,
    cartId: fallback?.cartId,
    medusaOrderId: order.id,
    subtotal,
    giftWrapEgp: giftWrapEgp > 0 ? giftWrapEgp : undefined,
    shipping,
    total,
    paymentMethod,
    shippingMethod: 'standard',
    paymentLabel,
    shippingLabel,
    estimatedDeliveryWindow: fallback?.estimatedDeliveryWindow ?? formatDeliveryWindow(3, 5, now),
    contactEmail: order.email ?? fallback?.contactEmail,
    contactName: contactName || fallback?.contactName,
    contactPhone: order.shipping_address?.phone ?? fallback?.contactPhone,
    shippingLine1: order.shipping_address?.address_1 ?? fallback?.shippingLine1,
    shippingCity: order.shipping_address?.city ?? fallback?.shippingCity,
    whatsappOptIn: fallback?.whatsappOptIn,
  };
}

export function OrderConfirmation() {
  const { locale, copy } = useUiLocale();
  const now = useStableNow();
  const isArabic = locale === 'ar';
  const [order, setOrder] = useState<LastOrderSnapshot | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  // Read the order_id only after mount so SSR and the first client paint match
  // (avoids hydration mismatch from `window.location.search` during render).
  const [urlOrderId, setUrlOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlOrderId(params.get('order_id'));
  }, []);

  useEffect(() => {
    const fallback = loadLastOrder();
    setOrder(fallback);

    if (!urlOrderId) {
      return;
    }

    let cancelled = false;

    void getOrder(urlOrderId)
      .then(({ order: medusaOrder }) => {
        if (cancelled) return;
        const snapshot = createSnapshotFromOrder({
          fallback,
          isArabic,
          now,
          order: medusaOrder,
        });
        saveLastOrder(snapshot);
        setOrder(snapshot);
      })
      .catch(() => {
        // Fall back to the session snapshot when the order fetch is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [isArabic, now, urlOrderId]);

  const lineViews = useMemo(() => getCartLineViews(order?.lines || []), [order?.lines]);

  const displayOrderId = urlOrderId || order?.orderId || null;
  const displayTotal = order?.total ?? null;
  const paymentLabel =
    order?.paymentLabel ??
    (order?.paymentMethod ? buildPaymentMethodLabel(order.paymentMethod, isArabic) : null);
  const shippingLabel =
    order?.shippingLabel ??
    (order?.shippingMethod === 'standard'
      ? isArabic ? 'عادي' : 'Standard'
      : null);

  const arrivalWindow = order?.estimatedDeliveryWindow ??
    (order
      ? formatDeliveryWindow(3, 5, now)
      : isArabic ? 'قيد التأكيد' : 'Pending');
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
  const hasOrderSummary = lineViews.length > 0;
  const itemCount = lineViews.reduce((total, line) => total + line.qty, 0);
  const heroLine = lineViews[0] || null;
  const celebrationHeading = heroLine
    ? isArabic
      ? `${heroLine.productName} في الطريق إليك`
      : `Your ${heroLine.productName} is on the way`
    : copy.confirmation.breadcrumbTitle;

  function handleCopyOrderId() {
    if (!displayOrderId || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(displayOrderId).then(() => {
      setCopiedOrderId(true);
      window.setTimeout(() => setCopiedOrderId(false), 1800);
    }).catch(() => {
      /* ignore */
    });
  }

  return (
    <div className="py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
      <div className="container max-w-[880px]">
        <PageBreadcrumb
          className="mb-6"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.checkout.breadcrumbTitle, to: '/checkout' },
            { label: copy.confirmation.breadcrumbTitle },
          ]}
        />
        <section className="mb-8 overflow-hidden rounded-[var(--radius-card)] bg-[var(--mint-frost)] px-5 py-6 md:px-7 md:py-7">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(14rem,18rem)] md:items-center">
            <div>
              <div
                className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--nile-dark)] text-[1.75rem] text-[var(--nile-dark)]"
                aria-hidden
              >
                ✓
              </div>
              <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
                {copy.confirmation.breadcrumbTitle}
              </p>
              <h1 className="font-headline mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.02] text-obsidian">
                {celebrationHeading}
              </h1>
              <p className="mt-3 max-w-xl font-body text-obsidian">
                {displayOrderId
                  ? isArabic ? `تم تأكيد الطلب #${displayOrderId}.` : `Order #${displayOrderId} confirmed.`
                  : isArabic ? 'تم استلام طلبك.' : 'Your order was received.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-stone/45 bg-white/80 px-4 py-3">
                  <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
                    {copy.confirmation.orderReceived}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-obsidian">
                    {displayOrderId ? `#${displayOrderId}` : isArabic ? 'تم الاستلام' : 'Received'}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone/45 bg-white/80 px-4 py-3">
                  <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
                    {copy.confirmation.deliveryWindow}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-obsidian">{arrivalWindow}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!displayOrderId || typeof navigator === 'undefined' || !navigator.clipboard?.writeText}
                  onClick={handleCopyOrderId}
                  className="btn btn-ghost inline-flex min-h-12 items-center justify-center px-5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedOrderId
                    ? (isArabic ? 'تم النسخ' : 'Copied')
                    : (isArabic ? 'نسخ رقم الطلب' : 'Copy order number')}
                </button>
                {whatsappOrderUrl ? (
                  <a
                    href={whatsappOrderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-6"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {copy.confirmation.whatsappOrderHelp}
                  </a>
                ) : (
                  <Link to="/exchange" className="btn btn-primary inline-flex min-h-12 items-center justify-center px-6">
                    {copy.confirmation.exchangeCta}
                  </Link>
                )}
              </div>
              <p className="mt-4 font-body text-sm text-clay">
                {copy.confirmation.instagramPrompt}
              </p>
            </div>

            {heroLine ? (
              <div className="mx-auto w-full max-w-[18rem]">
                <div className="overflow-hidden rounded-[1.5rem] border border-stone/35 bg-white/70 shadow-sm">
                  <div className="aspect-[4/5] w-full">
                    <TeeImage src={heroLine.imageSrc} alt={heroLine.imageAlt} w={600} />
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-stone/35 bg-white/75 px-4 py-3">
                  <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
                    {copy.confirmation.paymentChosen}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-obsidian">
                    {paymentLabel ?? (isArabic ? 'قيد التأكيد' : 'Pending')}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-6 font-body text-sm text-clay">
            {canReferenceWhatsapp
              ? copy.confirmation.whatsappOrderHelp
              : copy.confirmation.followUpFallback}
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-stone/45 bg-white/75 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-headline text-[1.0625rem] font-semibold text-obsidian">{copy.confirmation.summaryHeading}</h2>
              <p className="mt-2 text-sm text-clay">
                {hasOrderSummary
                  ? isArabic
                    ? `${itemCount} قطعة${displayTotal != null ? ` · ${formatEgp(displayTotal)}` : ''}`
                    : `${itemCount} item${itemCount === 1 ? '' : 's'}${displayTotal != null ? ` · ${formatEgp(displayTotal)}` : ''}`
                  : isArabic
                    ? 'سنرسل التفاصيل النهائية في تحديث الطلب التالي.'
                    : 'Final order details will follow in the next order update.'}
              </p>
            </div>
            {paymentLabel || shippingLabel ? (
              <p className="text-sm text-clay">
                {[paymentLabel, shippingLabel].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>

          {hasOrderSummary ? (
            <div className="mt-5 space-y-3">
              {lineViews.map((line) => (
                <div key={line.key} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone">
                    <TeeImage src={line.imageSrc} alt={line.imageAlt} w={200} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-obsidian">{line.productName}</p>
                    <p className="mt-1 text-sm text-clay">
                      {isArabic
                        ? `المقاس ${line.size} · الكمية ${line.qty} · ${formatEgp(line.linePriceEgp)}`
                        : `Size ${line.size} · Qty ${line.qty} · ${formatEgp(line.linePriceEgp)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-clay">
              {isArabic
                ? 'ملخص الطلب غير متاح في هذه الجلسة، لكن الطلب تم تسجيله بنجاح.'
                : 'The order summary is not available in this session, but the order was recorded successfully.'}
            </p>
          )}
        </section>

        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <Link className="btn btn-ghost" to="/products">
              {copy.shell.shopAll}
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
