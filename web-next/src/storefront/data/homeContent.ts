/** Trust strip on home — short titles for dark factual badges */
export const HOME_TRUST_BADGES = [
  { key: 'artistMade' },
  { key: 'printedEgypt' },
  { key: 'clearFitDetails' },
  { key: 'paymentAtCheckout' },
  { key: 'whatsappSupport' },
] as const;

/** Pastel surfaces for homepage feeling tiles (mockup-aligned). */
export const HOME_FEELING_TILE_SURFACES = [
  '#f4ede5',
  '#f8eaea',
  '#edf1ea',
  '#eeebf5',
  '#f7ebe4',
] as const;

export const HOME_PRIMARY_ROUTES = [
  {
    key: 'founding_drop',
    href: '/products',
    accent: '#8C2340',
  },
  {
    key: 'zodiac',
    href: '/products?category=zodiac',
    accent: '#4F111F',
  },
  {
    key: 'mood_lifestyle',
    href: '/products?category=mood-lifestyle',
    accent: '#FEE5E2',
  },
] as const;

/**
 * Legacy homepage routes kept for later restoration:
 *
 * export const HOME_PRIMARY_ROUTES_LEGACY = [
 *   { key: 'feeling', href: '/feelings', accent: '#8C2340' },
 *   { key: 'occasion', href: '/occasions', accent: '#4F111F' },
 *   { key: 'gift', href: '/gifts', accent: '#FEE5E2' },
 * ] as const;
 */

export const HOME_WHY_HORO_BLOCKS = [
  {
    key: 'localArtists',
  },
  {
    key: 'printedInEgypt',
  },
  {
    key: 'madeToFeelPersonal',
  },
  {
    key: 'clearFitDetails',
  },
  {
    key: 'codAndExchange',
  },
  {
    key: 'realProofOnly',
  },
] as const;

export const HOME_FEATURED_ARTIST = null as
  | null
  | {
      artistSlug: string;
      imageSrc: string;
      imageAlt: string;
      line: string;
    };

/** Curated UGC-style proof tiles until live customer photos are approved in admin. */
export const HOME_SEEN_ON_YOU: {
  imageSrc: string;
  imageAlt: string;
  handle?: string;
}[] = [
  {
    imageSrc: '/images/proof/back-fit-card.svg',
    imageAlt: 'Customer wearing HORO — back fit proof.',
    handle: 'calm-inside-graphic-tee',
  },
  {
    imageSrc: '/images/proof/macro-detail-card.svg',
    imageAlt: 'Close-up of HORO print quality.',
  },
  {
    imageSrc: '/images/proof/fabric-tag-card.svg',
    imageAlt: 'Fabric and tag detail on a HORO tee.',
  },
  {
    imageSrc: '/images/proof/weight-scale-card.svg',
    imageAlt: 'Weight and quality proof for HORO cotton.',
  },
];
