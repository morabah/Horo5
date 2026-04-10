import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type UiLocale = 'en' | 'ar';
export type UiDirection = 'ltr' | 'rtl';

const UI_LOCALE_STORAGE_KEY = 'horo-ui-locale';
const UI_LOCALE_QUERY_KEY = 'uiLocale';

const UI_COPY = {
  en: {
    shell: {
      home: 'Home',
      shopByFeeling: 'Shop by feeling',
      shopByMoment: 'Shop by moment',
      about: 'About',
      search: 'Search',
      cart: 'Cart',
      menu: 'Menu',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      shopHeading: 'Shop',
      aboutHeading: 'About',
      contactHeading: 'Contact',
      exchangePolicy: 'Exchange policy',
      privacyPolicy: 'Privacy policy',
      termsOfService: 'Terms of service',
      breadcrumb: 'Breadcrumb',
      language: 'Language',
      englishShort: 'EN',
      arabicShort: 'AR',
      pageNotFound: 'Page not found',
    },
    home: {
      heroCta: 'Shop by feeling',
      feelingsEyebrow: 'The feelings',
      feelingsTitle: 'Choose by feeling',
      momentsEyebrow: 'Choose by moment',
      momentsTitle: 'Gift it, go out, reset the day',
      momentsCta: 'Shop by moment',
      featuredTitle: 'Featured pieces',
      featuredCta: 'Shop by feeling',
      planEyebrow: 'Simple plan',
      planTitle: 'How it works',
      trustEyebrow: 'Why trust HORO',
      trustTitle: 'Why trust HORO',
      giftEyebrow: 'Thoughtful gifting',
      giftTitle: 'For the person on your mind',
      giftCta: 'Shop gift-ready pieces',
      studioEyebrow: 'Studio proof',
      studioTitle: 'Proof before public praise',
      inviteCta: 'Shop by feeling',
      recentHeading: 'Recently viewed',
      recentCta: 'Browse all designs',
    },
    nav: {
      searchPlaceholder: 'Search designs, feelings, or occasions...',
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
      vibesHeading: 'Feelings',
      occasionsHeading: 'Occasions',
      relatedVibesHeading: 'Related feelings',
      relatedOccasionsHeading: 'Related occasions',
      designsCount: 'Design matches',
      vibesCount: 'Feeling matches',
      occasionsCount: 'Occasion matches',
    },
    checkout: {
      secureData: 'Your details are secure with us.',
      secureDataArabic: 'بياناتك آمنة معنا',
      guestCheckout: 'Guest checkout, no account required.',
      stepInformation: 'Information',
      stepShipping: 'Shipping',
      stepPayment: 'Payment',
      headingContact: 'Contact',
      headingShippingAddress: 'Shipping address',
      headingShippingMethod: 'Shipping method',
      headingPayment: 'Payment',
      orderSummaryHeading: 'Order summary',
      whatsappOptIn: 'Send order updates via WhatsApp',
      paymentContinuityTitle: 'Built to feel easy from checkout to doorstep.',
      paymentContinuityBody: 'Clear delivery timing, free exchange, and support only when it is actually available.',
      deliveryLabel: 'Expected delivery',
      breadcrumbTitle: 'Checkout',
      backToCart: '← Back to cart',
      placingOrder: 'Placing order…',
      payFawryTitle: 'Fawry',
      payFawryBody: 'Reference or in-store payment — instructions sent after you place the order.',
      payWalletTitle: 'Mobile wallet',
      payWalletBody: 'Vodafone Cash, InstaPay, or similar — we follow up with payment details.',
      payPayPalTitle: 'PayPal',
      payPayPalBody: 'Pay with your PayPal balance or linked card — redirect or link sent after you place the order (demo flow).',
      paymentExtraSecureLine:
        'You can choose COD, card (discount where shown), PayPal, Fawry, or a mobile wallet. Final payment steps are confirmed after order placement.',
      expressHeading: 'Quick checkout',
      expressSub:
        'Demo: tap Apple Pay, Google Pay, or PayPal — then complete your details below. No charge until you confirm the order.',
      applePayLabel: 'Apple Pay',
      googlePayLabel: 'Google Pay',
      paypalExpressLabel: 'PayPal',
      expressPickedPrefix: 'Selected',
      expressWalletHint: 'Fawry, mobile wallet, and PayPal are also on the payment step.',
    },
    confirmation: {
      breadcrumbTitle: 'Order confirmed',
      statusHeading: 'What happens next',
      statusAtGlance: 'Status at a glance',
      orderReceived: 'Order received',
      paymentChosen: 'Payment method',
      deliveryWindow: 'Delivery window',
      whatsappStatus: 'WhatsApp updates',
      whatsappEnabled: 'Enabled for this order',
      whatsappDisabled: 'Not enabled for this order',
      followUpFallback: 'We will use the checkout details on file for the next order update.',
      continuityTitle: 'Same promise after checkout.',
      continuityBody: 'Clear order status, honest delivery timing, and no made-up support promises.',
      summaryHeading: 'Order summary',
      nextHeading: "What's next",
      exchangeCta: 'Review exchange policy',
      instagramPrompt: 'Snap a photo and tag HORO on Instagram.',
      whatsappOrderHelp: 'Order help on WhatsApp',
      continueShopping: 'Continue shopping',
    },
  },
  ar: {
    shell: {
      home: 'الرئيسية',
      shopByFeeling: 'تسوّق حسب الشعور',
      shopByMoment: 'تسوّق حسب المناسبة',
      about: 'عن HORO',
      search: 'البحث',
      cart: 'السلة',
      menu: 'القائمة',
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
      shopHeading: 'التسوّق',
      aboutHeading: 'عن HORO',
      contactHeading: 'التواصل',
      exchangePolicy: 'سياسة الاستبدال',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfService: 'الشروط والأحكام',
      breadcrumb: 'مسار التنقل',
      language: 'اللغة',
      englishShort: 'EN',
      arabicShort: 'AR',
      pageNotFound: 'الصفحة غير موجودة',
    },
    home: {
      heroCta: 'تسوّق حسب الشعور',
      feelingsEyebrow: 'المشاعر',
      feelingsTitle: 'اختر حسب الشعور',
      momentsEyebrow: 'اختر حسب المناسبة',
      momentsTitle: 'هدية، خروجة، أو إعادة ضبط اليوم',
      momentsCta: 'تسوّق حسب المناسبة',
      featuredTitle: 'قطع مختارة',
      featuredCta: 'تسوّق حسب الشعور',
      planEyebrow: 'خطوات واضحة',
      planTitle: 'كيف يعمل HORO',
      trustEyebrow: 'لماذا تثق في HORO',
      trustTitle: 'لماذا تثق في HORO',
      giftEyebrow: 'هدايا بمعنى',
      giftTitle: 'للشخص الذي تفكر فيه',
      giftCta: 'تسوّق القطع الجاهزة للهدايا',
      studioEyebrow: 'دليل من الاستوديو',
      studioTitle: 'الدليل قبل المديح',
      inviteCta: 'تسوّق حسب الشعور',
      recentHeading: 'شوهد مؤخراً',
      recentCta: 'تصفّح كل التصاميم',
    },
    nav: {
      searchPlaceholder: 'ابحث عن التصميم أو المشاعر أو المناسبة...',
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
      vibesHeading: 'المشاعر',
      occasionsHeading: 'المناسبات',
      relatedVibesHeading: 'مشاعر مرتبطة',
      relatedOccasionsHeading: 'مناسبات مرتبطة',
      designsCount: 'نتائج التصاميم',
      vibesCount: 'نتائج المشاعر',
      occasionsCount: 'نتائج المناسبات',
    },
    checkout: {
      secureData: 'بياناتك آمنة معنا.',
      secureDataArabic: 'بياناتك آمنة معنا',
      guestCheckout: 'إتمام الشراء كضيف بدون إنشاء حساب.',
      stepInformation: 'البيانات',
      stepShipping: 'الشحن',
      stepPayment: 'الدفع',
      headingContact: 'بيانات التواصل',
      headingShippingAddress: 'عنوان الشحن',
      headingShippingMethod: 'طريقة الشحن',
      headingPayment: 'الدفع',
      orderSummaryHeading: 'ملخص الطلب',
      whatsappOptIn: 'أرسل تحديثات الطلب عبر واتساب',
      paymentContinuityTitle: 'رحلة واضحة من الدفع حتى الاستلام.',
      paymentContinuityBody: 'توقيت توصيل واضح، واستبدال مجاني، ودعم يظهر فقط عندما يكون متاحاً فعلاً.',
      deliveryLabel: 'موعد التوصيل المتوقع',
      breadcrumbTitle: 'إتمام الشراء',
      backToCart: '← العودة إلى السلة',
      placingOrder: 'جاري تأكيد الطلب…',
      payFawryTitle: 'فوري',
      payFawryBody: 'دفع برقم مرجعي أو من منفذ فوري — التعليمات تُرسل بعد تأكيد الطلب.',
      payWalletTitle: 'محفظة إلكترونية',
      payWalletBody: 'فودافون كاش، انستاباي، أو ما شابه — نتابع مع تفاصيل الدفع.',
      payPayPalTitle: 'باي بال',
      payPayPalBody: 'الدفع عبر باي بال أو البطاقة المرتبطة — يُرسل رابط أو توجيه بعد تأكيد الطلب (واجهة تجريبية).',
      paymentExtraSecureLine:
        'يمكنك اختيار الدفع عند الاستلام، البطاقة (مع الخصم عند العرض)، باي بال، فوري، أو محفظة إلكترونية. خطوات الدفع النهائية تُؤكد بعد إتمام الطلب.',
      expressHeading: 'دفع سريع',
      expressSub:
        'تجريبي: اختر Apple Pay أو Google Pay أو PayPal — ثم أكمل بياناتك أدناه. لا يتم الخصم قبل تأكيد الطلب.',
      applePayLabel: 'Apple Pay',
      googlePayLabel: 'Google Pay',
      paypalExpressLabel: 'PayPal',
      expressPickedPrefix: 'تم الاختيار',
      expressWalletHint: 'فوري والمحفظة وباي بال متاحة أيضاً في خطوة الدفع.',
    },
    confirmation: {
      breadcrumbTitle: 'تم تأكيد الطلب',
      statusHeading: 'ماذا يحدث بعد ذلك',
      statusAtGlance: 'الحالة باختصار',
      orderReceived: 'تم استلام الطلب',
      paymentChosen: 'طريقة الدفع',
      deliveryWindow: 'نافذة التوصيل',
      whatsappStatus: 'تحديثات واتساب',
      whatsappEnabled: 'مفعلة لهذا الطلب',
      whatsappDisabled: 'غير مفعلة لهذا الطلب',
      followUpFallback: 'سنستخدم بيانات الدفع والشحن المسجلة لإرسال التحديث التالي.',
      continuityTitle: 'نفس الوعد بعد إتمام الطلب.',
      continuityBody: 'حالة طلب واضحة، وتوقيت توصيل صريح، ومن دون وعود دعم غير حقيقية.',
      summaryHeading: 'ملخص الطلب',
      nextHeading: 'ما التالي',
      exchangeCta: 'راجع سياسة الاستبدال',
      instagramPrompt: 'التقط صورة وشارك HORO على إنستغرام.',
      whatsappOrderHelp: 'مساعدة الطلب عبر واتساب',
      continueShopping: 'واصل التسوق',
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
  const [locale, setLocaleState] = useState<UiLocale>(() => resolveInitialLocale());

  const setLocale = (nextLocale: UiLocale) => {
    setLocaleState(nextLocale);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set(UI_LOCALE_QUERY_KEY, nextLocale);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

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
