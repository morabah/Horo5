import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { trackBeginCheckout, trackPurchase } from '../analytics/events';
import type { CartLine } from '../cart/types';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { TeeImage } from '../components/TeeImage';
import { useCart } from '../cart/CartContext';
import { loadSavedShipping, saveSavedShipping } from '../cart/savedShipping';
import { saveLastOrder, type LastOrderSnapshot } from '../cart/lastOrder';
import { setPlacedOrderMedusaIdHint } from '../cart/placedOrderHint';
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
  getCartGiftWrapEgp,
  getOrderGiftWrapEgp,
  toCartLines,
  toOrderLines,
} from '../lib/medusa/adapters';
import {
  merchandiseSubtotalFromCartLines,
  resolveCheckoutShippingEgpWithDisplayFallback,
} from '../lib/medusa/cart-money';
import { medusaAmountToEgp } from '../lib/medusa/egp-amount';
import { resolveOrderSnapshotSubtotalEgp } from '../lib/medusa/order-display';
import {
  checkoutPaymentProviderSortKey,
  checkoutProvidersIncludeCod,
  isOfflineCheckoutPaymentKind,
  resolveCheckoutPaymentMethodKind,
  type CheckoutPaymentMethodKind,
  type StorefrontPaymentChoice,
} from '../lib/checkout-payment';
import type {
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
import { addCheckoutCartLinesInParallelBatches } from '../lib/checkout-cart-rebuild';
import { getInstapayPublicPayoutLines } from '../lib/instapay-public';
import { pollPaymobCheckoutStatus } from '../lib/paymob-checkout-status';

const CHECKOUT_FIELD_ORDER = ['phone', 'name', 'line1', 'city', 'email'] as const;

type FieldErrors = Record<string, string>;
type PaymentChoice = StorefrontPaymentChoice;

function omitFieldError(errors: FieldErrors, key: keyof FieldErrors): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}
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

    if (kind === 'instapay') {
      return {
        id: provider.id,
        kind,
        label: isArabic ? 'تحويل بنكي (إنستاباي)' : 'Bank transfer (Instapay)',
        description: isArabic
          ? 'بعد تأكيد الطلب ستظهر لك تعليمات التحويل ورقم الطلب للاستخدام في الملاحظات.'
          : "You'll see transfer instructions after placing the order — pay via your bank app using the reference shown.",
      };
    }

    if (kind === 'cod') {
      return {
        id: provider.id,
        kind,
        label: isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery (COD)',
        description: isArabic
          ? 'ادفع عند الاستلام — لا تحتاج تحويل بنكي. استبدال مجاني خلال 14 يوماً.'
          : 'Pay when it arrives — no bank transfer needed. Free 14-day exchange.',
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

function appendCodRecoveryHint(message: string, providers: MedusaPaymentProvider[], hint: string) {
  if (!checkoutProvidersIncludeCod(providers)) return message;
  return `${message}\n\n${hint}`;
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
  const subtotal = resolveOrderSnapshotSubtotalEgp(order);
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
  const paymentLabel =
    paymentMethod === 'card'
      ? isArabic ? 'بطاقة' : 'Card'
      : paymentMethod === 'instapay'
        ? isArabic ? 'تحويل بنكي (إنستاباي)' : 'Bank transfer (Instapay)'
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
  const paymentProvidersRef = useRef<MedusaPaymentProvider[]>([]);
  paymentProvidersRef.current = paymentProviders;
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
  const governorateSelectRef = useRef<HTMLSelectElement | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const [addressPlaceId, setAddressPlaceId] = useState<string | null>(null);
  const [rememberAddressOnDevice, setRememberAddressOnDevice] = useState(true);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [paymentStepComplete, setPaymentStepComplete] = useState(false);
  const [paymobLongWait, setPaymobLongWait] = useState(false);
  const [instapayPayoutOpen, setInstapayPayoutOpen] = useState(true);

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
    setLine2(cart.shipping_address?.address_2 || saved?.line2 || '');
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
    let activeCart: MedusaCart;
    let addedLineCount: number;
    try {
      const rebuilt = await addCheckoutCartLinesInParallelBatches(
        created.cart.id,
        items,
        resolveCartLineVariantId,
        addLineItem,
      );
      activeCart = rebuilt.cart;
      addedLineCount = rebuilt.addedLineCount;
    } catch {
      throw new Error(
        isArabic
          ? 'تعذر ربط عناصر السلة بمتغيرات Medusa الحالية.'
          : 'The current bag items could not be matched to live Medusa variants.',
      );
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

  const { shippingCost, shippingUsedDisplayFallback } = useMemo(() => {
    const r = resolveCheckoutShippingEgpWithDisplayFallback(checkoutCart ?? undefined, shippingOption);
    return { shippingCost: r.egp, shippingUsedDisplayFallback: r.usedDisplayFallback };
  }, [checkoutCart, shippingOption]);

  const merchandiseSubtotalEgp = useMemo(
    () => merchandiseSubtotalFromCartLines(checkoutCart ? toCartLines(checkoutCart) : items),
    [checkoutCart, items],
  );
  const giftWrapLineEgp = checkoutCart ? getCartGiftWrapEgp(checkoutCart) : giftWrapEgp;
  const orderTotal = useMemo(() => {
    return merchandiseSubtotalEgp + giftWrapLineEgp + shippingCost;
  }, [giftWrapLineEgp, merchandiseSubtotalEgp, shippingCost]);

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
          setPaymentStepComplete(true);
          setStoredCartId(null);
          clearCart();
          setCartId(null);
          setCheckoutCart(null);
          setPlacedOrderMedusaIdHint(status.order_id);
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
            paymobStatus = await pollPaymobCheckoutStatus(activeCartId, paymobStatus, {
              getCheckoutStatus: (id) => getCheckoutStatus(id).catch(() => null),
              sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
            });
          }

          if (cancelled) return;

          if (paymobStatus?.status === 'completed' && paymobStatus.order_id) {
            setPaymentStepComplete(true);
            setStoredCartId(null);
            clearCart();
            setCartId(null);
            setCheckoutCart(null);
            setPlacedOrderMedusaIdHint(paymobStatus.order_id);
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
    const hasInstapay = paymentMethods.some((m) => m.kind === 'instapay');
    const hasOnline = paymentMethods.some((m) => m.kind === 'card' || m.kind === 'wallet');
    if (hasCod && hasInstapay && hasOnline) {
      return isArabic
        ? 'الدفع عند الاستلام وإنستاباي وبطاقة / محفظة متاحة'
        : 'COD, Instapay (bank transfer), and card / wallet available';
    }
    if (hasCod && hasInstapay) {
      return isArabic ? 'الدفع عند الاستلام وإنستاباي متاحان' : 'COD and Instapay (bank · phone · wallet) available';
    }
    if (hasCod && hasOnline) {
      return isArabic
        ? 'الدفع عند الاستلام وخيارات بطاقة / محفظة متاحة'
        : 'COD plus card / wallet options available';
    }
    if (hasInstapay && hasOnline) {
      return isArabic
        ? 'إنستاباي وبطاقة / محفظة متاحة'
        : 'Instapay and card / wallet options available';
    }
    if (hasCod) return isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery (COD)';
    if (hasInstapay) return isArabic ? 'إنستاباي (تحويل بنكي)' : 'Instapay (bank transfer)';
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

  const instapayPayoutLines = useMemo(() => getInstapayPublicPayoutLines(), []);
  const codMethodForFallback = useMemo(
    () => paymentMethods.find((method) => method.kind === 'cod') ?? null,
    [paymentMethods],
  );

  useEffect(() => {
    if (selectedPaymentMethodId && paymentMethods.some((method) => method.id === selectedPaymentMethodId)) {
      return;
    }
    setSelectedPaymentMethodId(getDefaultCheckoutPaymentMethod(paymentMethods)?.id || null);
  }, [paymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    setPaymentStepComplete(false);
  }, [cartId]);

  useEffect(() => {
    if (!paymentVerifying) {
      setPaymobLongWait(false);
      return;
    }
    const timer = window.setTimeout(() => setPaymobLongWait(true), 3000);
    return () => window.clearTimeout(timer);
  }, [paymentVerifying]);

  useEffect(() => {
    const regionId = checkoutCart?.region_id;
    if (!regionId || !mounted) return;
    let cancelled = false;
    const cached = getFreshPaymentProviders(regionId, CHECKOUT_AUX_CACHE_MAX_AGE_MS);
    if (cached?.length) {
      setPaymentProviders((prev) => (prev.length > 0 ? prev : cached));
    }
    void listPaymentProviders(regionId)
      .then((response) => normalizePaymentProviders(response.payment_providers))
      .then((live) => {
        if (cancelled) return;
        setPaymentProviders(live);
        if (live.length > 0) {
          setPaymentProvidersCache(regionId, live);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [checkoutCart?.region_id, mounted]);

  const prefetchPaymentProvidersOnBlur = useCallback(() => {
    const regionId = checkoutCart?.region_id;
    if (!regionId) return;
    void listPaymentProviders(regionId)
      .then((response) => normalizePaymentProviders(response.payment_providers))
      .then((live) => {
        setPaymentProviders(live);
        if (live.length > 0) {
          setPaymentProvidersCache(regionId, live);
        }
      })
      .catch(() => {});
  }, [checkoutCart?.region_id]);

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
          address_2: line2.trim() || undefined,
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
        setPlacedOrderMedusaIdHint(completion.order.id);
        if (rememberAddressOnDevice) {
          saveSavedShipping({
            email: email.trim(),
            phone: phone.trim(),
            fullName: fullName.trim(),
            line1: line1.trim(),
            line2: line2.trim(),
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
        setPaymentStepComplete(true);
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
        setPaymentError(
          appendCodRecoveryHint(
            isArabic
              ? 'تعذر تأكيد الدفع. جرّب مرة أخرى أو اختر الدفع عند الاستلام.'
              : 'Payment could not be confirmed. Try again or switch to cash on delivery.',
            paymentProvidersRef.current,
            copy.checkout.paymentErrorCodRecoveryHint,
          ),
        );
      } else {
        const base =
          choice === 'card'
            ? isArabic
              ? 'دفع البطاقة ما زال يحتاج خطوة إضافية في Paymob قبل إنشاء الطلب.'
              : 'Card payment still needs one more Paymob step before the order can be created.'
            : isArabic
              ? 'تعذر إكمال السلة الآن. جرّب مرة أخرى بعد لحظات.'
              : 'The cart could not be completed yet. Try again in a moment.';
        setPaymentError(appendCodRecoveryHint(base, paymentProvidersRef.current, copy.checkout.paymentErrorCodRecoveryHint));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('409')) {
        const st = await getCheckoutStatus(activeCartId).catch(() => null);
        if (st?.status === 'completed' && st.order_id) {
          completionIdempotencyKeyRef.current = null;
          setPaymentStepComplete(true);
          setStoredCartId(null);
          clearCart();
          setCartId(null);
          setCheckoutCart(null);
          setPlacedOrderMedusaIdHint(st.order_id);
          navigate(`/checkout/success?order_id=${st.order_id}`);
          return;
        }
      }
      setPaymentError(
        appendCodRecoveryHint(
          getReadableCheckoutError(error, isArabic, {
            ar: 'حدث خطأ أثناء إكمال الطلب.',
            en: 'An error occurred while completing the order.',
          }),
          paymentProvidersRef.current,
          copy.checkout.paymentErrorCodRecoveryHint,
        ),
      );
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
      const resolved = await pollPaymobCheckoutStatus(cartId, initial, {
        getCheckoutStatus: (id) => getCheckoutStatus(id).catch(() => null),
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      });

      if (resolved?.status === 'completed' && resolved.order_id) {
        setPaymentStepComplete(true);
        setStoredCartId(null);
        clearCart();
        setCartId(null);
        setCheckoutCart(null);
        setPlacedOrderMedusaIdHint(resolved.order_id);
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
          address_2: line2.trim() || undefined,
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
          address_2: line2.trim() || undefined,
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
    if (savingInfo || placingOrder || preparingPayment) {
      return;
    }
    const fieldErrors = validateCheckoutFields({ email, phone, name: fullName, line1, city }, isArabic);
    const governorateOk = !city.trim() || EGYPT_GOVERNORATE_LIST.includes(city.trim());
    const mergedErrors: FieldErrors = governorateOk
      ? fieldErrors
      : {
          ...fieldErrors,
          city: copy.checkout.governorateMustMatchList,
        };
    setErrors(mergedErrors);
    setCheckoutError(null);
    setShippingError(null);
    setPaymentError(null);

    if (Object.keys(mergedErrors).length > 0) {
      if (!governorateOk) {
        requestAnimationFrame(() => governorateSelectRef.current?.focus());
      } else {
        const firstInvalidField = CHECKOUT_FIELD_ORDER.find((field) => mergedErrors[field]);
        if (firstInvalidField) {
          requestAnimationFrame(() => {
            document.getElementById(firstInvalidField)?.focus();
          });
        }
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
          ? 'لم تُحمّل طرق الدفع بعد. انتظر لحظة ثم أعد المحاولة، أو تأكد من تفعيل مزود دفع لمنطقة السلة في Medusa.'
          : 'Payment methods are not loaded yet. Wait a moment and try again, or confirm Medusa has an enabled payment provider for this cart region.',
      );
      return;
    }

    setPreparingPayment(true);
    try {
      if (!isOfflineCheckoutPaymentKind(paymentMethodToUse.kind)) {
        const { session } = await preparePaymentSession(paymentMethodToUse, activeCheckoutCart, activeCartId);
        const redirectUrl = getPaymentSessionRedirectUrl(session || null);
        if (!redirectUrl) {
          throw new Error(
            isArabic
              ? 'لم يرسل مزود الدفع رابط المتابعة بعد.'
              : 'The selected payment provider did not return a redirect URL yet.',
          );
        }
        setPaymentStepComplete(true);
        window.location.assign(redirectUrl);
        return;
      }

      await preparePaymentSession(paymentMethodToUse, activeCheckoutCart, activeCartId);
      const offlineChoice: PaymentChoice =
        paymentMethodToUse.kind === 'instapay' ? 'instapay' : 'cod';
      await handleCartCompletion(activeCartId, offlineChoice);
    } catch (error) {
      setPaymentError(getReadableCheckoutError(error, isArabic, {
        ar: 'تعذر بدء الدفع.',
        en: 'Unable to start the payment step.',
      }));
    } finally {
      setPreparingPayment(false);
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
    const showBagSummaryWhileLoading = loadingCheckout && !paymentVerifying && items.length > 0;
    return (
      <div className="min-h-[60vh] bg-papyrus py-8 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:py-10 md:pb-16">
        <div className={`container mx-auto px-4 md:px-8 ${showBagSummaryWhileLoading ? 'max-w-5xl' : 'max-w-3xl'}`}>
          <PageBreadcrumb className="mb-6" items={checkoutBreadcrumbItems} />
          {showBagSummaryWhileLoading ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
              <div className="rounded-xl border border-stone bg-white p-6 text-sm text-clay">
                <p className="font-medium text-obsidian">
                  {isArabic ? 'جارٍ تجهيز السلة للدفع…' : 'Preparing your bag for checkout…'}
                </p>
                <p className="mt-2 text-sm text-warm-charcoal">
                  {isArabic
                    ? 'نعيد مزامنة عناصرك مع الخادم. يمكنك مراجعة الملخص بجانب هذه الرسالة.'
                    : 'We are syncing your items with the server. Your order summary stays visible on the right.'}
                </p>
                <div className="mt-6 space-y-3" aria-hidden>
                  <div className="h-10 animate-pulse rounded-lg bg-stone/50" />
                  <div className="h-10 animate-pulse rounded-lg bg-stone/40" />
                  <div className="h-24 animate-pulse rounded-lg bg-stone/35" />
                </div>
              </div>
              <OrderSummary
                cart={null}
                cartId={null}
                shipping={0}
                shippingPending
                className="rounded-xl border border-stone bg-papyrus/90 p-5 shadow-sm lg:sticky lg:top-28"
                onAfterLineChange={async () => {}}
              />
            </div>
          ) : (
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
                    {paymobLongWait ? (
                      <p className="mt-3 text-sm font-medium text-obsidian">{copy.checkout.paymobStillConfirmingTitle}</p>
                    ) : null}
                    {paymobLongWait ? (
                      <p className="mt-1 text-sm text-clay">{copy.checkout.paymobStillConfirmingBody}</p>
                    ) : null}
                  </div>
                </div>
              ) : isArabic ? (
                'جارٍ تحميل بيانات الدفع…'
              ) : (
                'Loading checkout…'
              )}
            </div>
          )}
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
  const shippingSummaryPending = Boolean(
    cartId &&
      checkoutCart &&
      !checkoutCart.shipping_methods?.length &&
      shippingCost === 0 &&
      !shippingUsedDisplayFallback,
  );
  const submitDisabled =
    savingInfo || placingOrder || preparingPayment || paymentVerifying || noPaymentProvidersAfterShipping;
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
              { label: isArabic ? 'الدفع' : 'Payment', done: paymentStepComplete },
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

        <form id="checkout-main-form" onSubmit={(event) => void handleSubmitCheckout(event)}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-headline text-2xl font-semibold text-obsidian">{copy.checkout.breadcrumbTitle}</h1>
              <p className="mt-3 text-[0.9375rem] font-semibold text-obsidian">{copy.checkout.guestCheckout}</p>
              <p className="mt-4 max-w-xl text-sm text-warm-charcoal">{copy.checkout.secureData}</p>

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
                      shippingPending={shippingSummaryPending}
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
                  onBlur={() => {
                    validateFieldOnBlur('phone');
                    prefetchPaymentProvidersOnBlur();
                  }}
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
                  onBlur={() => {
                    validateFieldOnBlur('email');
                    prefetchPaymentProvidersOnBlur();
                  }}
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
                <p className="mt-2 text-xs text-clay">{copy.checkout.whatsappOptInHint}</p>
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
                  onBlur={() => {
                    validateFieldOnBlur('name');
                    prefetchPaymentProvidersOnBlur();
                  }}
                  className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
                />
                {errors.name ? <p className={errTextClass}>{errors.name}</p> : null}

                <label htmlFor="line1" className={labelClass}>
                  {isArabic ? 'الشارع والعمارة *' : 'Street & building *'}
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
                  onBlur={() => {
                    validateFieldOnBlur('line1');
                    prefetchPaymentProvidersOnBlur();
                  }}
                  className={`${inputBaseClass} ${errors.line1 ? inputErrorClass : ''}`}
                />
                {errors.line1 ? <p className={errTextClass}>{errors.line1}</p> : null}
                <p className="mt-2 text-xs text-clay">
                  {googleMapsApiKey && placesReady
                    ? isArabic
                      ? 'ابدأ بكتابة اسم الشارع ورقم العمارة، ثم اختر اقتراح Google لتعبئة المدينة تلقائياً.'
                      : 'Start typing street name and building number — pick a Google suggestion to autofill the city.'
                    : isArabic
                      ? 'اكتب اسم الشارع ورقم العمارة، ثم اختر المحافظة بالأسفل.'
                      : 'Street name and building number. Pick your governorate below.'}
                </p>

                <label htmlFor="line2" className={labelClass}>
                  {isArabic ? 'الحي أو علامة مميزة (اختياري)' : 'District or landmark (optional)'}
                </label>
                <input
                  id="line2"
                  type="text"
                  autoComplete="address-line2"
                  value={line2}
                  onChange={(event) => setLine2(event.target.value)}
                  className={inputBaseClass}
                  placeholder={isArabic ? 'مثلاً: مدينة نصر — بجوار المول' : 'e.g. Nasr City — near the mall'}
                />
                <p className="mt-2 text-xs text-clay">
                  {isArabic
                    ? 'يساعد المندوب في الوصول أسرع — لن نشاركه مع أي طرف آخر.'
                    : 'Helps the courier find you faster — not shared with anyone else.'}
                </p>

                <label htmlFor="governorate" className={labelClass}>
                  {isArabic ? 'المحافظة *' : 'Governorate *'}
                </label>
                <select
                  id="governorate"
                  ref={governorateSelectRef}
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
                <label className="mt-4 hidden cursor-pointer items-center gap-2 text-sm text-obsidian sm:flex">
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
                    {shippingCost > 0 ? (
                      <>
                        {formatEgp(shippingCost)}
                        {shippingUsedDisplayFallback ? (
                          <span className="mt-2 block text-xs font-normal text-clay">
                            {copy.checkout.shippingDisplayFallbackNote}
                          </span>
                        ) : null}
                      </>
                    ) : isArabic ? (
                      'يتم تثبيت الشحن القياسي تلقائياً بعد حفظ العنوان.'
                    ) : (
                      'Standard shipping is attached automatically after your address is saved.'
                    )}
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
                      {paymobLongWait ? (
                        <p className="mt-3 text-sm font-medium text-obsidian">{copy.checkout.paymobStillConfirmingTitle}</p>
                      ) : null}
                      {paymobLongWait ? (
                        <p className="mt-1 text-sm text-clay">{copy.checkout.paymobStillConfirmingBody}</p>
                      ) : null}
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
                  <label
                    key={method.id}
                    className={`${radioCardClass(selectedPaymentMethodId === method.id)} ${index === 0 ? 'mt-4' : ''} mb-3`}
                  >
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
                        : copy.checkout.paymentOptionsLoadingNote}
                    </p>
                    <p className="mt-2 text-xs text-clay">
                      {isArabic
                        ? 'إذا بقيت هذه المساحة فارغة بعد حفظ العنوان، فهذه مشكلة إعداد في Medusa وليست مشكلة في السلة.'
                        : 'If this section still stays empty after saving the address, that is a Medusa payment-configuration issue, not a cart issue.'}
                    </p>
                  </div>
                ) : null}

                {selectedPaymentMethod?.kind === 'instapay' && instapayPayoutLines.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-stone bg-papyrus/60 p-4">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left font-medium text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      aria-expanded={instapayPayoutOpen}
                      onClick={() => setInstapayPayoutOpen((open) => !open)}
                    >
                      <span>{copy.checkout.instapayPayoutInlineHeading}</span>
                      <span className="text-xs font-semibold text-deep-teal">
                        {instapayPayoutOpen ? copy.checkout.instapayPayoutDetailsToggleHide : copy.checkout.instapayPayoutDetailsToggleShow}
                      </span>
                    </button>
                    {instapayPayoutOpen ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-obsidian">
                        {instapayPayoutLines.map((line, idx) => (
                          <li key={`${line.en}-${idx}`}>{isArabic ? line.ar : line.en}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {paymentRedirectUrl && paymobSelected ? (
                  <p className="mt-2 text-sm text-clay">
                    {isArabic
                      ? 'إذا عدت من Paymob ولم يُنشأ الطلب بعد، اضغط متابعة إلى Paymob مرة أخرى أو جرّب إعادة التحقق.'
                      : 'If you return from Paymob and the order is not created yet, continue to Paymob again or retry verification.'}
                  </p>
                ) : null}

                {paymentError ? (
                  <div className="mt-4 space-y-3">
                    <p className="whitespace-pre-line text-sm text-ember">{paymentError}</p>
                    {codMethodForFallback && selectedPaymentMethodId !== codMethodForFallback.id ? (
                      <button
                        type="button"
                        className="btn btn-ghost min-h-12 w-full border border-stone sm:w-auto"
                        onClick={() => {
                          setPaymentError(null);
                          setSelectedPaymentMethodId(codMethodForFallback.id);
                        }}
                      >
                        {copy.checkout.useCodInstead}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <button
                type="submit"
                className="btn btn-primary mt-8 inline-flex min-h-12 w-full items-center justify-center disabled:pointer-events-none disabled:opacity-60"
                disabled={submitDisabled}
                aria-busy={savingInfo || placingOrder || preparingPayment}
              >
                {savingInfo
                  ? isArabic ? 'جارٍ حفظ البيانات…' : 'Saving…'
                  : preparingPayment
                    ? copy.checkout.preparingPaymentRedirect
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
                shippingPending={shippingSummaryPending}
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
              onClick={() => {
                const el = document.getElementById('checkout-main-form');
                if (el instanceof HTMLFormElement) el.requestSubmit();
              }}
              className="btn btn-primary inline-flex min-h-12 shrink-0 items-center justify-center px-6 disabled:pointer-events-none disabled:opacity-60"
              disabled={submitDisabled}
              aria-busy={savingInfo || placingOrder || preparingPayment}
            >
              {savingInfo
                ? isArabic ? 'حفظ…' : 'Saving…'
                : preparingPayment
                  ? isArabic ? 'جاري الربط…' : 'Connecting…'
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
  shippingPending,
  onAfterLineChange,
  className,
}: {
  cart: MedusaCart | null;
  shipping: number;
  cartId: string | null;
  shippingPending?: boolean;
  onAfterLineChange: (cartHint?: MedusaCart) => Promise<void>;
  className?: string;
}) {
  const { locale, copy } = useUiLocale();
  const isArabic = locale === 'ar';
  const { items, giftWrapEgp, setLineQty, removeItem, awaitPendingCartSync } = useCart();
  const [busy, setBusy] = useState(false);
  const lineViews = useMemo(
    () => getCartLineViews(cart ? toCartLines(cart) : items),
    [cart, items],
  );
  /** Must match the sum of rows above (Medusa prices), not catalog-only `subtotalEgp`. */
  const merchandiseSubtotalEgp = useMemo(
    () => merchandiseSubtotalFromCartLines(cart ? toCartLines(cart) : items),
    [cart, items],
  );
  const giftWrapLineEgp = cart ? getCartGiftWrapEgp(cart) : giftWrapEgp;
  const total = merchandiseSubtotalEgp + giftWrapLineEgp + shipping;

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
    void runWithRefresh(() => setLineQty(line.productSlug, line.size, line.qty - 1, line.variantId));
  }

  function handleIncrease(line: CartLineView) {
    if (busy || line.qty >= 99) return;
    void runWithRefresh(() => setLineQty(line.productSlug, line.size, line.qty + 1, line.variantId));
  }

  function handleRemove(line: CartLineView) {
    if (busy) return;
    void runWithRefresh(() => removeItem(line.productSlug, line.size, line.variantId));
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
        <span>{formatEgp(merchandiseSubtotalEgp)}</span>
      </p>
      {giftWrapLineEgp > 0 ? (
        <p className="mt-2 flex justify-between text-sm text-clay">
          <span>{CART_SCHEMA.copy.giftWrapLabel}</span>
          <span>{formatEgp(giftWrapLineEgp)}</span>
        </p>
      ) : null}
      <p className="mt-2 flex justify-between text-sm text-clay">
        <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
        <span className="text-right">
          {shippingPending ? (
            <span
              className="inline-block h-4 w-16 animate-pulse rounded bg-stone/70 align-middle"
              aria-label={isArabic ? 'جاري تحميل الشحن' : 'Loading shipping'}
            />
          ) : shipping > 0 ? (
            formatEgp(shipping)
          ) : (
            '—'
          )}
        </span>
      </p>
      <p className="mt-4 flex justify-between border-t border-stone pt-4 font-semibold text-obsidian">
        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
        <span>{formatEgp(total)}</span>
      </p>
    </aside>
  );
}
