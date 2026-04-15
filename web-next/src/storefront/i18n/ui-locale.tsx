import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type UiLocale = 'en' | 'ar';
export type UiDirection = 'ltr' | 'rtl';

const UI_LOCALE_STORAGE_KEY = 'horo-ui-locale';
const UI_LOCALE_QUERY_KEY = 'uiLocale';

const UI_COPY = {
  en: {
    shell: {
      home: 'Home',
      shopAll: 'Shop All',
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
      orderPlacedHint: 'Your bag was cleared after checkout.',
      orderPlacedViewReceipt: 'View receipt',
      orderPlacedDismiss: 'Dismiss',
    },
    home: {
      heroCta: 'Shop by feeling',
      feelingsEyebrow: 'The feelings',
      feelingsTitle: 'Choose by feeling',
      momentsEyebrow: 'Choose by moment',
      momentsTitle: 'Gift it, go out, reset the day',
      momentsCta: 'Shop by moment',
      featuredTitle: 'Featured pieces',
      featuredCta: 'View all products',
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
    cartService: {
      shippingExplainerArabic: 'الشحن المعروض تقديراً (قياسي داخل مصر)؛ ستؤكد السرعة والتكلفة النهائية عند إتمام الطلب.',
      estimatedDeliveryCheckoutNoteArabic: 'التواريخ تقريبية أيام عمل من تأكيد الطلب؛ التفاصيل النهائية في الخطوة التالية.',
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
      rememberAddressOnDevice: 'Remember my shipping details on this device',
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
        'You can choose COD, Instapay (bank transfer via phone, IBAN, or wallet), or Paymob card. Card orders finish only after the Paymob step; COD and Instapay confirm the order when you place it, then you pay out of band for Instapay.',
      expressHeading: 'Quick checkout',
      expressSub:
        'Demo: tap Apple Pay, Google Pay, or PayPal — then complete your details below. No charge until you confirm the order.',
      applePayLabel: 'Apple Pay',
      googlePayLabel: 'Google Pay',
      paypalExpressLabel: 'PayPal',
      expressPickedPrefix: 'Selected',
      expressWalletHint: 'Fawry, mobile wallet, and PayPal are also on the payment step.',
      changeSizeInBag: 'Change size in bag',
      paymobVerifyingTitle: 'Verifying your payment…',
      paymobVerifyingBody: 'This usually takes a few seconds. Please keep this page open.',
      paymobPendingTitle: 'Payment still processing',
      paymobPendingBody:
        'We could not confirm your card yet. Retry the check below, or return to Paymob if you have not finished paying.',
      paymobRetryCheck: 'Retry verification',
      paymobStillConfirmingTitle: 'Still confirming with Paymob…',
      paymobStillConfirmingBody: 'This can take a little longer while your bank finishes. Please keep this page open.',
      preparingPaymentRedirect: 'Connecting to secure payment…',
      governorateMustMatchList:
        'Pick an Egyptian governorate from the list so we can ship your order. Google suggestions do not always match our shipping zones.',
      whatsappOptInHint:
        'We send delivery updates on WhatsApp — untick if you prefer we only use phone or email.',
      useCodInstead: 'Switch to cash on delivery',
      paymentOptionsLoadingNote:
        'Payment options load automatically for Egypt. Save your shipping details to attach delivery and confirm totals.',
      instapayPayoutDetailsToggleShow: 'Show transfer details',
      instapayPayoutDetailsToggleHide: 'Hide transfer details',
      instapayPayoutInlineHeading: 'Instapay transfer details',
      shippingDisplayFallbackNote:
        'Estimate only; the exact shipping line confirms once your address is saved in Medusa.',
      paymentErrorCodRecoveryHint:
        'If online payment keeps failing, use “Switch to cash on delivery” below (when available) and submit again.',
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
      subtotalLabel: 'Subtotal',
      giftWrapLabel: 'Gift wrap',
      shippingTotalLabel: 'Shipping',
      discountTotalLabel: 'Discount',
      taxTotalLabel: 'Tax',
      orderTotalLabel: 'Total',
      adjustmentLabel: 'Order adjustments',
      instapayPayoutHeading: 'Complete your Instapay transfer',
      instapayPayoutIntro:
        'Pay the order total using Instapay or your bank app (phone number, IBAN, or wallet). If your bank allows a memo, include your order reference below.',
      cartClearedReceiptNote: 'Your bag was cleared — this page is your receipt.',
      referenceIdLabel: 'System reference',
      timelineHeading: "What's next",
      timelineStep1Title: 'Order received',
      timelineStep1Body: 'We logged your order and will prepare it for shipping.',
      timelineStep2Title: 'Payment',
      timelineStep3Title: 'Delivery',
      timelineStep3BodyPrefix: 'Estimated window:',
      timelineStep1BodyArabic: 'سجّلنا طلبك وسنبدأ تجهيزه للشحن.',
      timelineStep3BodyPrefixArabic: 'النافذة المتوقعة:',
      followUpFallbackArabic: 'سنستخدم بيانات الدفع والشحن المسجّلة لإرسال التحديث التالي.',
      whatsappOrderHelpArabic: 'مساعدة الطلب عبر واتساب',
    },
  },
  ar: {
    shell: {
      home: 'الرئيسية',
      shopAll: 'تسوّق الكل',
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
      orderPlacedHint: 'تم إفراغ السلة بعد إتمام الطلب.',
      orderPlacedViewReceipt: 'عرض الإيصال',
      orderPlacedDismiss: 'إخفاء',
    },
    home: {
      heroCta: 'تسوّق حسب الشعور',
      feelingsEyebrow: 'المشاعر',
      feelingsTitle: 'اختر حسب الشعور',
      momentsEyebrow: 'اختر حسب المناسبة',
      momentsTitle: 'هدية، خروجة، أو إعادة ضبط اليوم',
      momentsCta: 'تسوّق حسب المناسبة',
      featuredTitle: 'قطع مختارة',
      featuredCta: 'عرض كل المنتجات',
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
    cartService: {
      shippingExplainerArabic:
        'الشحن المعروض تقديراً (قياسي داخل مصر)؛ ستؤكد السرعة والتكلفة النهائية عند إتمام الطلب.',
      estimatedDeliveryCheckoutNoteArabic:
        'التواريخ تقريبية أيام عمل من تأكيد الطلب؛ التفاصيل النهائية في الخطوة التالية.',
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
      rememberAddressOnDevice: 'احفظ عنوان الشحن على هذا الجهاز',
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
        'يمكنك اختيار الدفع عند الاستلام، أو إنستاباي (تحويل عبر الهاتف أو الآيبان أو المحفظة)، أو البطاقة عبر Paymob. طلبات البطاقة تُكمل بعد خطوة Paymob؛ أما الدفع عند الاستلام وإنستاباي فيُسجّل الطلب عند التأكيد ثم تدفع إنستاباي خارج الموقع.',
      expressHeading: 'دفع سريع',
      expressSub:
        'تجريبي: اختر Apple Pay أو Google Pay أو PayPal — ثم أكمل بياناتك أدناه. لا يتم الخصم قبل تأكيد الطلب.',
      applePayLabel: 'Apple Pay',
      googlePayLabel: 'Google Pay',
      paypalExpressLabel: 'PayPal',
      expressPickedPrefix: 'تم الاختيار',
      expressWalletHint: 'فوري والمحفظة وباي بال متاحة أيضاً في خطوة الدفع.',
      changeSizeInBag: 'تغيير المقاس من السلة',
      paymobVerifyingTitle: 'جاري التحقق من الدفع…',
      paymobVerifyingBody: 'قد يستغرق ذلك بضع ثوانٍ. يرجى إبقاء هذه الصفحة مفتوحة.',
      paymobPendingTitle: 'الدفع ما زال قيد المعالجة',
      paymobPendingBody:
        'لم نتمكن من تأكيد البطاقة بعد. جرّب إعادة التحقق أدناه، أو أكمل الدفع في Paymob إذا لم تنتهِ بعد.',
      paymobRetryCheck: 'إعادة التحقق',
      paymobStillConfirmingTitle: 'ما زلنا نؤكد مع Paymob…',
      paymobStillConfirmingBody: 'قد يستغرق ذلك قليلاً حتى ينتهي البنك. يرجى إبقاء الصفحة مفتوحة.',
      preparingPaymentRedirect: 'جاري الاتصال بالدفع الآمن…',
      governorateMustMatchList:
        'اختر محافظة مصر من القائمة الرسمية حتى نتمكن من الشحن. اقتراحات Google لا تطابق دائماً مناطق الشحن لدينا.',
      whatsappOptInHint:
        'نرسل تحديثات التوصيل عبر واتساب — أزل التحديد إذا كنت تفضل الاعتماد على الهاتف أو البريد فقط.',
      useCodInstead: 'التبديل إلى الدفع عند الاستلام',
      paymentOptionsLoadingNote:
        'تُحمّل طرق الدفع تلقائياً لمصر. احفظ بيانات الشحن لربط التوصيل وتأكيد الإجمالي.',
      instapayPayoutDetailsToggleShow: 'عرض تفاصيل التحويل',
      instapayPayoutDetailsToggleHide: 'إخفاء تفاصيل التحويل',
      instapayPayoutInlineHeading: 'تفاصيل تحويل إنستاباي',
      shippingDisplayFallbackNote:
        'تقدير فقط؛ يُثبَّت سطر الشحن النهائي بعد حفظ العنوان في Medusa.',
      paymentErrorCodRecoveryHint:
        'إذا استمر فشل الدفع الإلكتروني، استخدم «التبديل إلى الدفع عند الاستلام» أدناه (إن وُجد) ثم أعد الإرسال.',
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
      subtotalLabel: 'المجموع الفرعي',
      giftWrapLabel: 'تغليف الهدية',
      shippingTotalLabel: 'الشحن',
      discountTotalLabel: 'الخصم',
      taxTotalLabel: 'الضريبة',
      orderTotalLabel: 'الإجمالي',
      adjustmentLabel: 'تعديلات على الطلب',
      instapayPayoutHeading: 'أكمل التحويل عبر إنستاباي',
      instapayPayoutIntro:
        'ادفع إجمالي الطلب عبر إنستاباي أو تطبيق البنك (هاتف مسجّل، أو آيبان، أو محفظة). إذا سمح البنك بملاحظة للمستفيد، اذكر رقم الطلب أدناه.',
      cartClearedReceiptNote: 'تم إفراغ السلة — هذه الصفحة هي إيصالك.',
      referenceIdLabel: 'مرجع النظام',
      timelineHeading: 'ماذا بعد؟',
      timelineStep1Title: 'تم استلام الطلب',
      timelineStep1Body: 'سجّلنا طلبك وسنبدأ تجهيزه للشحن.',
      timelineStep2Title: 'الدفع',
      timelineStep3Title: 'التوصيل',
      timelineStep3BodyPrefix: 'النافذة المتوقعة:',
      timelineStep1BodyArabic: '',
      timelineStep3BodyPrefixArabic: '',
      followUpFallbackArabic: '',
      whatsappOrderHelpArabic: '',
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
  const [locale, setLocaleState] = useState<UiLocale>('en');

  useEffect(() => {
    setLocaleState(resolveInitialLocale());
  }, []);

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
