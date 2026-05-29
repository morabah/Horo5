/**
 * Launch catalog: size table, artist, products, metafield payloads, collection membership.
 */

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
}

const SIZES: VariantSeed[] = [
  { size: 'S', sku: 'HORO-MOOD-CALM-001-BLK-S', price: '699.00', quantity: 3 },
  { size: 'M', sku: 'HORO-MOOD-CALM-001-BLK-M', price: '699.00', quantity: 6 },
  { size: 'L', sku: 'HORO-MOOD-CALM-001-BLK-L', price: '699.00', quantity: 6 },
  { size: 'XL', sku: 'HORO-MOOD-CALM-001-BLK-XL', price: '699.00', quantity: 4 },
  { size: 'XXL', sku: 'HORO-MOOD-CALM-001-BLK-XXL', price: '699.00', quantity: 2 },
];

export const PRODUCT_SEEDS: ProductLaunchSeed[] = [
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
    status: 'ACTIVE',
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
      'feeling-mood',
      'feeling-mood-calm',
      'occasion-gift',
      'occasion-birthday',
    ],
    merchandisingBadge: 'New',
    promoLabel: 'First drop',
    stockNote: 'Limited first drop',
    garmentColors: ['Black'],
  },
  {
    handle: 'aries-zodiac-tee',
    title: 'Aries Zodiac Graphic T-Shirt',
    descriptionHtml: '<p>Bold Aries energy on soft cotton. Printed in Egypt.</p>',
    tags: ['feeling:zodiac', 'feeling:aries', 'zodiac', 'graphic-tee', 'black'],
    status: 'ACTIVE',
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
    collectionHandles: ['feeling-zodiac', 'feeling-zodiac-aries'],
    merchandisingBadge: 'New',
    garmentColors: ['Black'],
  },
  {
    handle: 'giftable-calm-tee',
    title: 'Calm Inside — Gift Edition T-Shirt',
    descriptionHtml: '<p>Meaningful gift-ready tee with calm inside design. Printed in Egypt.</p>',
    tags: ['feeling:mood', 'giftable', 'gift', 'graphic-tee'],
    status: 'ACTIVE',
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
      'feeling-mood',
      'feeling-mood-calm',
      'occasion-gift',
      'occasion-birthday',
      'occasion-eid',
      'occasion-graduation',
    ],
    merchandisingBadge: 'Gift pick',
    garmentColors: ['Black'],
  },
];

export const GIFT_WRAP_HANDLE = 'gift-wrap';

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
