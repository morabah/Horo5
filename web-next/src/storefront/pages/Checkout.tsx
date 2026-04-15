import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { trackBeginCheckout, trackPurchase } from '../analytics/events';
import type { CartLine } from '../cart/types';
import { BilingualServiceBlock } from '../components/BilingualServiceBlock';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { TeeImage } from '../components/TeeImage';
import { useCart } from '../cart/CartContext';
import { loadSavedShipping, saveSavedShipping } from '../cart/savedShipping';
import { saveLastOrder, type LastOrderSnapshot } from '../cart/lastOrder';
import { buildHoroCustomerOrderRef } from '../lib/horo-order-ref';
import { getCartLineViews, type CartLineView } from '../cart/view';
import { MEDUSA_CART_ID_STORAGE_KEY } from '../cart/types';
import { CART_SCHEMA, CHECKOUT_SCHEMA, EGYPT_CITY_OPTIONS } from '../data/domain-config';
import { getProduct } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import {
  addLineItem,
  addShippingMethod,
  completeCart,
  createCart,
  getCart,
  getCheckoutStatus,
  isMissingMedusaPublishableKeyError,
  isStaleMedusaCartCustomerError,
  initiatePaymentSession,
  listPaymentProviders,
  listShippingOptions,
  recreateGuestCartFromCart,
  updateCart,
} from '../lib/medusa/client';
import {
  CHECKOUT_AUX_CACHE_MAX_AGE_MS,
  getFreshPaymentProviders,
  getFreshShippingOptions,
  normalizePaymentProviders,
  setPaymentProvidersCache,
  setShippingOptionsCache,
} from '../lib/medusa/checkout-aux-cache';
import {
  getOrderGiftWrapEgp,
  toCartLines,
  toOrderLines,
} from '../lib/medusa/adapters';
import { medusaAmountToEgp } from '../lib/medusa/egp-amount';
import type {
  CheckoutStatusResponse,
  MedusaCart,
  MedusaOrder,
  MedusaPaymentProvider,
  MedusaPaymentSession,
  MedusaShippingOption,
  PaymobPublicSessionData,
} from '../lib/medusa/types';
import { useStableNow } from '../runtime/render-time';
import { formatDeliveryWindow } from '../utils/deliveryEstimate';
import { formatEgp } from '../utils/formatPrice';

const CHECKOUT_FIELD_ORDER = ['phone', 'name', 'line1', 'city', 'email'] as const;

/** Extra status polls when Paymob still reports `pending` (webhook / capture lag). */
async function pollPaymobCheckoutStatus(
  cartId: string,
  initial: CheckoutStatusResponse | null,
): Promise<CheckoutStatusResponse | null> {
  let s = initial;
  for (let attempt = 0; attempt < 3 && s?.status === 'pending'; attempt += 1) {
    await new Promise((r) => setTimeout(r, 450 + attempt * 250));
    s = await getCheckoutStatus(cartId).catch(() => null);
  }
  return s;
}

type FieldErrors = Record<string, string>;
type PaymentChoice = 'cod' | 'card';

function omitFieldError(errors: FieldErrors, key: keyof FieldErrors): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}
type CheckoutPaymentMethodKind = PaymentChoice | 'wallet';
type CheckoutPaymentMethod = {
  id: string;
  kind: CheckoutPaymentMethodKind;
  label: string;
  description: string;
};
type ParsedGoogleAddress = {
  city: string;
  line1: string;
  placeId?: string | null;
  postalCode: string;
  province: string;
};

const EGYPT_GOVERNORATE_LIST = EGYPT_CITY_OPTIONS as readonly string[];

/** Map Google Places components to a canonical governorate from `EGYPT_CITY_OPTIONS` when possible. */
function matchGovernorateToEgyptCatalog(parsed: { city: string; province: string }): string | null {
  const hay = `${parsed.province} ${parsed.city}`.toLowerCase();
  for (const opt of EGYPT_CITY_OPTIONS) {
    if (hay.includes(opt.toLowerCase())) return opt;
  }
  return null;
}

/**
 * Google Places is optional and only augments street (`address_1`) when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.
 * Governorate is always the canonical `EGYPT_CITY_OPTIONS` select — never inferred pricing or payment methods from Google.
 */
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
let googlePlacesLoader: Promise<unknown> | null = null;

const inputBaseClass =
  'w-full min-h-12 rounded-lg border border-stone bg-white px-3 text-base text-obsidian transition-[border-color,box-shadow] focus-visible:border-deep-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/25';
const inputErrorClass = 'border-ember shadow-[0_0_0_2px_rgba(232,89,60,0.15)]';
const labelClass = 'mb-1.5 mt-4 block text-xs font-medium text-label first:mt-0';
const errTextClass = 'mt-1.5 text-[0.8125rem] text-ember';

function normalizeOptionalEmail(email: string) {
  const normalized = email.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateCheckoutFields(
  fields: { email: string; phone: string; name: string; line1: string; city: string },
  isArabic: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedEmail = normalizeOptionalEmail(fields.email);
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.';
  }
  if (!fields.phone.trim()) errors.phone = isArabic ? 'رقم الهاتف يساعدنا على التواصل بخصوص التوصيل.' : 'Your phone number helps us reach you about delivery.';
  if (!fields.name.trim()) errors.name = isArabic ? 'نحتاج الاسم الكامل لملصق الشحن.' : 'We need your full name for the shipping label.';
  if (!fields.line1.trim()) errors.line1 = isArabic ? 'إلى أين نرسل طلبك؟' : 'Where should we deliver your order?';
  if (!fields.city.trim()) errors.city = isArabic ? 'ما المدينة التي نشحن إليها؟' : 'Which city should we ship to?';
  return errors;
}

function radioCardClass(active: boolean) {
  return [
    'flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
    active ? 'border-ember' : 'border-stone hover:border-stone/80',
  ].join(' ');
}

function getMissingPublishableKeyMessage(isArabic: boolean) {
  return isArabic
    ? 'مفتاح Medusa publishable غير مضبوط. أضف NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY في web-next/.env.local ثم أعد تشغيل الواجهة.'
    : 'Missing Medusa publishable key. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local and restart the frontend.';
}

function getReadableCheckoutError(
  error: unknown,
  isArabic: boolean,
  fallback: { ar: string; en: string },
) {
  if (isMissingMedusaPublishableKeyError(error)) {
    return getMissingPublishableKeyMessage(isArabic);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return isArabic ? fallback.ar : fallback.en;
}

function getStoredCartId() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredCartId(cartId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!cartId) {
      window.localStorage.removeItem(MEDUSA_CART_ID_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MEDUSA_CART_ID_STORAGE_KEY, cartId);
  } catch {
    /* ignore */
  }
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function resolveCheckoutPaymentMethodKind(providerId: string): CheckoutPaymentMethodKind {
  const normalized = providerId.toLowerCase();
  if (normalized.includes('system_default')) return 'cod';
  if (normalized.includes('apple') || normalized.includes('google')) return 'wallet';
  return 'card';
}

function humanizePaymentProviderId(providerId: string) {
  return providerId
    .replace(/^pp_/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Wallets first, then Paymob card, then other providers, COD last — Medusa ids only; labels unchanged below. */
function checkoutPaymentProviderSortKey(providerId: string): number {
  const id = providerId.toLowerCase();
  const kind = resolveCheckoutPaymentMethodKind(providerId);
  if (kind === 'wallet') {
    if (id.includes('apple')) return 0;
    if (id.includes('google')) return 1;
    return 2;
  }
  if (kind === 'cod') return 100;
  if (id.includes('paymob')) return 10;
  return 20;
}

function buildCheckoutPaymentMethods(
  providers: MedusaPaymentProvider[],
  isArabic: boolean,
): CheckoutPaymentMethod[] {
  const dedupedProviders = normalizePaymentProviders(providers).filter(
    (provider, index, list) => list.findIndex((candidate) => candidate.id === provider.id) === index,
  ).sort((left, right) => {
    const leftKey = checkoutPaymentProviderSortKey(left.id);
    const rightKey = checkoutPaymentProviderSortKey(right.id);
    if (leftKey !== rightKey) return leftKey - rightKey;
    return left.id.localeCompare(right.id);
  });

  return dedupedProviders.map((provider) => {
    const kind = resolveCheckoutPaymentMethodKind(provider.id);

    if (kind === 'cod') {
      return {
        id: provider.id,
        kind,
        label: isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery (COD)',
        description: isArabic
          ? 'الطريقة الأسرع. نؤكد الطلب مباشرة بعد حفظ البيانات.'
          : 'The fastest option. Your order is confirmed as soon as checkout is saved.',
      };
    }

    if (provider.id.toLowerCase().includes('apple')) {
      return {
        id: provider.id,
        kind,
        label: 'Apple Pay',
        description: isArabic
          ? 'يتم التحويل إلى Paymob لإكمال الدفع عبر Apple Pay ثم العودة لتأكيد الطلب.'
          : 'You will continue to Paymob to finish Apple Pay, then return here for order confirmation.',
      };
    }

    if (provider.id.toLowerCase().includes('google')) {
      return {
        id: provider.id,
        kind,
        label: 'Google Pay',
        description: isArabic
          ? 'يتم التحويل إلى Paymob لإكمال الدفع عبر Google Pay ثم العودة لتأكيد الطلب.'
          : 'You will continue to Paymob to finish Google Pay, then return here for order confirmation.',
      };
    }

    const providerName = humanizePaymentProviderId(provider.id);

    if (!provider.id.toLowerCase().includes('paymob')) {
      return {
        id: provider.id,
        kind,
        label: isArabic ? `الدفع عبر ${providerName}` : `Pay with ${providerName}`,
        description: isArabic
          ? 'سيكمل هذا المزود خطوة الدفع بعد حفظ بيانات الشحن.'
          : 'This provider will continue the payment step after the shipping details are saved.',
      };
    }

    return {
      id: provider.id,
      kind,
      label: isArabic ? 'بطاقة عبر Paymob' : 'Card via Paymob',
      description: isArabic
        ? 'سنحوّلك إلى Paymob لإكمال الدفع ثم نعود لتأكيد الطلب.'
        : 'You will continue to Paymob to finish payment, then return here for order confirmation.',
    };
  });
}

function resolveCartLineVariantId(line: CartLine) {
  return line.variantId || getProduct(line.productSlug)?.variantsBySize?.[line.size]?.id || null;
}

function getDefaultCheckoutPaymentMethod(methods: CheckoutPaymentMethod[]) {
  return methods.find((method) => method.kind === 'cod') || methods[0] || null;
}

function getSelectedPaymentSession(cart: MedusaCart | null, providerId?: string | null) {
  const sessions = cart?.payment_collection?.payment_sessions || [];
  if (providerId) {
    const exact = sessions.find((session) => session.provider_id === providerId);
    if (exact) return exact;
  }
  return sessions[0] || null;
}

function getAddressComponent(components: Array<{ long_name?: string; short_name?: string; types?: string[] }>, type: string) {
  return components.find((component) => component.types?.includes(type))?.long_name || '';
}

function parseGoogleAddress(place: { address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>; formatted_address?: string; place_id?: string | null }): ParsedGoogleAddress {
  const components = Array.isArray(place.address_components) ? place.address_components : [];
  const streetNumber = getAddressComponent(components, 'street_number');
  const route = getAddressComponent(components, 'route');
  const neighborhood = getAddressComponent(components, 'sublocality') || getAddressComponent(components, 'neighborhood');
  const line1 =
    [streetNumber, route].filter(Boolean).join(' ').trim() ||
    neighborhood ||
    place.formatted_address?.split(',')[0]?.trim() ||
    '';
  const city =
    getAddressComponent(components, 'locality') ||
    getAddressComponent(components, 'administrative_area_level_2') ||
    getAddressComponent(components, 'sublocality') ||
    '';
  const province =
    getAddressComponent(components, 'administrative_area_level_1') ||
    city;
  const postalCode = getAddressComponent(components, 'postal_code');

  return {
    city,
    line1,
    placeId: place.place_id || null,
    postalCode,
    province,
  };
}

function loadGooglePlacesApi(apiKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Places requires a browser environment.'));
  }

  const win = window as Window & {
    google?: {
      maps?: {
        places?: unknown;
      };
    };
  };

  if (win.google?.maps?.places) {
    return Promise.resolve(win.google);
  }

  if (googlePlacesLoader) {
    return googlePlacesLoader;
  }

  googlePlacesLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (win.google?.maps?.places) {
        resolve(win.google);
      } else {
        reject(new Error('Google Places failed to initialize.'));
      }
    };
    script.onerror = () => reject(new Error('Google Places failed to load.'));
    document.head.appendChild(script);
  });

  return googlePlacesLoader;
}

function getPaymentSessionRedirectUrl(session: MedusaPaymentSession | null) {
  const redirectUrl = (session?.data as PaymobPublicSessionData | undefined)?.redirect_url;
  return typeof redirectUrl === 'string' && redirectUrl.trim().length > 0 ? redirectUrl : null;
}

function buildOrderSnapshot(args: {
  email: string;
  estimatedDeliveryRange: string;
  fullName: string;
  isArabic: boolean;
  line1: string;
  order: MedusaOrder;
  paymentMethod: PaymentChoice;
  phone: string;
  shippingLabel?: string;
  whatsappOptIn: boolean;
}): LastOrderSnapshot {
  const { email, estimatedDeliveryRange, fullName, isArabic, line1, order, paymentMethod, phone, shippingLabel, whatsappOptIn } = args;
  const lines = toOrderLines(order);
  const subtotal = medusaAmountToEgp((order.subtotal ?? 0) || 0);
  const shipping = medusaAmountToEgp((order.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0) || 0);
  const total = medusaAmountToEgp((order.total ?? 0) || 0);
  const rawTax = order.tax_total;
  const taxEgp =
    typeof rawTax === 'number' && rawTax > 0
      ? medusaAmountToEgp(rawTax)
      : typeof rawTax === 'string' && Number(rawTax) > 0
        ? medusaAmountToEgp(Number(rawTax))
        : undefined;
  const rawDisc = order.discount_total;
  const discountEgp =
    typeof rawDisc === 'number' && rawDisc !== 0
      ? medusaAmountToEgp(Math.abs(rawDisc))
      : typeof rawDisc === 'string' && Number(rawDisc) !== 0
        ? medusaAmountToEgp(Math.abs(Number(rawDisc)))
        : undefined;
  const giftWrapEgp = getOrderGiftWrapEgp(order);
  const paymentLabel = paymentMethod === 'card'
    ? isArabic ? 'بطاقة' : 'Card'
    : isArabic ? 'الدفع عند الاستلام' : 'COD';
  const finalShippingLabel = shippingLabel || order.shipping_methods?.[0]?.name || (isArabic ? 'عادي' : 'Standard');

  return {
    orderId: buildHoroCustomerOrderRef(order),
    lines,
    cartId: getStoredCartId() ?? undefined,
    medusaOrderId: order.id,
    subtotal,
    giftWrapEgp: giftWrapEgp > 0 ? giftWrapEgp : undefined,
    discountEgp: discountEgp && discountEgp > 0 ? discountEgp : undefined,
    taxEgp: taxEgp && taxEgp > 0 ? taxEgp : undefined,
    shipping,
    total,
    paymentMethod,
    shippingMethod: 'standard',
    paymentLabel,
    shippingLabel: finalShippingLabel,
    estimatedDeliveryWindow: estimatedDeliveryRange,
    contactEmail: order.email ?? (email.trim() || undefined),
    contactName:
      [order.shipping_address?.first_name, order.shipping_address?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || fullName.trim() || undefined,
    contactPhone: order.shipping_address?.phone ?? (phone.trim() || undefined),
    shippingLine1: order.shipping_address?.address_1 ?? (line1.trim() || undefined),
    shippingCity: order.shipping_address?.city ?? undefined,
    whatsappOptIn,
  };
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotalEgp, giftWrapEgp, clearCart, replaceMedusaCartId, awaitPendingCartSync } = useCart();
  const { locale, copy } = useUiLocale();
  const now = useStableNow();
  const isArabic = locale === 'ar';
  const [mounted, setMounted] = useState(false);
  const [checkoutCart, setCheckoutCart] = useState<MedusaCart | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [paymentProviders, setPaymentProviders] = useState<MedusaPaymentProvider[]>([]);
  const [shippingOption, setShippingOption] = useState<MedusaShippingOption | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymobPendingNeedsAction, setPaymobPendingNeedsAction] = useState(false);
  const completionLockRef = useRef<string | null>(null);
  /** Reused across retries so Medusa can dedupe concurrent complete requests. */
  const completionIdempotencyKeyRef = useRef<string | null>(null);
  const handleCartCompletionRef = useRef<
    ((activeCartId: string, choice: PaymentChoice) => Promise<void>) | null
  >(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const [addressPlaceId, setAddressPlaceId] = useState<string | null>(null);
  const [rememberAddressOnDevice, setRememberAddressOnDevice] = useState(false);

  const hydrateCheckoutFromCart = useCallback((cart: MedusaCart) => {
    const composedName = [cart.shipping_address?.first_name, cart.shipping_address?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const saved = loadSavedShipping();

    setCheckoutCart(cart);
    setEmail(cart.email || saved?.email || '');
    setPhone(cart.shipping_address?.phone || saved?.phone || '');
    setFullName(composedName || saved?.fullName || '');
    setLine1(cart.shipping_address?.address_1 || saved?.line1 || '');
    setCity(cart.shipping_address?.city || saved?.city || '');
    setProvince(cart.shipping_address?.province || saved?.province || '');
    setPostalCode(cart.shipping_address?.postal_code || saved?.postalCode || '');
    setWhatsappOptIn(cart.metadata?.whatsapp_opt_in === false ? false : true);

    const selectedProviderId = cart.payment_collection?.payment_sessions?.[0]?.provider_id;

    if (selectedProviderId) {
      setSelectedPaymentMethodId(selectedProviderId);
    }
  }, []);

  const ensureCheckoutCartAvailable = useCallback(async () => {
    const knownCartId = cartId || getStoredCartId();

    if (knownCartId) {
      try {
        const { cart } = await getCart(knownCartId);

        // If this cart was already completed (order placed), discard it and
        // fall through to create a fresh cart from the current bag items.
        if (cart.completed_at) {
          setStoredCartId(null);
          replaceMedusaCartId(null);
          setCartId(null);
          setCheckoutCart(null);
        } else {
          setStoredCartId(cart.id);
          replaceMedusaCartId(cart.id);
          setCartId(cart.id);
          hydrateCheckoutFromCart(cart);
          return { cart, cartId: cart.id };
        }
      } catch {
        setStoredCartId(null);
        replaceMedusaCartId(null);
        setCartId(null);
        setCheckoutCart(null);
      }
    }

    if (items.length === 0) {
      throw new Error(isArabic ? 'لا توجد عناصر في السلة حالياً.' : 'Your bag is empty right now.');
    }

    const created = await createCart();
    let activeCart = created.cart;
    let addedLineCount = 0;

    for (const line of items) {
      const variantId = resolveCartLineVariantId(line);
      if (!variantId) continue;
      const response = await addLineItem(activeCart.id, variantId, line.qty);
      activeCart = response.cart;
      addedLineCount += 1;
    }

    if (addedLineCount === 0) {
      throw new Error(
        isArabic
          ? 'تعذر ربط عناصر السلة بمتغيرات Medusa الحالية.'
          : 'The current bag items could not be matched to live Medusa variants.',
      );
    }

    setStoredCartId(activeCart.id);
    replaceMedusaCartId(activeCart.id);
    setCartId(activeCart.id);
    hydrateCheckoutFromCart(activeCart);

    return {
      cart: activeCart,
      cartId: activeCart.id,
    };
  }, [cartId, hydrateCheckoutFromCart, isArabic, items, replaceMedusaCartId]);

  const ensureCheckoutCartAvailableRef = useRef(ensureCheckoutCartAvailable);
  ensureCheckoutCartAvailableRef.current = ensureCheckoutCartAvailable;

  function validateFieldOnBlur(field: string) {
    const all = validateCheckoutFields({ email, phone, name: fullName, line1, city }, isArabic);
    if (all[field]) {
      setErrors((prev) => ({ ...prev, [field]: all[field] }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const shippingCost = useMemo(() => {
    if (typeof checkoutCart?.shipping_total === 'number') {
      return medusaAmountToEgp(checkoutCart.shipping_total);
    }
    if (typeof shippingOption?.amount === 'number') {
      return medusaAmountToEgp(shippingOption.amount);
    }
    return 0;
  }, [checkoutCart?.shipping_total, shippingOption?.amount]);

  const orderTotal = useMemo(() => {
    if (typeof checkoutCart?.total === 'number') {
      return medusaAmountToEgp(checkoutCart.total);
    }
    return subtotalEgp + giftWrapEgp + shippingCost;
  }, [checkoutCart?.total, giftWrapEgp, shippingCost, subtotalEgp]);

  const estimatedDeliveryRange = useMemo(
    () => formatDeliveryWindow(3, 5, now),
    [now],
  );

  const checkoutLines = useMemo(
    () => (checkoutCart ? toCartLines(checkoutCart) : items),
    [checkoutCart, items],
  );

  const beganCheckoutRef = useRef(false);
  useEffect(() => {
    if (items.length === 0 || beganCheckoutRef.current) return;
    beganCheckoutRef.current = true;
    trackBeginCheckout(items, subtotalEgp, giftWrapEgp);
  }, [giftWrapEgp, items, subtotalEgp]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const incomingCartId = params.get('cart_id') || cartId || getStoredCartId();
    const isPaymobReturn = params.get('payment_provider') === 'paymob' || params.get('resume') === '1' || params.get('success') === 'true';

    const loadCheckout = async () => {
      setLoadingCheckout(true);
      setCheckoutError(null);
      setPaymentError(null);
      setPaymobPendingNeedsAction(false);
      setPaymentVerifying(false);

      try {
        const resolvedCheckout = incomingCartId
          ? await ensureCheckoutCartAvailableRef.current()
          : items.length > 0
            ? await ensureCheckoutCartAvailableRef.current()
            : null;
        if (cancelled) return;

        if (!resolvedCheckout) {
          setLoadingCheckout(false);
          setCartId(null);
          return;
        }

        const activeCartId = resolvedCheckout.cartId;
        setStoredCartId(activeCartId);
        setCartId(activeCartId);

        const [status, { cart }] = await Promise.all([
          getCheckoutStatus(activeCartId).catch(() => null),
          getCart(activeCartId),
        ]);

        if (!cancelled && status?.status === 'completed' && status.order_id) {
          setStoredCartId(null);
          clearCart();
          setCartId(null);
          setCheckoutCart(null);
          navigate(`/checkout/success?order_id=${status.order_id}`);
          return;
        }

        if (cancelled) return;
        hydrateCheckoutFromCart(cart);

        const cachedShip =
          cart.region_id ? getFreshShippingOptions(activeCartId, CHECKOUT_AUX_CACHE_MAX_AGE_MS) : null;
        const cachedProv =
          cart.region_id ? getFreshPaymentProviders(cart.region_id, CHECKOUT_AUX_CACHE_MAX_AGE_MS) : null;

        if (cachedShip?.length) {
          const selectedMethod = cart.shipping_methods?.[0];
          const resolvedFromCache =
            selectedMethod
              ? cachedShip.find((option) => option.id === selectedMethod.shipping_option_id) || cachedShip[0]
              : cachedShip[0];
          setShippingOption(resolvedFromCache);
        }
        if (cachedProv?.length) {
          setPaymentProviders(cachedProv);
        }

        const [liveShippingOptions, liveProviders] = await Promise.all([
          cart.region_id
            ? listShippingOptions(activeCartId).then((response) => response.shipping_options).catch(() => [])
            : Promise.resolve([]),
          cart.region_id
            ? listPaymentProviders(cart.region_id)
                .then((response) => normalizePaymentProviders(response.payment_providers))
                .catch(() => [])
            : Promise.resolve([]),
        ]);
        if (cancelled) return;

        const selectedShippingMethod = cart.shipping_methods?.[0];
        const resolvedShippingOption =
          liveShippingOptions.find((option) => option.id === selectedShippingMethod?.shipping_option_id) ||
          liveShippingOptions[0] ||
          null;
        setShippingOption(resolvedShippingOption);
        setPaymentProviders(liveProviders);

        setShippingOptionsCache(activeCartId, liveShippingOptions);
        if (cart.region_id) {
          setPaymentProvidersCache(cart.region_id, liveProviders);
        }

        if (isPaymobReturn) {
          let paymobStatus = status;
          if (paymobStatus?.status === 'pending') {
            setPaymentVerifying(true);
            paymobStatus = await pollPaymobCheckoutStatus(activeCartId, paymobStatus);
          }

          if (cancelled) return;

          if (paymobStatus?.status === 'completed' && paymobStatus.order_id) {
            setStoredCartId(null);
            clearCart();
            setCartId(null);
            setCheckoutCart(null);
            navigate(`/checkout/success?order_id=${paymobStatus.order_id}`);
            return;
          }

          if (paymobStatus?.status === 'authorized') {
            void handleCartCompletionRef.current?.(activeCartId, 'card');
            return;
          }

          if (paymobStatus?.status === 'failed') {
            setPaymentError(
              isArabic
                ? 'تعذر تأكيد دفع Paymob. جرّب مرة أخرى أو اختر الدفع عند الاستلام.'
                : 'Paymob did not confirm the payment. Try again or choose cash on delivery.',
            );
          } else if (paymobStatus?.status === 'pending') {
            setPaymobPendingNeedsAction(true);
          }
        }
      } catch (error) {
        if (cancelled) return;
        setCheckoutError(
          getReadableCheckoutError(error, isArabic, {
            ar: 'تعذر تحميل سلة الدفع الحالية.',
            en: 'Unable to load the active checkout cart.',
          }),
        );
      } finally {
        if (!cancelled) {
          setPaymentVerifying(false);
          setLoadingCheckout(false);
        }
      }
    };

    void loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [cartId, clearCart, hydrateCheckoutFromCart, isArabic, items.length, mounted, navigate]);

  const paymentMethods = useMemo(
    () => buildCheckoutPaymentMethods(paymentProviders, isArabic),
    [isArabic, paymentProviders],
  );

  /** Mirrors live Medusa `payment_providers` so the strip never promises card when only COD is enabled. */
  const checkoutPaymentTrustLine = useMemo(() => {
    if (paymentMethods.length === 0) return null;
    const hasCod = paymentMethods.some((m) => m.kind === 'cod');
    const hasOnline = paymentMethods.some((m) => m.kind === 'card' || m.kind === 'wallet');
    if (hasCod && hasOnline) {
      return isArabic
        ? 'الدفع عند الاستلام وخيارات بطاقة / محفظة متاحة'
        : 'COD plus card / wallet options available';
    }
    if (hasCod) return isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery (COD)';
    if (hasOnline) return isArabic ? 'دفع إلكتروني عبر المزود المفعّل' : 'Online payment via enabled provider';
    return null;
  }, [paymentMethods, isArabic]);

  const governorateSelectValue = useMemo(() => {
    const t = city.trim();
    return EGYPT_GOVERNORATE_LIST.includes(t) ? t : '';
  }, [city]);
  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedPaymentMethodId) || null,
    [paymentMethods, selectedPaymentMethodId],
  );
  const selectedPaymentSession = useMemo(
    () => getSelectedPaymentSession(checkoutCart, selectedPaymentMethod?.id),
    [checkoutCart, selectedPaymentMethod?.id],
  );
  const paymentRedirectUrl = useMemo(
    () => getPaymentSessionRedirectUrl(selectedPaymentSession),
    [selectedPaymentSession],
  );

  useEffect(() => {
    if (selectedPaymentMethodId && paymentMethods.some((method) => method.id === selectedPaymentMethodId)) {
      return;
    }
    setSelectedPaymentMethodId(getDefaultCheckoutPaymentMethod(paymentMethods)?.id || null);
  }, [paymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    if (!googleMapsApiKey || !addressInputRef.current) return;

    let cancelled = false;
    let autocompleteListener: { remove?: () => void } | null = null;

    void loadGooglePlacesApi(googleMapsApiKey)
      .then((googleApi) => {
        if (cancelled || !addressInputRef.current) return;
        const mapsApi = googleApi as {
          maps?: {
            places?: {
              Autocomplete: new (
                input: HTMLInputElement,
                options: Record<string, unknown>,
              ) => {
                addListener: (eventName: string, handler: () => void) => { remove?: () => void };
                getPlace: () => {
                  address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>;
                  formatted_address?: string;
                  place_id?: string | null;
                };
              };
            };
          };
        };
        const Autocomplete = mapsApi.maps?.places?.Autocomplete;
        if (!Autocomplete) return;

        const autocomplete = new Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: 'eg' },
          fields: ['address_components', 'formatted_address', 'place_id'],
          types: ['address'],
        });

        autocompleteListener = autocomplete.addListener('place_changed', () => {
          const parsed = parseGoogleAddress(autocomplete.getPlace() || {});
          if (parsed.line1) setLine1(parsed.line1);
          const matchedGov = matchGovernorateToEgyptCatalog(parsed);
          if (matchedGov) {
            setCity(matchedGov);
            setProvince(matchedGov);
          } else {
            if (parsed.city) setCity(parsed.city);
            setProvince(parsed.province);
          }
          setPostalCode(parsed.postalCode);
          setAddressPlaceId(parsed.placeId || null);
        });

        setPlacesReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setPlacesReady(false);
        }
      });

    return () => {
      cancelled = true;
      autocompleteListener?.remove?.();
    };
  }, []);

  async function refreshCartState(activeCartId: string, cartHint?: MedusaCart) {
    const cart =
      cartHint && cartHint.id === activeCartId ? cartHint : (await getCart(activeCartId)).cart;
    setCheckoutCart(cart);
    const selectedShippingMethod = cart.shipping_methods?.[0];

    const cachedShip = getFreshShippingOptions(activeCartId, CHECKOUT_AUX_CACHE_MAX_AGE_MS);
    const cachedProv = cart.region_id
      ? getFreshPaymentProviders(cart.region_id, CHECKOUT_AUX_CACHE_MAX_AGE_MS)
      : null;

    if (selectedShippingMethod && cachedShip?.length) {
      const resolvedFromCache =
        cachedShip.find((option) => option.id === selectedShippingMethod.shipping_option_id) ||
        cachedShip[0] ||
        null;
      setShippingOption(resolvedFromCache);
    }
    if (cachedProv?.length) {
      setPaymentProviders(cachedProv);
    }

    const [liveShippingOptions, liveProviders] = await Promise.all([
      selectedShippingMethod
        ? listShippingOptions(activeCartId).then((response) => response.shipping_options).catch(() => [])
        : Promise.resolve([]),
      cart.region_id
        ? listPaymentProviders(cart.region_id)
            .then((response) => normalizePaymentProviders(response.payment_providers))
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    if (selectedShippingMethod) {
      const resolvedOption =
        liveShippingOptions.find((option) => option.id === selectedShippingMethod.shipping_option_id) ||
        liveShippingOptions[0] ||
        null;
      setShippingOption(resolvedOption);
    }

    setPaymentProviders(liveProviders);

    setShippingOptionsCache(activeCartId, liveShippingOptions);
    if (cart.region_id) {
      setPaymentProvidersCache(cart.region_id, liveProviders);
    }

    return cart;
  }

  async function preparePaymentSession(
    method: CheckoutPaymentMethod,
    activeCheckoutCart: MedusaCart | null = checkoutCart,
    activeCartId: string | null = cartId,
  ) {
    if (!activeCheckoutCart || !activeCartId) {
      throw new Error(isArabic ? 'سلة الدفع غير متاحة.' : 'Checkout cart is not available.');
    }

    const normalizedEmail = normalizeOptionalEmail(email);

    await initiatePaymentSession(activeCheckoutCart, method.id, {
      cart_id: activeCartId,
      checkout: {
        email: normalizedEmail,
        payment_method_kind: method.kind,
        payment_method_provider_id: method.id,
        shipping_address: {
          address_1: line1.trim(),
          city: city.trim(),
          country_code: 'eg',
          phone: phone.trim(),
          postal_code: postalCode.trim() || undefined,
          province: province.trim() || undefined,
          ...splitFullName(fullName),
        },
      },
      email: normalizedEmail,
      payment_method_kind: method.kind,
      payment_method_provider_id: method.id,
      place_id: addressPlaceId || undefined,
    });

    const refreshedCart = await refreshCartState(activeCartId);
    return {
      cart: refreshedCart,
      method,
      session: getSelectedPaymentSession(refreshedCart, method.id),
    };
  }

  async function handleCartCompletion(activeCartId: string, choice: PaymentChoice) {
    if (completionLockRef.current === activeCartId || placingOrder) {
      return;
    }

    completionLockRef.current = activeCartId;
    setPlacingOrder(true);
    setPaymentError(null);

    if (!completionIdempotencyKeyRef.current) {
      completionIdempotencyKeyRef.current =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `complete_${activeCartId}_${Date.now()}`;
    }
    const idempotencyKey = completionIdempotencyKeyRef.current;

    try {
      const completion = await completeCart(activeCartId, idempotencyKey);

      if (completion.type === 'order' && completion.order) {
        completionIdempotencyKeyRef.current = null;
        const snapshot = buildOrderSnapshot({
          email,
          estimatedDeliveryRange: estimatedDeliveryRange,
          fullName,
          isArabic,
          line1,
          order: completion.order,
          paymentMethod: choice,
          phone,
          shippingLabel: shippingOption?.type?.label || shippingOption?.name,
          whatsappOptIn,
        });

        saveLastOrder(snapshot);
        if (rememberAddressOnDevice) {
          saveSavedShipping({
            email: email.trim(),
            phone: phone.trim(),
            fullName: fullName.trim(),
            line1: line1.trim(),
            city: city.trim(),
            province: province.trim() || city.trim(),
            postalCode: postalCode.trim(),
          });
        }
        trackPurchase({
          transactionId: snapshot.medusaOrderId ?? snapshot.orderId,
          value: snapshot.total,
          currency: 'EGP',
          lines: snapshot.lines,
        });
        setStoredCartId(null);
        clearCart();
        setCartId(null);
        setCheckoutCart(null);
        navigate(`/checkout/success?order_id=${completion.order.id}`);
        return;
      }

      const refreshedCart = completion.cart || (await refreshCartState(activeCartId));
      setCheckoutCart(refreshedCart);

      const refreshedSession = getSelectedPaymentSession(refreshedCart, selectedPaymentMethod?.id);
      if (refreshedSession?.status === 'error' || refreshedSession?.status === 'canceled') {
        setPaymentError(isArabic ? 'تعذر تأكيد الدفع. جرّب مرة أخرى أو اختر الدفع عند الاستلام.' : 'Payment could not be confirmed. Try again or switch to cash on delivery.');
      } else {
        setPaymentError(
          choice === 'card'
            ? isArabic ? 'دفع البطاقة ما زال يحتاج خطوة إضافية في Paymob قبل إنشاء الطلب.' : 'Card payment still needs one more Paymob step before the order can be created.'
            : isArabic ? 'تعذر إكمال السلة الآن. جرّب مرة أخرى بعد لحظات.' : 'The cart could not be completed yet. Try again in a moment.'
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('409')) {
        const st = await getCheckoutStatus(activeCartId).catch(() => null);
        if (st?.status === 'completed' && st.order_id) {
          completionIdempotencyKeyRef.current = null;
          setStoredCartId(null);
          clearCart();
          setCartId(null);
          setCheckoutCart(null);
          navigate(`/checkout/success?order_id=${st.order_id}`);
          return;
        }
      }
      setPaymentError(getReadableCheckoutError(error, isArabic, {
        ar: 'حدث خطأ أثناء إكمال الطلب.',
        en: 'An error occurred while completing the order.',
      }));
    } finally {
      setPlacingOrder(false);
      completionLockRef.current = null;
    }
  }

  handleCartCompletionRef.current = handleCartCompletion;

  async function retryPaymobStatusCheck() {
    if (!cartId) return;
    setPaymentError(null);
    setPaymobPendingNeedsAction(false);
    setPaymentVerifying(true);
    try {
      const initial = await getCheckoutStatus(cartId).catch(() => null);
      const resolved = await pollPaymobCheckoutStatus(cartId, initial);

      if (resolved?.status === 'completed' && resolved.order_id) {
        setStoredCartId(null);
        clearCart();
        setCartId(null);
        setCheckoutCart(null);
        navigate(`/checkout/success?order_id=${resolved.order_id}`);
        return;
      }

      if (resolved?.status === 'authorized') {
        await handleCartCompletion(cartId, 'card');
        return;
      }

      if (resolved?.status === 'failed') {
        setPaymentError(
          isArabic
            ? 'تعذر تأكيد دفع Paymob. جرّب مرة أخرى أو اختر الدفع عند الاستلام.'
            : 'Paymob did not confirm the payment. Try again or choose cash on delivery.',
        );
        return;
      }

      setPaymobPendingNeedsAction(true);
    } finally {
      setPaymentVerifying(false);
    }
  }

  async function persistInformationAndShipping() {
    await awaitPendingCartSync();
    const ensured = await ensureCheckoutCartAvailable();
    const activeInitialCartId = ensured.cartId;

    const persistWithCartId = async (activeCartId: string) => {
      const { firstName, lastName } = splitFullName(fullName);
      const normalizedEmail = normalizeOptionalEmail(email);
      const updated = await updateCart(activeCartId, {
        email: normalizedEmail,
        metadata: {
          ...(checkoutCart?.metadata || {}),
          whatsapp_opt_in: whatsappOptIn,
        },
        shipping_address: {
          address_1: line1.trim(),
          city: city.trim(),
          country_code: 'eg',
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim(),
          postal_code: postalCode.trim() || undefined,
          province: province.trim() || undefined,
        },
        billing_address: {
          address_1: line1.trim(),
          city: city.trim(),
          country_code: 'eg',
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim(),
          postal_code: postalCode.trim() || undefined,
          province: province.trim() || undefined,
        },
      });

      let refreshedCart = updated.cart;
      let liveProviders: MedusaPaymentProvider[] = [];
      const liveShippingOptions = await listShippingOptions(activeCartId).then((response) => response.shipping_options).catch(() => []);

      if (liveShippingOptions.length === 0) {
        setShippingOption(null);
        throw new Error(isArabic ? 'لا توجد طريقة شحن مفعلة لهذه السلة بعد.' : 'No live shipping method is available for this cart yet.');
      }

      const preferredShippingOption = liveShippingOptions[0];
      const attachedShippingMethod = refreshedCart.shipping_methods?.[0];

      if (!attachedShippingMethod || attachedShippingMethod.shipping_option_id !== preferredShippingOption.id) {
        const attached = await addShippingMethod(activeCartId, preferredShippingOption.id);
        refreshedCart = attached.cart;
      }

      setCheckoutCart(refreshedCart);
      setShippingOption(preferredShippingOption);

      if (refreshedCart.region_id) {
        liveProviders = await listPaymentProviders(refreshedCart.region_id)
          .then((response) => normalizePaymentProviders(response.payment_providers))
          .catch(() => []);
        setPaymentProviders(liveProviders);
      }

      setShippingOptionsCache(activeCartId, liveShippingOptions);
      if (refreshedCart.region_id) {
        setPaymentProvidersCache(refreshedCart.region_id, liveProviders);
      }

      return {
        cart: refreshedCart,
        paymentProviders: liveProviders,
      };
    };

    try {
      const persistedCart = await persistWithCartId(activeInitialCartId);
      return { ...persistedCart, cartId: activeInitialCartId };
    } catch (error) {
      if (!isStaleMedusaCartCustomerError(error)) {
        throw error;
      }

      const sourceCart = ensured.cart ?? checkoutCart ?? (await getCart(activeInitialCartId)).cart;
      const recovered = await recreateGuestCartFromCart(sourceCart);
      const recoveredCartId = recovered.cart.id;

      setStoredCartId(recoveredCartId);
      replaceMedusaCartId(recoveredCartId);
      setCartId(recoveredCartId);
      setCheckoutCart(recovered.cart);

      const persistedCart = await persistWithCartId(recoveredCartId);
      return { ...persistedCart, cartId: recoveredCartId };
    }
  }

  async function handleSubmitCheckout(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validateCheckoutFields({ email, phone, name: fullName, line1, city }, isArabic);
    setErrors(fieldErrors);
    setCheckoutError(null);
    setShippingError(null);
    setPaymentError(null);

    if (Object.keys(fieldErrors).length > 0) {
      const firstInvalidField = CHECKOUT_FIELD_ORDER.find((field) => fieldErrors[field]);
      if (firstInvalidField) {
        requestAnimationFrame(() => {
          document.getElementById(firstInvalidField)?.focus();
        });
      }
      return;
    }

    setSavingInfo(true);
    try {
      const persisted = await persistInformationAndShipping();
      setSavingInfo(false);
      const paymentMethodsAfterSave = buildCheckoutPaymentMethods(persisted.paymentProviders, isArabic);
      const fallbackMethod = selectedPaymentMethod ?? getDefaultCheckoutPaymentMethod(paymentMethodsAfterSave);
      if (fallbackMethod && selectedPaymentMethodId !== fallbackMethod.id) {
        setSelectedPaymentMethodId(fallbackMethod.id);
      }
      await handlePlaceOrder(persisted.cartId, persisted.cart, fallbackMethod);
    } catch (error) {
      setShippingError(getReadableCheckoutError(error, isArabic, {
        ar: 'تعذر حفظ بيانات الشحن.',
        en: 'Unable to save the checkout address.',
      }));
    } finally {
      setSavingInfo(false);
    }
  }

  async function handlePlaceOrder(
    activeCartId: string | null = cartId,
    activeCheckoutCart: MedusaCart | null = checkoutCart,
    methodOverride?: CheckoutPaymentMethod | null,
  ) {
    await awaitPendingCartSync();
    if (!activeCartId || !activeCheckoutCart) {
      setPaymentError(isArabic ? 'سلة الدفع غير جاهزة.' : 'The checkout cart is not ready.');
      return;
    }

    const paymentMethodToUse = methodOverride ?? selectedPaymentMethod;
    if (!paymentMethodToUse) {
      setPaymentError(
        isArabic
          ? 'احفظ عنوان الشحن أولاً لتحميل طرق الدفع. إذا بقيت فارغة بعد ذلك، فمزود الدفع غير مفعّل لهذه المنطقة في Medusa.'
          : 'Save the shipping address first to load payment methods. If it still stays empty, Medusa has no enabled payment provider for this region.',
      );
      return;
    }

    try {
      if (paymentMethodToUse.kind !== 'cod') {
        const { session } = await preparePaymentSession(paymentMethodToUse, activeCheckoutCart, activeCartId);
        const redirectUrl = getPaymentSessionRedirectUrl(session || null);
        if (!redirectUrl) {
          throw new Error(
            isArabic
              ? 'لم يرسل مزود الدفع رابط المتابعة بعد.'
              : 'The selected payment provider did not return a redirect URL yet.',
          );
        }
        window.location.assign(redirectUrl);
        return;
      }

      await preparePaymentSession(paymentMethodToUse, activeCheckoutCart, activeCartId);
      await handleCartCompletion(activeCartId, 'cod');
    } catch (error) {
      setPaymentError(getReadableCheckoutError(error, isArabic, {
        ar: 'تعذر بدء الدفع.',
        en: 'Unable to start the payment step.',
      }));
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

  if (!mounted || loadingCheckout) {
    return (
      <div className="min-h-[60vh] bg-papyrus py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16">
        <div className="container mx-auto max-w-3xl px-4 md:px-8">
          <PageBreadcrumb className="mb-6" items={checkoutBreadcrumbItems} />
          <div className="rounded-xl border border-stone bg-white p-6 text-sm text-clay">
            {paymentVerifying ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <span
                  className="inline-block h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-stone border-t-deep-teal"
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-obsidian">{copy.checkout.paymobVerifyingTitle}</p>
                  <p className="mt-2 text-sm text-clay">{copy.checkout.paymobVerifyingBody}</p>
                </div>
              </div>
            ) : isArabic ? (
              'جارٍ تحميل بيانات الدفع…'
            ) : (
              'Loading checkout…'
            )}
          </div>
        </div>
      </div>
    );
  }

  if (checkoutError) {
    return (
      <div className="min-h-[60vh] bg-papyrus py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16">
        <div className="container mx-auto max-w-3xl px-4 md:px-8">
          <PageBreadcrumb className="mb-6" items={checkoutBreadcrumbItems} />
          <div className="rounded-xl border border-ember/30 bg-white p-6 text-sm text-ember">
            {checkoutError}
          </div>
        </div>
      </div>
    );
  }

  if (checkoutLines.length === 0) {
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

  const shippingLabel = shippingOption?.type?.label || shippingOption?.name || (isArabic ? 'شحن قياسي' : 'Standard shipping');
  const paymobSelected = Boolean(
    selectedPaymentMethod &&
    (selectedPaymentMethod.kind === 'card' || selectedPaymentMethod.kind === 'wallet') &&
    selectedPaymentMethod.id.toLowerCase().includes('paymob'),
  );
  const externalPaymentSelected = Boolean(
    selectedPaymentMethod && (selectedPaymentMethod.kind === 'card' || selectedPaymentMethod.kind === 'wallet'),
  );
  const mobileLineCountLabel = isArabic
    ? `${checkoutLines.length} ${checkoutLines.length === 1 ? 'قطعة' : 'قطع'}`
    : `${checkoutLines.length} ${checkoutLines.length === 1 ? 'item' : 'items'}`;
  const hasSavedShipping = Boolean(checkoutCart?.shipping_methods?.length);
  const noPaymentProvidersAfterShipping = hasSavedShipping && paymentMethods.length === 0;
  const submitDisabled = savingInfo || placingOrder || paymentVerifying || noPaymentProvidersAfterShipping;
  return (
    <div className="checkout-wrap min-h-[60vh] bg-papyrus py-8 pb-28 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16 lg:pb-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-8">
        <PageBreadcrumb className="mb-4" items={checkoutBreadcrumbItems} />

        <Link
          to="/cart"
          className="font-body mb-6 inline-flex min-h-12 items-center text-sm text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          {copy.checkout.backToCart}
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-warm-charcoal" aria-label="Checkout trust signals">
          {CHECKOUT_SCHEMA.trustStripItemsStatic.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-deep-teal" aria-hidden />
              <span>{item}</span>
            </span>
          ))}
          {checkoutPaymentTrustLine ? (
            <span key="payment-options-live" className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-deep-teal" aria-hidden />
              <span>{checkoutPaymentTrustLine}</span>
            </span>
          ) : null}
        </div>

        {/* 3-step progress indicator */}
        <nav aria-label="Checkout progress" className="mb-8">
          <ol className="flex items-center gap-0">
            {[
              { label: isArabic ? 'التواصل' : 'Contact', done: Boolean(phone.trim() && fullName.trim()) },
              { label: isArabic ? 'العنوان' : 'Address', done: Boolean(line1.trim() && city.trim()) },
              { label: isArabic ? 'الدفع' : 'Payment', done: false },
            ].map((step, i, arr) => (
              <li key={step.label} className="flex items-center">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${step.done ? 'bg-deep-teal text-white' : 'border border-stone bg-white text-warm-charcoal'}`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <span className={`mx-2 text-sm font-medium ${step.done ? 'text-obsidian' : 'text-warm-charcoal'}`}>{step.label}</span>
                {i < arr.length - 1 ? (
                  <span className="mx-1 h-px w-6 bg-stone sm:w-10" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        </nav>

        <form onSubmit={(event) => void handleSubmitCheckout(event)}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-headline text-2xl font-semibold text-obsidian">{copy.checkout.breadcrumbTitle}</h1>
              <p className="mt-3 text-[0.9375rem] font-semibold text-obsidian">{copy.checkout.guestCheckout}</p>
              {!isArabic ? (
                <BilingualServiceBlock
                  className="mt-4 max-w-xl"
                  locale="en"
                  arabic={copy.checkout.secureDataArabic}
                  english={copy.checkout.secureData}
                />
              ) : (
                <p className="mt-4 max-w-xl text-sm text-warm-charcoal">{copy.checkout.secureData}</p>
              )}

              <div className="mt-6 lg:hidden">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-stone/35 bg-white px-4 py-3 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  aria-expanded={mobileSummaryOpen}
                  onClick={() => setMobileSummaryOpen((open) => !open)}
                >
                  <div>
                    <p className="font-headline text-base font-semibold text-obsidian">{copy.checkout.orderSummaryHeading}</p>
                    <p className="mt-1 text-sm text-clay">
                      {mobileLineCountLabel} · {formatEgp(orderTotal)}
                    </p>
                  </div>
                  <span className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-deep-teal">
                    {mobileSummaryOpen ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'عرض' : 'View')}
                  </span>
                </button>
                {mobileSummaryOpen ? (
                  <div className="mt-3">
                    <OrderSummary
                      cart={checkoutCart}
                      shipping={shippingCost}
                      cartId={cartId}
                      className="rounded-2xl border border-stone/35 bg-white p-4 shadow-sm"
                      onAfterLineChange={async (cartHint) => {
                        if (!cartId) return;
                        await refreshCartState(cartId, cartHint);
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white p-5 shadow-sm">
                <h2 className="font-headline text-lg font-semibold text-obsidian">{copy.checkout.headingContact}</h2>

                <label htmlFor="phone" className={labelClass}>
                  {isArabic ? 'الهاتف (واتساب) *' : 'Phone (WhatsApp) *'}
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setErrors((prev) => omitFieldError(prev, 'phone'));
                  }}
                  onBlur={() => validateFieldOnBlur('phone')}
                  className={`${inputBaseClass} ${errors.phone ? inputErrorClass : ''}`}
                />
                {errors.phone ? <p className={errTextClass}>{errors.phone}</p> : null}

                <label htmlFor="email" className={labelClass}>
                  {isArabic ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((prev) => omitFieldError(prev, 'email'));
                  }}
                  onBlur={() => validateFieldOnBlur('email')}
                  className={`${inputBaseClass} ${errors.email ? inputErrorClass : ''}`}
                />
                {errors.email ? <p className={errTextClass}>{errors.email}</p> : null}

                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-obsidian">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(event) => setWhatsappOptIn(event.target.checked)}
                    className="h-[18px] w-[18px] accent-deep-teal"
                  />
                  {copy.checkout.whatsappOptIn}
                </label>
              </section>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white p-5 shadow-sm">
                <h2 className="font-headline text-lg font-semibold text-obsidian">{copy.checkout.headingShippingAddress}</h2>

                <label htmlFor="name" className={labelClass}>
                  {isArabic ? 'الاسم الكامل *' : 'Full name *'}
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setErrors((prev) => omitFieldError(prev, 'name'));
                  }}
                  onBlur={() => validateFieldOnBlur('name')}
                  className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
                />
                {errors.name ? <p className={errTextClass}>{errors.name}</p> : null}

                <label htmlFor="line1" className={labelClass}>
                  {isArabic ? 'العنوان *' : 'Address *'}
                </label>
                <input
                  id="line1"
                  ref={addressInputRef}
                  type="text"
                  autoComplete="address-line1"
                  value={line1}
                  onChange={(event) => {
                    setLine1(event.target.value);
                    setAddressPlaceId(null);
                    setErrors((prev) => omitFieldError(prev, 'line1'));
                  }}
                  onBlur={() => validateFieldOnBlur('line1')}
                  className={`${inputBaseClass} ${errors.line1 ? inputErrorClass : ''}`}
                />
                {errors.line1 ? <p className={errTextClass}>{errors.line1}</p> : null}
                <p className="mt-2 text-xs text-clay">
                  {googleMapsApiKey && placesReady
                    ? isArabic
                      ? 'ابدأ بكتابة العنوان ثم اختر اقتراح Google لتعبئة المدينة تلقائياً.'
                      : 'Start typing your street address and pick a Google suggestion to fill the city automatically.'
                    : isArabic
                      ? 'اكتب عنوان الشارع يدوياً، ثم اختر أو اكتب المحافظة.'
                      : 'Type your street address manually, then type or pick your governorate.'}
                </p>

                <label htmlFor="governorate" className={labelClass}>
                  {isArabic ? 'المحافظة *' : 'Governorate *'}
                </label>
                <select
                  id="governorate"
                  name="governorate"
                  required
                  autoComplete="address-level1"
                  value={governorateSelectValue}
                  onChange={(event) => {
                    const v = event.target.value;
                    setCity(v);
                    setProvince(v);
                    setErrors((prev) => omitFieldError(prev, 'city'));
                  }}
                  onBlur={() => validateFieldOnBlur('city')}
                  className={`${inputBaseClass} min-h-12 appearance-none bg-white ${errors.city ? inputErrorClass : ''}`}
                >
                  <option value="">
                    {isArabic ? 'اختر المحافظة' : 'Select governorate'}
                  </option>
                  {EGYPT_CITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {governorateSelectValue === '' && city.trim() && !EGYPT_GOVERNORATE_LIST.includes(city.trim()) ? (
                  <p className="mt-2 text-xs text-clay">
                    {isArabic
                      ? 'العنوان الحالي لا يطابق قائمة المحافظات. اختر المحافظة من القائمة لإتمام الشحن.'
                      : 'Your saved address is not on the governorate list. Pick a governorate to continue.'}
                  </p>
                ) : null}
                {errors.city ? <p className={errTextClass}>{errors.city}</p> : null}
                {(province || postalCode) ? (
                  <p className="mt-2 text-xs text-clay">
                    {[province ? `${isArabic ? 'المحافظة' : 'Province'}: ${province}` : null, postalCode ? `${isArabic ? 'الرمز البريدي' : 'Postal code'}: ${postalCode}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-obsidian">
                  <input
                    type="checkbox"
                    checked={rememberAddressOnDevice}
                    onChange={(event) => setRememberAddressOnDevice(event.target.checked)}
                    className="h-[18px] w-[18px] accent-deep-teal"
                  />
                  {copy.checkout.rememberAddressOnDevice}
                </label>
                {shippingError ? <p className="mt-4 text-sm text-ember">{shippingError}</p> : null}
              </section>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white p-5 shadow-sm">
                <h2 className="font-headline text-lg font-semibold text-obsidian">{copy.checkout.headingShippingMethod}</h2>
                <div className={`${radioCardClass(true)} mt-4`}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-obsidian" aria-hidden />
                  <span className="font-body text-sm text-obsidian">
                    <strong>{shippingLabel}</strong>
                    <br />
                    {shippingCost > 0
                      ? formatEgp(shippingCost)
                      : isArabic
                        ? 'يتم تثبيت الشحن القياسي تلقائياً بعد حفظ العنوان.'
                        : 'Standard shipping is attached automatically after your address is saved.'}
                  </span>
                </div>
                <p className="mt-4 font-body text-sm text-obsidian">
                  {isArabic
                    ? `${copy.checkout.deliveryLabel} (أيام العمل): ${estimatedDeliveryRange}`
                    : `${copy.checkout.deliveryLabel} (business days): ${estimatedDeliveryRange}`}
                </p>
              </section>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white p-5 shadow-sm">
                <h2 className="font-headline text-lg font-semibold text-obsidian">{copy.checkout.headingPayment}</h2>
                <p className="font-label mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
                  {isArabic ? 'خيارات الدفع الحية' : 'Live payment options'}
                </p>

                {paymentVerifying ? (
                  <div className="mt-4 flex gap-3 rounded-xl border border-stone bg-white p-4" role="status">
                    <span
                      className="mt-0.5 inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-stone border-t-deep-teal"
                      aria-hidden
                    />
                    <div>
                      <p className="font-medium text-obsidian">{copy.checkout.paymobVerifyingTitle}</p>
                      <p className="mt-1 text-sm text-clay">{copy.checkout.paymobVerifyingBody}</p>
                    </div>
                  </div>
                ) : null}

                {paymobPendingNeedsAction && !paymentVerifying ? (
                  <div className="mt-4 rounded-xl border border-stone bg-papyrus p-4" role="status">
                    <p className="font-medium text-obsidian">{copy.checkout.paymobPendingTitle}</p>
                    <p className="mt-2 text-sm text-clay">{copy.checkout.paymobPendingBody}</p>
                    <button
                      type="button"
                      className="btn btn-primary mt-4 min-h-12 w-full sm:w-auto"
                      onClick={() => void retryPaymobStatusCheck()}
                    >
                      {copy.checkout.paymobRetryCheck}
                    </button>
                  </div>
                ) : null}

                {paymentMethods.map((method, index) => (
                  <label key={method.id} className={`${radioCardClass(selectedPaymentMethodId === method.id)} ${index === 0 ? 'mt-4' : ''} mb-3`}>
                    <input
                      type="radio"
                      name="pay"
                      checked={selectedPaymentMethodId === method.id}
                      onChange={() => setSelectedPaymentMethodId(method.id)}
                    />
                    <span className="font-body text-sm text-obsidian">
                      <strong>{method.label}</strong>
                      <br />
                      {method.description}
                    </span>
                  </label>
                ))}

                {paymentMethods.length === 0 ? (
                  <div className="mt-4 text-sm text-ember">
                    <p>
                      {hasSavedShipping
                        ? isArabic
                          ? 'لا توجد طريقة دفع مفعّلة لهذه المنطقة حالياً.'
                          : 'No payment provider is enabled for this region yet.'
                        : isArabic
                          ? 'أكمل بيانات الشحن أولاً ثم اضغط تأكيد الطلب لتحميل طرق الدفع المتاحة.'
                          : 'Complete the shipping details first, then submit to load the available payment methods.'}
                    </p>
                    <p className="mt-2 text-xs text-clay">
                      {isArabic
                        ? 'إذا بقيت هذه المساحة فارغة بعد حفظ العنوان، فهذه مشكلة إعداد في Medusa وليست مشكلة في السلة.'
                        : 'If this section still stays empty after saving the address, that is a Medusa payment-configuration issue, not a cart issue.'}
                    </p>
                  </div>
                ) : null}

                {paymentRedirectUrl && paymobSelected ? (
                  <p className="mt-2 text-sm text-clay">
                    {isArabic
                      ? 'إذا عدت من Paymob ولم يُنشأ الطلب بعد، اضغط متابعة إلى Paymob مرة أخرى أو جرّب إعادة التحقق.'
                      : 'If you return from Paymob and the order is not created yet, continue to Paymob again or retry verification.'}
                  </p>
                ) : null}

                {paymentError ? <p className="mt-4 text-sm text-ember">{paymentError}</p> : null}
              </section>

              <button
                type="submit"
                className="btn btn-primary mt-8 inline-flex min-h-12 w-full items-center justify-center disabled:pointer-events-none disabled:opacity-60"
                disabled={submitDisabled}
                aria-busy={savingInfo || placingOrder}
              >
                {savingInfo
                  ? isArabic ? 'جارٍ حفظ البيانات…' : 'Saving…'
                  : placingOrder
                    ? copy.checkout.placingOrder
                    : !selectedPaymentMethod && !hasSavedShipping
                      ? isArabic ? 'المتابعة لتحميل الدفع' : 'Continue to payment'
                    : externalPaymentSelected
                      ? isArabic ? 'المتابعة إلى الدفع' : 'Continue to payment'
                      : isArabic ? `أكّد الطلب — ${formatEgp(orderTotal)}` : `Place order — ${formatEgp(orderTotal)}`}
              </button>
            </div>
            <div className="hidden lg:block">
              <OrderSummary
                cart={checkoutCart}
                shipping={shippingCost}
                cartId={cartId}
                onAfterLineChange={async (cartHint) => {
                  if (!cartId) return;
                  await refreshCartState(cartId, cartHint);
                }}
              />
            </div>
          </div>
        </form>

        {/* Sticky mobile checkout CTA */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone/30 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.1)] lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-headline text-lg font-semibold text-obsidian">{formatEgp(orderTotal)}</p>
              <p className="truncate text-xs text-warm-charcoal">{mobileLineCountLabel}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                const form = (e.currentTarget as HTMLElement).closest('.checkout-wrap')?.querySelector('form');
                if (form) form.requestSubmit();
              }}
              className="btn btn-primary inline-flex min-h-12 shrink-0 items-center justify-center px-6 disabled:pointer-events-none disabled:opacity-60"
              disabled={submitDisabled}
              aria-busy={savingInfo || placingOrder}
            >
              {savingInfo
                ? isArabic ? 'حفظ…' : 'Saving…'
                : placingOrder
                  ? isArabic ? 'جارٍ…' : 'Placing…'
                  : !selectedPaymentMethod && !hasSavedShipping
                    ? isArabic ? 'المتابعة' : 'Continue'
                  : externalPaymentSelected
                    ? isArabic ? 'الدفع' : 'Pay now'
                    : isArabic ? 'أكّد الطلب' : 'Place order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({
  cart,
  shipping,
  cartId,
  onAfterLineChange,
  className,
}: {
  cart: MedusaCart | null;
  shipping: number;
  cartId: string | null;
  onAfterLineChange: (cartHint?: MedusaCart) => Promise<void>;
  className?: string;
}) {
  const { locale, copy } = useUiLocale();
  const isArabic = locale === 'ar';
  const { items, subtotalEgp, giftWrapEgp, setLineQty, removeItem, awaitPendingCartSync } = useCart();
  const [busy, setBusy] = useState(false);
  const lineViews = useMemo(
    () => getCartLineViews(cart ? toCartLines(cart) : items),
    [cart, items],
  );
  const total = typeof cart?.total === 'number'
    ? medusaAmountToEgp(cart.total)
    : subtotalEgp + giftWrapEgp + shipping;

  async function runWithRefresh(mutate: () => void) {
    setBusy(true);
    try {
      mutate();
      if (cartId) {
        const cartHint = await awaitPendingCartSync();
        await onAfterLineChange(cartHint ?? undefined);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleDecrease(line: CartLineView) {
    if (line.qty <= 1 || busy) return;
    void runWithRefresh(() => setLineQty(line.productSlug, line.size, line.qty - 1));
  }

  function handleIncrease(line: CartLineView) {
    if (busy) return;
    void runWithRefresh(() => setLineQty(line.productSlug, line.size, line.qty + 1));
  }

  function handleRemove(line: CartLineView) {
    if (busy) return;
    void runWithRefresh(() => removeItem(line.productSlug, line.size));
  }

  return (
    <aside className={className ?? "h-fit rounded-xl border border-stone bg-papyrus/90 p-5 shadow-sm lg:sticky lg:top-28"}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-base font-semibold text-obsidian">{copy.checkout.orderSummaryHeading}</h2>
        <Link
          to="/cart"
          className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
        >
          {isArabic ? 'تعديل' : 'Edit'}
        </Link>
      </div>
      {lineViews.map((line) => (
        <div key={line.key} className="mb-4 border-b border-stone/60 pb-4 last:mb-0 last:border-b-0 last:pb-0">
          <div className="flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone">
              <TeeImage src={line.imageSrc} alt={line.imageAlt} w={128} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-obsidian">{line.productName}</p>
              <p className="mt-1 text-sm text-clay">
                {isArabic ? `المقاس ${line.size}` : `Size ${line.size}`}
                {` · ${formatEgp(line.linePriceEgp)}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-label text-[10px] font-medium uppercase tracking-[0.14em] text-clay">
                  {CART_SCHEMA.copy.quantityLabel}
                </span>
                <div className="cart-stepper" role="group" aria-label={`${CART_SCHEMA.copy.quantityLabel} · ${line.productName}`}>
                  <button
                    type="button"
                    className="cart-stepper-button"
                    aria-label={isArabic ? 'تقليل الكمية' : 'Decrease quantity'}
                    disabled={busy || line.qty <= 1}
                    onClick={() => handleDecrease(line)}
                  >
                    −
                  </button>
                  <span className="cart-stepper-value" aria-live="polite" aria-atomic="true">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    className="cart-stepper-button"
                    aria-label={isArabic ? 'زيادة الكمية' : 'Increase quantity'}
                    disabled={busy || line.qty >= 99}
                    onClick={() => handleIncrease(line)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <Link
                  to="/cart"
                  className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-deep-teal underline-offset-2 hover:underline"
                >
                  {copy.checkout.changeSizeInBag}
                </Link>
                <button
                  type="button"
                  className="font-label inline-flex min-h-11 items-center text-[10px] font-medium uppercase tracking-[0.16em] text-ember hover:underline disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  disabled={busy}
                  onClick={() => handleRemove(line)}
                >
                  {CART_SCHEMA.copy.removeLabel}
                </button>
              </div>
            </div>
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
        <span>{shipping > 0 ? formatEgp(shipping) : '—'}</span>
      </p>
      <p className="mt-4 flex justify-between border-t border-stone pt-4 font-semibold text-obsidian">
        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
        <span>{formatEgp(total)}</span>
      </p>
    </aside>
  );
}
