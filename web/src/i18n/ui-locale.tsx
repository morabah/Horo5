import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type UiLocale = 'en' | 'ar';
export type UiDirection = 'ltr' | 'rtl';

const UI_LOCALE_STORAGE_KEY = 'horo-ui-locale';
const UI_LOCALE_QUERY_KEY = 'uiLocale';

const UI_COPY = {
  en: {
    nav: {
      searchPlaceholder: 'Search designs, vibes, or occasions...',
      searchSubmit: 'Search',
      searchClear: 'Clear search',
      searchOpen: 'Open search',
      searchSuggestions: 'Search suggestions',
      noSuggestions: 'No matching suggestions yet.',
    },
    search: {
      suggestedLabel: 'Suggested',
      browseLabel: 'Browse',
      designsHeading: 'Designs',
      vibesHeading: 'Vibes',
      occasionsHeading: 'Occasions',
      relatedVibesHeading: 'Related vibes',
      relatedOccasionsHeading: 'Related occasions',
      designsCount: 'Design matches',
      vibesCount: 'Vibe matches',
      occasionsCount: 'Occasion matches',
    },
    checkout: {
      secureData: 'Your details are secure with us.',
      secureDataArabic: 'بياناتك آمنة معنا',
      guestCheckout: 'Guest checkout, no account required.',
      whatsappOptIn: 'Send order updates via WhatsApp',
      paymentContinuityTitle: 'Built to feel easy from checkout to doorstep.',
      paymentContinuityBody: 'Clear delivery timing, free exchange, and support only when it is actually available.',
      deliveryLabel: 'Expected delivery',
    },
    confirmation: {
      statusHeading: 'What happens next',
      orderReceived: 'Order received',
      paymentChosen: 'Payment method',
      deliveryWindow: 'Delivery window',
      whatsappStatus: 'WhatsApp updates',
      whatsappEnabled: 'Enabled for this order',
      whatsappDisabled: 'Not enabled for this order',
      followUpFallback: 'We will use the checkout details on file for the next order update.',
      continuityTitle: 'Same promise after checkout.',
      continuityBody: 'Clear order status, honest delivery timing, and no made-up support promises.',
    },
  },
  ar: {
    nav: {
      searchPlaceholder: 'ابحث عن التصميم أو الفايب أو المناسبة...',
      searchSubmit: 'ابحث',
      searchClear: 'مسح البحث',
      searchOpen: 'فتح البحث',
      searchSuggestions: 'اقتراحات البحث',
      noSuggestions: 'لا توجد اقتراحات مطابقة حالياً.',
    },
    search: {
      suggestedLabel: 'مقترح',
      browseLabel: 'تصفح',
      designsHeading: 'التصاميم',
      vibesHeading: 'الفايب',
      occasionsHeading: 'المناسبات',
      relatedVibesHeading: 'فايبات مرتبطة',
      relatedOccasionsHeading: 'مناسبات مرتبطة',
      designsCount: 'نتائج التصاميم',
      vibesCount: 'نتائج الفايب',
      occasionsCount: 'نتائج المناسبات',
    },
    checkout: {
      secureData: 'بياناتك آمنة معنا.',
      secureDataArabic: 'بياناتك آمنة معنا',
      guestCheckout: 'إتمام الشراء كضيف بدون إنشاء حساب.',
      whatsappOptIn: 'أرسل تحديثات الطلب عبر واتساب',
      paymentContinuityTitle: 'رحلة واضحة من الدفع حتى الاستلام.',
      paymentContinuityBody: 'توقيت توصيل واضح، واستبدال مجاني، ودعم يظهر فقط عندما يكون متاحاً فعلاً.',
      deliveryLabel: 'موعد التوصيل المتوقع',
    },
    confirmation: {
      statusHeading: 'ماذا يحدث بعد ذلك',
      orderReceived: 'تم استلام الطلب',
      paymentChosen: 'طريقة الدفع',
      deliveryWindow: 'نافذة التوصيل',
      whatsappStatus: 'تحديثات واتساب',
      whatsappEnabled: 'مفعلة لهذا الطلب',
      whatsappDisabled: 'غير مفعلة لهذا الطلب',
      followUpFallback: 'سنستخدم بيانات الدفع والشحن المسجلة لإرسال التحديث التالي.',
      continuityTitle: 'نفس الوعد بعد إتمام الطلب.',
      continuityBody: 'حالة طلب واضحة، وتوقيت توصيل صريح، ومن دون وعود دعم غير حقيقية.',
    },
  },
} as const;

type UiLocaleContextValue = {
  locale: UiLocale;
  dir: UiDirection;
  copy: (typeof UI_COPY)[UiLocale];
  setLocale: (locale: UiLocale) => void;
};

const UiLocaleContext = createContext<UiLocaleContextValue | null>(null);

function isUiLocale(value: string | null | undefined): value is UiLocale {
  return value === 'en' || value === 'ar';
}

function getDirection(locale: UiLocale): UiDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function resolveInitialLocale(): UiLocale {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const queryLocale = params.get(UI_LOCALE_QUERY_KEY);
  if (isUiLocale(queryLocale)) return queryLocale;
  try {
    const stored = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
    if (isUiLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function UiLocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<UiLocale>(() => resolveInitialLocale());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLocale = params.get(UI_LOCALE_QUERY_KEY);
    if (isUiLocale(queryLocale) && queryLocale !== locale) {
      setLocale(queryLocale);
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
    try {
      window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<UiLocaleContextValue>(
    () => ({
      locale,
      dir: getDirection(locale),
      copy: UI_COPY[locale],
      setLocale,
    }),
    [locale],
  );

  return <UiLocaleContext.Provider value={value}>{children}</UiLocaleContext.Provider>;
}

export function useUiLocale() {
  const context = useContext(UiLocaleContext);
  if (!context) {
    throw new Error('useUiLocale must be used within UiLocaleProvider');
  }
  return context;
}
