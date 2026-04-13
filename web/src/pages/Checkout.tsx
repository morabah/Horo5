import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { trackBeginCheckout, trackPurchase } from '../analytics/events';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { TeeImage } from '../components/TeeImage';
import { useCart } from '../cart/CartContext';
import { saveLastOrder, type LastOrderSnapshot } from '../cart/lastOrder';
import { getCartLineViews, type CartLineView } from '../cart/view';
import { MEDUSA_CART_ID_STORAGE_KEY } from '../cart/types';
import { CART_SCHEMA, CHECKOUT_SCHEMA, EGYPT_CITY_OPTIONS } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import {
  addShippingMethod,
  completeCart,
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
  getOrderGiftWrapEgp,
  toCartLines,
  toOrderLines,
} from '../lib/medusa/adapters';
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

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
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

function normalizePaymentProviders(providers: MedusaPaymentProvider[]) {
  return providers.filter((provider) => provider.id === 'pp_system_default' || provider.id.includes('paymob'));
}

function resolveCheckoutPaymentMethodKind(providerId: string): CheckoutPaymentMethodKind {
  const normalized = providerId.toLowerCase();
  if (!normalized.includes('paymob')) return 'cod';
  if (normalized.includes('apple') || normalized.includes('google')) return 'wallet';
  return 'card';
}

function buildCheckoutPaymentMethods(
  providers: MedusaPaymentProvider[],
  isArabic: boolean,
): CheckoutPaymentMethod[] {
  return providers.map((provider) => {
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

function getPaymobSessionData(session: MedusaPaymentSession | null): PaymobPublicSessionData | null {
  if (!session || !session.provider_id.includes('paymob')) {
    return null;
  }

  return (session.data || {}) as PaymobPublicSessionData;
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
  const subtotal = Math.round(((order.subtotal ?? 0) || 0) / 100);
  const shipping = Math.round(((order.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0) || 0) / 100);
  const total = Math.round(((order.total ?? 0) || 0) / 100);
  const giftWrapEgp = getOrderGiftWrapEgp(order);
  const paymentLabel = paymentMethod === 'card'
    ? isArabic ? 'بطاقة' : 'Card'
    : isArabic ? 'الدفع عند الاستلام' : 'COD';
  const finalShippingLabel = shippingLabel || order.shipping_methods?.[0]?.name || (isArabic ? 'عادي' : 'Standard');

  return {
    orderId: order.display_id ? `HORO-${order.display_id}` : order.id,
    lines,
    cartId: getStoredCartId() ?? undefined,
    medusaOrderId: order.id,
    subtotal,
    giftWrapEgp: giftWrapEgp > 0 ? giftWrapEgp : undefined,
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
  const { items, subtotalEgp, giftWrapEgp, clearCart, replaceMedusaCartId } = useCart();
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
      return Math.round(checkoutCart.shipping_total / 100);
    }
    if (typeof shippingOption?.amount === 'number') {
      return Math.round(shippingOption.amount / 100);
    }
    return 0;
  }, [checkoutCart?.shipping_total, shippingOption?.amount]);

  const orderTotal = useMemo(() => {
    if (typeof checkoutCart?.total === 'number') {
      return Math.round(checkoutCart.total / 100);
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
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const incomingCartId = params.get('cart_id') || getStoredCartId();
    const isPaymobReturn = params.get('payment_provider') === 'paymob' || params.get('resume') === '1' || params.get('success') === 'true';

    if (!incomingCartId) {
      setLoadingCheckout(false);
      setCartId(null);
      return;
    }

    setStoredCartId(incomingCartId);
    setCartId(incomingCartId);

    const hydrateFromCart = (cart: MedusaCart) => {
      const composedName = [cart.shipping_address?.first_name, cart.shipping_address?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      setCheckoutCart(cart);
      setEmail(cart.email || '');
      setPhone(cart.shipping_address?.phone || '');
      setFullName(composedName);
      setLine1(cart.shipping_address?.address_1 || '');
      setCity(cart.shipping_address?.city || '');
      setProvince(cart.shipping_address?.province || '');
      setPostalCode(cart.shipping_address?.postal_code || '');
      setWhatsappOptIn(cart.metadata?.whatsapp_opt_in === false ? false : true);

      const selectedProviderId = cart.payment_collection?.payment_sessions?.[0]?.provider_id;

      if (selectedProviderId) {
        setSelectedPaymentMethodId(selectedProviderId);
      }
    };

    const loadCheckout = async () => {
      setLoadingCheckout(true);
      setCheckoutError(null);
      setPaymentError(null);
      setPaymobPendingNeedsAction(false);
      setPaymentVerifying(false);

      try {
        const status = await getCheckoutStatus(incomingCartId).catch(() => null);

        if (!cancelled && status?.status === 'completed' && status.order_id) {
          setStoredCartId(null);
          clearCart();
          navigate(`/checkout/success?order_id=${status.order_id}`);
          return;
        }

        const { cart } = await getCart(incomingCartId);
        if (cancelled) return;
        hydrateFromCart(cart);

        const liveShippingOptions = cart.region_id
          ? await listShippingOptions(incomingCartId).then((response) => response.shipping_options).catch(() => [])
          : [];
        if (cancelled) return;

        const selectedShippingMethod = cart.shipping_methods?.[0];
        const resolvedShippingOption =
          liveShippingOptions.find((option) => option.id === selectedShippingMethod?.shipping_option_id) ||
          liveShippingOptions[0] ||
          null;
        setShippingOption(resolvedShippingOption);

        if (cart.region_id) {
          const liveProviders = await listPaymentProviders(cart.region_id)
            .then((response) => normalizePaymentProviders(response.payment_providers))
            .catch(() => []);
          if (cancelled) return;
          setPaymentProviders(liveProviders);
        }

        if (isPaymobReturn) {
          let paymobStatus = status;
          if (paymobStatus?.status === 'pending') {
            setPaymentVerifying(true);
            paymobStatus = await pollPaymobCheckoutStatus(incomingCartId, paymobStatus);
          }

          if (cancelled) return;

          if (paymobStatus?.status === 'completed' && paymobStatus.order_id) {
            setStoredCartId(null);
            clearCart();
            navigate(`/checkout/success?order_id=${paymobStatus.order_id}`);
            return;
          }

          if (paymobStatus?.status === 'authorized') {
            void handleCartCompletion(incomingCartId, 'card');
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
  }, [clearCart, isArabic, mounted, navigate]);

  const paymentMethods = useMemo(
    () => buildCheckoutPaymentMethods(paymentProviders, isArabic),
    [isArabic, paymentProviders],
  );
  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedPaymentMethodId) || null,
    [paymentMethods, selectedPaymentMethodId],
  );
  const selectedPaymentSession = useMemo(
    () => getSelectedPaymentSession(checkoutCart, selectedPaymentMethod?.id),
    [checkoutCart, selectedPaymentMethod?.id],
  );
  const paymobSession = useMemo(
    () => getPaymobSessionData(selectedPaymentSession),
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
          if (parsed.city) setCity(parsed.city);
          setProvince(parsed.province);
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

  async function refreshCartState(activeCartId: string) {
    const { cart } = await getCart(activeCartId);
    setCheckoutCart(cart);
    const selectedShippingMethod = cart.shipping_methods?.[0];
    if (selectedShippingMethod) {
      const liveShippingOptions = await listShippingOptions(activeCartId).then((response) => response.shipping_options).catch(() => []);
      const resolvedOption = liveShippingOptions.find((option) => option.id === selectedShippingMethod.shipping_option_id) || liveShippingOptions[0] || null;
      setShippingOption(resolvedOption);
    }

    if (cart.region_id) {
      const liveProviders = await listPaymentProviders(cart.region_id)
        .then((response) => normalizePaymentProviders(response.payment_providers))
        .catch(() => []);
      setPaymentProviders(liveProviders);
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

    try {
      const completion = await completeCart(activeCartId);

      if (completion.type === 'order' && completion.order) {
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
        trackPurchase({
          transactionId: snapshot.orderId,
          value: snapshot.total,
          currency: 'EGP',
          lines: snapshot.lines,
        });
        setStoredCartId(null);
        clearCart();
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
      setPaymentError(getReadableCheckoutError(error, isArabic, {
        ar: 'حدث خطأ أثناء إكمال الطلب.',
        en: 'An error occurred while completing the order.',
      }));
    } finally {
      setPlacingOrder(false);
      completionLockRef.current = null;
    }
  }

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
    if (!cartId) {
      throw new Error(isArabic ? 'سلة الدفع غير متاحة بعد.' : 'Checkout cart is not available yet.');
    }

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
        const liveProviders = await listPaymentProviders(refreshedCart.region_id)
          .then((response) => normalizePaymentProviders(response.payment_providers))
          .catch(() => []);
        setPaymentProviders(liveProviders);
      }

      return refreshedCart;
    };

    try {
      const persistedCart = await persistWithCartId(cartId);
      return { cart: persistedCart, cartId };
    } catch (error) {
      if (!isStaleMedusaCartCustomerError(error)) {
        throw error;
      }

      const sourceCart = checkoutCart ?? (await getCart(cartId)).cart;
      const recovered = await recreateGuestCartFromCart(sourceCart);
      const recoveredCartId = recovered.cart.id;

      setStoredCartId(recoveredCartId);
      replaceMedusaCartId(recoveredCartId);
      setCartId(recoveredCartId);
      setCheckoutCart(recovered.cart);

      const persistedCart = await persistWithCartId(recoveredCartId);
      return { cart: persistedCart, cartId: recoveredCartId };
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
      await handlePlaceOrder(persisted.cartId, persisted.cart);
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
  ) {
    if (!activeCartId || !activeCheckoutCart || !selectedPaymentMethod) {
      setPaymentError(isArabic ? 'سلة الدفع غير جاهزة.' : 'The checkout cart is not ready.');
      return;
    }

    try {
      if (selectedPaymentMethod.kind !== 'cod') {
        const { session } = await preparePaymentSession(selectedPaymentMethod, activeCheckoutCart, activeCartId);
        const paymobData = getPaymobSessionData(session || null);
        if (!paymobData?.redirect_url) {
          throw new Error(isArabic ? 'لم يرسل Paymob رابط الدفع بعد.' : 'Paymob did not return a redirect URL.');
        }
        window.location.assign(paymobData.redirect_url);
        return;
      }

      await preparePaymentSession(selectedPaymentMethod, activeCheckoutCart, activeCartId);
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
          <div className="rounded-xl border border-stone bg-white/70 p-6 text-sm text-clay">
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
  const submitDisabled = savingInfo || placingOrder || paymentVerifying || !selectedPaymentMethod;
  const paymobSelected = selectedPaymentMethod?.kind === 'card' || selectedPaymentMethod?.kind === 'wallet';
  const mobileLineCountLabel = isArabic
    ? `${checkoutLines.length} ${checkoutLines.length === 1 ? 'قطعة' : 'قطع'}`
    : `${checkoutLines.length} ${checkoutLines.length === 1 ? 'item' : 'items'}`;
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
          {CHECKOUT_SCHEMA.trustStripItems.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-deep-teal" aria-hidden />
              <span>{item}</span>
            </span>
          ))}
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

              <div className="mt-6 lg:hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-stone/35 bg-white/70 px-4 py-3 text-left shadow-sm"
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
                  <div className="mt-3 rounded-2xl border border-stone/35 bg-white/80 p-4 shadow-sm">
                    <div className="space-y-3">
                      {checkoutLines.map((line) => {
                        const lineView = getCartLineViews([line])[0];
                        if (!lineView) return null;
                        return (
                          <div key={lineView.key} className="flex gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone">
                              <TeeImage src={lineView.imageSrc} alt={lineView.imageAlt} w={128} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-obsidian">{lineView.productName}</p>
                              <p className="mt-1 text-sm text-clay">
                                {isArabic
                                  ? `المقاس ${lineView.size} · الكمية ${lineView.qty}`
                                  : `Size ${lineView.size} · Qty ${lineView.qty}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white/60 p-5 shadow-sm">
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
                    setErrors((prev) => {
                      const { phone: _removed, ...rest } = prev;
                      return rest;
                    });
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
                    setErrors((prev) => {
                      const { email: _removed, ...rest } = prev;
                      return rest;
                    });
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

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white/60 p-5 shadow-sm">
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
                    setErrors((prev) => {
                      const { name: _removed, ...rest } = prev;
                      return rest;
                    });
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
                    setErrors((prev) => {
                      const { line1: _removed, ...rest } = prev;
                      return rest;
                    });
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

                <label htmlFor="city" className={labelClass}>
                  {isArabic ? 'المحافظة / المدينة *' : 'Governorate / city *'}
                </label>
                <input
                  id="city"
                  type="text"
                  list="city-options"
                  autoComplete="address-level2"
                  placeholder={isArabic ? 'اكتب أو اختر المحافظة' : 'Type or select governorate'}
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setErrors((prev) => {
                      const { city: _removed, ...rest } = prev;
                      return rest;
                    });
                  }}
                  onBlur={() => validateFieldOnBlur('city')}
                  className={`${inputBaseClass} ${errors.city ? inputErrorClass : ''}`}
                />
                <datalist id="city-options">
                  {EGYPT_CITY_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                {errors.city ? <p className={errTextClass}>{errors.city}</p> : null}
                {(province || postalCode) ? (
                  <p className="mt-2 text-xs text-clay">
                    {[province ? `${isArabic ? 'المحافظة' : 'Province'}: ${province}` : null, postalCode ? `${isArabic ? 'الرمز البريدي' : 'Postal code'}: ${postalCode}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {shippingError ? <p className="mt-4 text-sm text-ember">{shippingError}</p> : null}
              </section>

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white/60 p-5 shadow-sm">
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

              <section className="mt-8 rounded-2xl border border-stone/30 bg-white/60 p-5 shadow-sm">
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
                  <p className="mt-4 text-sm text-ember">
                    {isArabic ? 'لا يوجد مزود دفع مفعّل لهذه المنطقة بعد.' : 'No payment provider is enabled for this region yet.'}
                  </p>
                ) : null}

                {paymobSession?.redirect_url && paymobSelected ? (
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
                    : paymobSelected
                      ? isArabic ? 'المتابعة إلى Paymob' : 'Continue to Paymob'
                      : isArabic ? `أكّد الطلب — ${formatEgp(orderTotal)}` : `Place order — ${formatEgp(orderTotal)}`}
              </button>
            </div>
            <div className="hidden lg:block">
              <OrderSummary
                cart={checkoutCart}
                shipping={shippingCost}
                cartId={cartId}
                onAfterLineChange={async () => {
                  if (!cartId) return;
                  await new Promise((r) => setTimeout(r, 220));
                  await refreshCartState(cartId);
                }}
              />
            </div>
          </div>
        </form>

        {/* Sticky mobile checkout CTA */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone/30 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden">
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
                  : paymobSelected
                    ? isArabic ? 'Paymob' : 'Pay now'
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
}: {
  cart: MedusaCart | null;
  shipping: number;
  cartId: string | null;
  onAfterLineChange: () => Promise<void>;
}) {
  const { locale, copy } = useUiLocale();
  const isArabic = locale === 'ar';
  const { items, subtotalEgp, giftWrapEgp, setLineQty, removeItem } = useCart();
  const [busy, setBusy] = useState(false);
  const lineViews = useMemo(
    () => getCartLineViews(cart ? toCartLines(cart) : items),
    [cart, items],
  );
  const total = typeof cart?.total === 'number'
    ? Math.round(cart.total / 100)
    : subtotalEgp + giftWrapEgp + shipping;

  async function runWithRefresh(mutate: () => void) {
    if (!cartId) return;
    setBusy(true);
    try {
      mutate();
      await onAfterLineChange();
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
    <aside className="h-fit rounded-xl border border-stone bg-papyrus/90 p-5 shadow-sm lg:sticky lg:top-28">
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
                  className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-ember hover:underline disabled:opacity-50"
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
