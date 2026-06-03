export const HORO_V19_COLORS = {
  root: '#4F111F',
  breath: '#FEE5E2',
  pulse: '#8C2340',
  white: '#FFFFFF',
  softSurface: '#FFF7F5',
  darkText: '#4F111F',
} as const;

export const HORO_V19_COLOR_ROLES = {
  pageCanvas: HORO_V19_COLORS.softSurface,
  storyPanel: HORO_V19_COLORS.breath,
  cardSurface: HORO_V19_COLORS.white,
  rootText: HORO_V19_COLORS.root,
  brandDepth: HORO_V19_COLORS.root,
  pulseAction: HORO_V19_COLORS.pulse,
  activeState: HORO_V19_COLORS.pulse,
  subtleBorder: '#E8C9C6',
} as const;

export const HORO_V19_PALETTE_GUIDANCE = {
  base: 'Use softSurface and white as the dominant canvas so the site stays shoppable and calm.',
  breath: 'Use Breath for trust ribbons, story panels, gift moments, and soft product storytelling.',
  root: 'Use Root for typography, header/footer depth, and premium brand fields.',
  pulse: 'Use Pulse only for primary CTAs, active states, badges, and limited drop/sale emphasis.',
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
    en: 'Artist-made',
    ar: 'تصميم فنانين',
  },
  printedEgypt: {
    en: 'Printed in Egypt',
    ar: 'مطبوعة في مصر',
  },
  paymentAtCheckout: {
    en: 'Payment at checkout',
    ar: 'الدفع عند الدفع',
  },
  exchangePolicy: {
    en: '14-day exchange',
    ar: 'استبدال ١٤ يوم',
  },
  whatsappSupport: {
    en: 'WhatsApp size help',
    ar: 'مساعدة واتساب',
  },
} as const;

/** Hero subtitle: promise + rhythm cue (lowercase rhythm in body per V1.9 spec). */
export const HORO_V19_HERO_SUBTITLE = {
  en: `${HORO_V19_SOUNDBITES.promise.en} Find your rhythm.`,
  ar: `${HORO_V19_SOUNDBITES.promise.ar} ${HORO_V19_SOUNDBITES.rhythm.ar}.`,
} as const;
