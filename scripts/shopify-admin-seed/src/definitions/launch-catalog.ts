/**
 * Launch catalog: size table, artist, products, metafield payloads, collection membership.
 *
 * Products default to DRAFT — do not set ACTIVE until photos, proof assets, and QA are complete.
 * Override for a one-off publish test: SHOPIFY_LAUNCH_PRODUCT_STATUS=ACTIVE
 */
import { launchProductTags } from './launch-content.js';

export const DEFAULT_LAUNCH_PRODUCT_STATUS: 'ACTIVE' | 'DRAFT' =
  process.env.SHOPIFY_LAUNCH_PRODUCT_STATUS === 'ACTIVE' ? 'ACTIVE' : 'DRAFT';

export const SIZE_TABLE_HANDLE = 'horo-regular-t-shirt';
export const ARTIST_HANDLE = 'horo-studio';

export const SIZE_TABLE_ROWS = [
  { size_label: 'S', chest: '50 cm', length: '68 cm', shoulder: '45 cm', sleeve: '21 cm' },
  { size_label: 'M', chest: '52 cm', length: '70 cm', shoulder: '46 cm', sleeve: '22 cm' },
  { size_label: 'L', chest: '54 cm', length: '72 cm', shoulder: '47 cm', sleeve: '23 cm' },
  { size_label: 'XL', chest: '56 cm', length: '74 cm', shoulder: '48 cm', sleeve: '24 cm' },
  { size_label: 'XXL', chest: '58 cm', length: '76 cm', shoulder: '49 cm', sleeve: '25 cm' },
];

export interface VariantSeed {
  size: string;
  sku: string;
  price: string;
  quantity: number;
}

export interface ProductLaunchSeed {
  handle: string;
  title: string;
  descriptionHtml: string;
  tags: string[];
  status: 'ACTIVE' | 'DRAFT';
  variants: VariantSeed[];
  /** feeling slug */
  feelingSlug: string;
  /** subfeeling slug */
  subfeelingSlug: string;
  pdpTagLabels: string[];
  giftable: boolean;
  giftOccasionTags: string[];
  buyerRoute: string;
  primaryAudience: string;
  worksFor: string[];
  feelsLike: string[];
  occasionSlugs: string[];
  collectionHandles: string[];
  merchandisingBadge?: string;
  promoLabel?: string;
  stockNote?: string;
  garmentColors: string[];
  launchGroup?: 'zodiac_capsule' | 'mood' | 'lifestyle';
  launchAudience?: 'women' | 'men' | 'unisex';
  launchDesign?: string;
  zodiacSign?: string;
}

const SIZES: VariantSeed[] = [
  { size: 'S', sku: 'HORO-MOOD-CALM-001-BLK-S', price: '699.00', quantity: 3 },
  { size: 'M', sku: 'HORO-MOOD-CALM-001-BLK-M', price: '699.00', quantity: 6 },
  { size: 'L', sku: 'HORO-MOOD-CALM-001-BLK-L', price: '699.00', quantity: 6 },
  { size: 'XL', sku: 'HORO-MOOD-CALM-001-BLK-XL', price: '699.00', quantity: 4 },
  { size: 'XXL', sku: 'HORO-MOOD-CALM-001-BLK-XXL', price: '699.00', quantity: 2 },
];

function variantsForSkuPrefix(prefix: string): VariantSeed[] {
  return SIZES.map((variant) => ({
    ...variant,
    sku: variant.sku.replace('HORO-MOOD-CALM-001', prefix),
  }));
}

function launchCollections(seed: Pick<ProductLaunchSeed, 'launchGroup' | 'launchAudience'>): string[] {
  const handles = ['founding-drop'];
  if (seed.launchGroup === 'zodiac_capsule') {
    handles.push('zodiac');
    if (seed.launchAudience === 'women') handles.push('zodiac-women');
    if (seed.launchAudience === 'men') handles.push('zodiac-men');
  } else if (seed.launchGroup === 'mood' || seed.launchGroup === 'lifestyle') {
    handles.push('mood-lifestyle');
  }
  return handles;
}

function buildFoundingDropSeed(input: {
  handle: string;
  title: string;
  skuPrefix: string;
  launchGroup: 'zodiac_capsule' | 'mood' | 'lifestyle';
  launchAudience: 'women' | 'men' | 'unisex';
  launchDesign: string;
  zodiacSign?: string;
  feelingSlug: string;
  subfeelingSlug: string;
  pdpTagLabels: string[];
}): ProductLaunchSeed {
  const launchTags = launchProductTags({
    launchGroup: input.launchGroup,
    launchAudience: input.launchAudience,
    launchDesign: input.launchDesign,
    zodiacSign: input.zodiacSign,
  });

  return {
    handle: input.handle,
    title: input.title,
    descriptionHtml: `<p>${input.title} — founding drop tee printed in Egypt on premium cotton.</p>`,
    tags: [...launchTags, 'feeling:' + input.feelingSlug, 'graphic-tee', 'black', 'regular-fit'],
    status: DEFAULT_LAUNCH_PRODUCT_STATUS,
    variants: variantsForSkuPrefix(input.skuPrefix),
    feelingSlug: input.feelingSlug,
    subfeelingSlug: input.subfeelingSlug,
    pdpTagLabels: input.pdpTagLabels,
    giftable: input.launchGroup !== 'zodiac_capsule',
    giftOccasionTags: input.launchGroup === 'zodiac_capsule' ? [] : ['Birthday', 'Gift'],
    buyerRoute: input.launchGroup === 'zodiac_capsule' ? 'personality' : 'feeling',
    primaryAudience: '22-40',
    worksFor: ['Daily wear', 'Gift'],
    feelsLike: ['Launch drop'],
    occasionSlugs: input.launchGroup === 'zodiac_capsule' ? ['birthday'] : ['birthday', 'gift'],
    collectionHandles: launchCollections({
      launchGroup: input.launchGroup,
      launchAudience: input.launchAudience,
    }),
    merchandisingBadge: 'New',
    promoLabel: 'First drop',
    stockNote: 'Limited first drop',
    garmentColors: ['Black'],
    launchGroup: input.launchGroup,
    launchAudience: input.launchAudience,
    launchDesign: input.launchDesign,
    zodiacSign: input.zodiacSign,
  };
}

/** Eleven representative founding-drop SKUs — aligned with web-next launch taxonomy. */
export const FOUNDING_DROP_PRODUCT_SEEDS: ProductLaunchSeed[] = [
  buildFoundingDropSeed({
    handle: 'zodiac-astral-body',
    title: 'Astral Body Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-GEM-W-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'women',
    launchDesign: 'gemini',
    zodiacSign: 'gemini',
    feelingSlug: 'zodiac',
    subfeelingSlug: 'gemini',
    pdpTagLabels: ['Sign Capsule', 'Gemini', 'Women'],
  }),
  buildFoundingDropSeed({
    handle: 'zodiac-star-alignment',
    title: 'Star Alignment Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-GEM-M-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'men',
    launchDesign: 'gemini',
    zodiacSign: 'gemini',
    feelingSlug: 'zodiac',
    subfeelingSlug: 'gemini',
    pdpTagLabels: ['Sign Capsule', 'Gemini', 'Men'],
  }),
  buildFoundingDropSeed({
    handle: 'zodiac-lunar-pull',
    title: 'Lunar Pull Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-CAN-W-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'women',
    launchDesign: 'cancer',
    zodiacSign: 'cancer',
    feelingSlug: 'zodiac',
    subfeelingSlug: 'cancer',
    pdpTagLabels: ['Sign Capsule', 'Cancer', 'Women'],
  }),
  buildFoundingDropSeed({
    handle: 'zodiac-solar-flare',
    title: 'Solar Flare Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-CAN-M-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'men',
    launchDesign: 'cancer',
    zodiacSign: 'cancer',
    feelingSlug: 'zodiac',
    subfeelingSlug: 'cancer',
    pdpTagLabels: ['Sign Capsule', 'Cancer', 'Men'],
  }),
  buildFoundingDropSeed({
    handle: 'zodiac-cosmic-dust',
    title: 'Cosmic Dust Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-LEO-W-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'women',
    launchDesign: 'leo',
    zodiacSign: 'leo',
    feelingSlug: 'zodiac',
    subfeelingSlug: 'leo',
    pdpTagLabels: ['Sign Capsule', 'Leo', 'Women'],
  }),
  buildFoundingDropSeed({
    handle: 'fiction-neon-dreams',
    title: 'Neon Dreams Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-LEO-M-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'men',
    launchDesign: 'leo',
    zodiacSign: 'leo',
    feelingSlug: 'fiction',
    subfeelingSlug: 'neon',
    pdpTagLabels: ['Sign Capsule', 'Leo', 'Men'],
  }),
  buildFoundingDropSeed({
    handle: 'fiction-dragon-scale',
    title: 'Dragon Scale Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-VIR-W-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'women',
    launchDesign: 'virgo',
    zodiacSign: 'virgo',
    feelingSlug: 'fiction',
    subfeelingSlug: 'dragon',
    pdpTagLabels: ['Sign Capsule', 'Virgo', 'Women'],
  }),
  buildFoundingDropSeed({
    handle: 'fiction-distant-suns',
    title: 'Distant Suns Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-VIR-M-001',
    launchGroup: 'zodiac_capsule',
    launchAudience: 'men',
    launchDesign: 'virgo',
    zodiacSign: 'virgo',
    feelingSlug: 'fiction',
    subfeelingSlug: 'distant',
    pdpTagLabels: ['Sign Capsule', 'Virgo', 'Men'],
  }),
  buildFoundingDropSeed({
    handle: 'emotions-silent-scream',
    title: 'Silent Scream Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-ICARE-001',
    launchGroup: 'mood',
    launchAudience: 'unisex',
    launchDesign: 'i-care',
    feelingSlug: 'mood',
    subfeelingSlug: 'i-care',
    pdpTagLabels: ['Mood', 'I Care', 'Unisex'],
  }),
  buildFoundingDropSeed({
    handle: 'emotions-raw-nerve',
    title: 'Raw Nerve Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-IDONT-001',
    launchGroup: 'mood',
    launchAudience: 'unisex',
    launchDesign: 'i-dont-care',
    feelingSlug: 'mood',
    subfeelingSlug: 'i-dont-care',
    pdpTagLabels: ['Mood', "I Don't Care", 'Unisex'],
  }),
  buildFoundingDropSeed({
    handle: 'quiet-revolt',
    title: 'Quiet Revolt Graphic T-Shirt',
    skuPrefix: 'HORO-LAUNCH-WALK-001',
    launchGroup: 'lifestyle',
    launchAudience: 'unisex',
    launchDesign: 'walk-alone',
    feelingSlug: 'mood',
    subfeelingSlug: 'walk-alone',
    pdpTagLabels: ['Lifestyle', 'Walk Alone', 'Unisex'],
  }),
];

export const PRODUCT_SEEDS: ProductLaunchSeed[] = [
  ...FOUNDING_DROP_PRODUCT_SEEDS,
  {
    handle: 'calm-inside-graphic-tee',
    title: 'Calm Inside Graphic T-Shirt',
    descriptionHtml:
      '<p>A quiet design for people who carry calm inside. Premium cotton tee, printed in Egypt.</p>',
    tags: [
      'feeling:mood',
      'feeling:calm',
      'alias:مزاج',
      'alias:هادي',
      'giftable',
      'regular-fit',
      'black',
      'graphic-tee',
    ],
    status: DEFAULT_LAUNCH_PRODUCT_STATUS,
    variants: SIZES,
    feelingSlug: 'mood',
    subfeelingSlug: 'calm',
    pdpTagLabels: ['Mood', 'Calm', 'Graphic T-shirt'],
    giftable: true,
    giftOccasionTags: ['Birthday', 'Eid', 'Graduation'],
    buyerRoute: 'feeling',
    primaryAudience: '25-40',
    worksFor: ['Daily wear', 'Gift', 'Coffee outing'],
    feelsLike: ['Calm', 'Quiet confidence'],
    occasionSlugs: ['birthday', 'gift'],
    collectionHandles: [
      'founding-drop',
      'mood-lifestyle',
      'feeling-mood',
      'feeling-mood-calm',
      'occasion-gift',
      'occasion-birthday',
    ],
    merchandisingBadge: 'New',
    promoLabel: 'First drop',
    stockNote: 'Limited first drop',
    garmentColors: ['Black'],
    launchGroup: 'mood',
    launchAudience: 'unisex',
    launchDesign: 'i-care',
  },
  {
    handle: 'aries-zodiac-tee',
    title: 'Aries Zodiac Graphic T-Shirt',
    descriptionHtml: '<p>Bold Aries energy on soft cotton. Printed in Egypt.</p>',
    tags: ['feeling:zodiac', 'feeling:aries', 'zodiac', 'graphic-tee', 'black'],
    status: DEFAULT_LAUNCH_PRODUCT_STATUS,
    variants: SIZES.map((v) => ({
      ...v,
      sku: v.sku.replace('MOOD-CALM', 'ZODIAC-ARIES'),
    })),
    feelingSlug: 'zodiac',
    subfeelingSlug: 'aries',
    pdpTagLabels: ['Zodiac', 'Aries', 'Graphic T-shirt'],
    giftable: false,
    giftOccasionTags: [],
    buyerRoute: 'personality',
    primaryAudience: '22-35',
    worksFor: ['Statement wear', 'Birthday gift'],
    feelsLike: ['Bold', 'Fire sign energy'],
    occasionSlugs: ['birthday'],
    collectionHandles: ['founding-drop', 'zodiac', 'zodiac-men', 'feeling-zodiac', 'feeling-zodiac-aries'],
    merchandisingBadge: 'New',
    garmentColors: ['Black'],
    launchGroup: 'zodiac_capsule',
    launchAudience: 'men',
    launchDesign: 'aries',
    zodiacSign: 'aries',
  },
  {
    handle: 'giftable-calm-tee',
    title: 'Calm Inside — Gift Edition T-Shirt',
    descriptionHtml: '<p>Meaningful gift-ready tee with calm inside design. Printed in Egypt.</p>',
    tags: ['feeling:mood', 'giftable', 'gift', 'graphic-tee'],
    status: DEFAULT_LAUNCH_PRODUCT_STATUS,
    variants: SIZES.map((v) => ({
      ...v,
      sku: v.sku.replace('MOOD-CALM', 'GIFT-CALM'),
    })),
    feelingSlug: 'mood',
    subfeelingSlug: 'calm',
    pdpTagLabels: ['Gift-ready', 'Mood', 'Calm'],
    giftable: true,
    giftOccasionTags: ['Birthday', 'Eid', 'Graduation', 'Gift'],
    buyerRoute: 'gift',
    primaryAudience: '25-45',
    worksFor: ['Gift', 'Special occasions'],
    feelsLike: ['Thoughtful', 'Calm'],
    occasionSlugs: ['birthday', 'eid', 'graduation', 'gift'],
    collectionHandles: [
      'founding-drop',
      'mood-lifestyle',
      'feeling-mood',
      'feeling-mood-calm',
      'occasion-gift',
      'occasion-birthday',
      'occasion-eid',
      'occasion-graduation',
    ],
    merchandisingBadge: 'Gift pick',
    garmentColors: ['Black'],
    launchGroup: 'mood',
    launchAudience: 'unisex',
    launchDesign: 'i-care',
  },
  {
    handle: 'fiction-hero-tee',
    title: 'Fiction Hero Graphic T-Shirt',
    descriptionHtml: '<p>Story-first graphic tee for readers and dreamers. Printed in Egypt.</p>',
    tags: ['feeling:fiction', 'graphic-tee', 'black'],
    status: DEFAULT_LAUNCH_PRODUCT_STATUS,
    variants: SIZES.map((v) => ({
      ...v,
      sku: v.sku.replace('MOOD-CALM', 'FICTION-HERO'),
    })),
    feelingSlug: 'fiction',
    subfeelingSlug: 'hero',
    pdpTagLabels: ['Fiction', 'Hero', 'Graphic T-shirt'],
    giftable: true,
    giftOccasionTags: ['Birthday'],
    buyerRoute: 'feeling',
    primaryAudience: '22-35',
    worksFor: ['Daily wear', 'Gift'],
    feelsLike: ['Imaginative', 'Bold'],
    occasionSlugs: ['birthday', 'gift'],
    collectionHandles: ['feeling-fiction', 'occasion-gift'],
    merchandisingBadge: 'New',
    garmentColors: ['Black'],
  },
];

export const GIFT_WRAP_HANDLE = 'gift-wrap';
export const FOUNDING_DROP_HANDLE = 'founding-drop';

export const THEME_SETTINGS_PATCH: Record<string, string> = {
  horo_gift_wrap_label: 'Add gift wrap',
  horo_gift_wrap_price_hint: '+ EGP 50',
  horo_trust_badge_1: 'Artist-made design',
  horo_trust_badge_2: 'Printed in Egypt',
  horo_trust_badge_3: 'COD when shown at checkout',
  horo_trust_badge_4: '14-day exchange — see policy',
  horo_trust_badge_5: 'WhatsApp support',
  horo_delivery_cairo: 'Cairo/Giza: 2–4 business days',
  horo_delivery_alex: 'Alexandria: 3–5 business days',
  horo_delivery_other: 'Other governorates: 4–7 business days',
  horo_incentives_live: 'false',
};
