export const HORO_V19_COLORS = {
  root: '#4F111F',
  breath: '#FEE5E2',
  pulse: '#8C2340',
  white: '#FFFFFF',
  softSurface: '#FFF7F5',
  darkText: '#4F111F',
} as const;

export const HORO_V19_SOUNDBITES = {
  primary: {
    en: 'Wear What You Feel',
    ar: 'إلبس اللي بتحس بيه',
  },
  rhythm: {
    en: 'Find Your Rhythm',
    ar: 'اكتشف إيقاعك',
  },
  canvas: {
    en: 'We are the canvas. You are the story.',
    ar: 'إحنا القماش. إنت القصة.',
  },
  promise: {
    en: 'Artist-made passion wear for feelings, identity, and meaningful gifts.',
    ar: 'قطع فنية قابلة للّبس للمشاعر، الهوية، والهدايا اللي لها معنى.',
  },
} as const;

export const HORO_V19_TRUST_COPY = {
  artistMade: {
    en: 'Artist-made designs',
    ar: 'تصميمات فنانين',
  },
  printedEgypt: {
    en: 'Printed in Egypt',
    ar: 'مطبوعة في مصر',
  },
  paymentAtCheckout: {
    en: 'Payment options shown at checkout',
    ar: 'طرق الدفع بتظهر في صفحة الدفع',
  },
  exchangePolicy: {
    en: '14-day exchange — see policy',
    ar: 'استبدال خلال ١٤ يوم — راجع السياسة',
  },
  whatsappSupport: {
    en: 'WhatsApp size help before dispatch',
    ar: 'مساعدة المقاس على واتساب قبل الشحن',
  },
} as const;

/** Hero subtitle: promise + rhythm cue (lowercase rhythm in body per V1.9 spec). */
export const HORO_V19_HERO_SUBTITLE = {
  en: `${HORO_V19_SOUNDBITES.promise.en} Find your rhythm.`,
  ar: `${HORO_V19_SOUNDBITES.promise.ar} ${HORO_V19_SOUNDBITES.rhythm.ar}.`,
} as const;
