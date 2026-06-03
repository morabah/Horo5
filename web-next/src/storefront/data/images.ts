/**
 * Local storefront imagery. Phase 2 standardizes these into named storefront slots
 * so page sections stop pulling from an ad hoc shared pool.
 */

import {
  getFeeling,
  getFeelings,
  getOccasion,
  getProduct,
  getSubfeeling,
  productsByFeeling,
  productsByOccasion,
  productsBySubfeeling,
  type Product,
} from './site.ts';
import { productMediaGalleryItemSrc, type ProductMediaGalleryItem } from './catalog-types';

/** On-brand vector mark — default storefront slot fill until Cairo photography ships (§3.4). */
export const heroVectorizedV2 = '/images/hero/horo_vectorized_v2.svg';

/** True when src is empty or a generic HORO brand mark used before product photography ships. */
export function isGenericBrandPlaceholderSrc(src: string | undefined): boolean {
  const value = src?.trim();
  if (!value) return true;
  if (value === heroVectorizedV2) return true;
  if (value.includes('horo_vectorized') || value.includes('brand-placeholder')) return true;
  if (value.includes('placeholder') && value.includes('/images/')) return true;
  return false;
}

/** Seed/demo URLs and stock tees — not curated category tile photography. */
const STOCK_FEELING_TILE_PATTERN =
  /(?:bg_tee|bg_vibe|tee_walking|woman_street|macro-detail|emotions_vibe|unsplash\.com)/i;

export function isStockOrDemoFeelingTileSrc(src: string | undefined): boolean {
  const value = src?.trim();
  if (!value) return true;
  if (isGenericBrandPlaceholderSrc(value)) return true;
  return STOCK_FEELING_TILE_PATTERN.test(value);
}

export function pickGiftBlockImageSrc(options: {
  sectionImage?: string;
  product?: Product;
  packagingFallback?: string;
}): string | undefined {
  const { sectionImage, product, packagingFallback } = options;
  if (sectionImage?.trim() && !isBackLikeProductImageSrc(sectionImage)) {
    return sectionImage.trim();
  }
  if (product) {
    for (const item of product.media?.gallery ?? []) {
      if (typeof item === 'string') continue;
      if (item.tag !== 'gift') continue;
      const url = galleryItemSrc(item);
      if (url && !isBackLikeProductImageSrc(url)) return url;
    }
  }
  if (packagingFallback?.trim() && !isBackLikeProductImageSrc(packagingFallback)) {
    return packagingFallback.trim();
  }
  if (product) {
    const card = pickHomeCardImageSrc(product);
    if (card && !isBackLikeProductImageSrc(card)) return card;
  }
  return undefined;
}

/**
 * Homepage hero shirt animation (H.264 MP4 under `public/videos/`).
 * Re-encode with ffmpeg for smaller files if needed, e.g. `-an -movflags +faststart`.
 */
export const homeHeroShirtAnimation = {
  src: '/videos/home-hero-shirt-design.mp4',
  type: 'video/mp4' as const,
  /** Raster poster shown until the MP4 decodes; pair with the animation for a seamless handoff. */
  posterSrc: '/images/hero/home-hero-video-poster.png',
} as const;

/** Homepage "Wear What You Feel" hero — static editorial image with model + mantra typography. */
export const homeHeroWearFeel = {
  src: '/images/hero/home-hero-wear-feel.png',
  alt: 'Model wearing HORO graphic tee — Wear What You Feel',
} as const;

export const homeFoundingCampaignReference = {
  src: '/images/homepage-reference/founding-drop-campaign.png',
  alt: 'Model wearing a HORO graphic tee in a warm Cairo editorial setting.',
} as const;

const UNAVAILABLE_HOMEPAGE_REFERENCE_IMAGES = new Set<string>();

export function isUnavailableHomepageReferenceImageSrc(src: string | undefined): boolean {
  const value = src?.trim();
  return Boolean(value && UNAVAILABLE_HOMEPAGE_REFERENCE_IMAGES.has(value));
}

/**
 * Named slot paths for layouts — all point at the brand vector until real product/lifestyle photography exists.
 */
/** Interim per-slot proof art until lifestyle photography ships (WS-A). */
export const tee = {
  whiteFront: '/images/proof/back-fit-card.svg',
  womanSmile: '/images/proof/macro-detail-card.svg',
  womanStreet: '/images/proof/fabric-tag-card.svg',
  manCasual: '/images/proof/weight-scale-card.svg',
  womanUrban: '/images/proof/wash-test-card.svg',
  walkingStreet: '/images/proof/back-fit-card.svg',
  yellowTee: '/images/proof/macro-detail-card.svg',
  relaxedFit: '/images/proof/fabric-tag-card.svg',
  studioTee: '/images/proof/weight-scale-card.svg',
  friendsTees: '/images/proof/wash-test-card.svg',
  flatLayStyle: '/images/proof/macro-detail-card.svg',
  outdoorTee: '/images/proof/back-fit-card.svg',
  streetPose: '/images/proof/fabric-tag-card.svg',
} as const;

const INTERIM_PRODUCT_CARD_FALLBACKS = Object.values(tee);

function interimCardImageForSlug(slug: string): string {
  const hash = [...slug].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return INTERIM_PRODUCT_CARD_FALLBACKS[hash % INTERIM_PRODUCT_CARD_FALLBACKS.length] ?? tee.studioTee;
}

const CONVERSION_REFERENCE_IMAGES = [
  '/images/homepage-reference/product-i-care.png',
  '/images/homepage-reference/product-find-your-rhythm.png',
  '/images/homepage-reference/product-walk-alone.png',
  '/images/homepage-reference/product-i-dont-care.png',
  '/images/homepage-reference/product-rest-your-mind.png',
] as const;

export const GIFT_PACKAGING_REFERENCE_IMAGE = '/images/homepage-reference/gift-box.png';

const CONVERSION_REFERENCE_BY_DESIGN: Record<string, (typeof CONVERSION_REFERENCE_IMAGES)[number]> = {
  'i-care': '/images/homepage-reference/product-i-care.png',
  'i-dont-care': '/images/homepage-reference/product-i-dont-care.png',
  'walk-alone': '/images/homepage-reference/product-walk-alone.png',
  'find-your-rhythm': '/images/homepage-reference/product-find-your-rhythm.png',
  'rest-your-mind': '/images/homepage-reference/product-rest-your-mind.png',
  gemini: '/images/homepage-reference/product-find-your-rhythm.png',
  cancer: '/images/homepage-reference/product-i-care.png',
  leo: '/images/homepage-reference/product-walk-alone.png',
  virgo: '/images/homepage-reference/product-rest-your-mind.png',
  aries: '/images/homepage-reference/product-i-dont-care.png',
  calm: '/images/homepage-reference/product-rest-your-mind.png',
};

/** Five launch founding-drop handles — canonical for parity tests and baseline audits. */
export const FOUNDING_DROP_LAUNCH_SLUGS = [
  'i-care',
  'i-dont-care',
  'walk-alone',
  'find-your-rhythm',
  'rest-your-mind',
] as const;

export type FoundingDropLaunchSlug = (typeof FOUNDING_DROP_LAUNCH_SLUGS)[number];

export type HomepageCardImageClass = 'real' | 'reference';

export function classifyHomepageCardImageSrc(src: string): HomepageCardImageClass {
  return isHomepageReferenceImageSrc(src) ? 'reference' : 'real';
}

const CONVERSION_REFERENCE_BY_SLUG: Record<string, (typeof CONVERSION_REFERENCE_IMAGES)[number]> = {
  'the-weight-of-light': '/images/homepage-reference/product-i-care.png',
  'midnight-compass': '/images/homepage-reference/product-find-your-rhythm.png',
  'quiet-revolt': '/images/homepage-reference/product-walk-alone.png',
  'quiet-revolt-tee': '/images/homepage-reference/product-walk-alone.png',
  'climb-the-ladder': '/images/homepage-reference/product-rest-your-mind.png',
  'next-wave': '/images/homepage-reference/product-i-dont-care.png',
  'i-care': '/images/homepage-reference/product-i-care.png',
  'i-dont-care': '/images/homepage-reference/product-i-dont-care.png',
  'walk-alone': '/images/homepage-reference/product-walk-alone.png',
  'find-your-rhythm': '/images/homepage-reference/product-find-your-rhythm.png',
  'rest-your-mind': '/images/homepage-reference/product-rest-your-mind.png',
  'zodiac-astral-body': '/images/homepage-reference/product-find-your-rhythm.png',
  'zodiac-star-alignment': '/images/homepage-reference/product-find-your-rhythm.png',
  'zodiac-lunar-pull': '/images/homepage-reference/product-i-care.png',
  'zodiac-solar-flare': '/images/homepage-reference/product-i-care.png',
  'zodiac-cosmic-dust': '/images/homepage-reference/product-walk-alone.png',
  'fiction-neon-dreams': '/images/homepage-reference/product-walk-alone.png',
  'fiction-dragon-scale': '/images/homepage-reference/product-rest-your-mind.png',
  'fiction-distant-suns': '/images/homepage-reference/product-rest-your-mind.png',
  'emotions-silent-scream': '/images/homepage-reference/product-i-care.png',
  'emotions-raw-nerve': '/images/homepage-reference/product-i-dont-care.png',
  'calm-inside': '/images/homepage-reference/product-rest-your-mind.png',
  'calm-inside-graphic-tee': '/images/homepage-reference/product-rest-your-mind.png',
};

/** Homepage editorial section fallbacks when CMS or product media is missing. */
export const HOME_EDITORIAL_REFERENCE_IMAGES = [
  '/images/homepage-reference/editorial-artwork-detail.png',
  '/images/homepage-reference/editorial-calm-inside.png',
] as const;

type ConversionReferenceProduct = Pick<Product, 'slug' | 'name'> &
  Partial<Pick<Product, 'launchDesign' | 'zodiacSign'>>;

export function conversionReferenceImageForProduct(product: ConversionReferenceProduct): (typeof CONVERSION_REFERENCE_IMAGES)[number] {
  if (CONVERSION_REFERENCE_BY_SLUG[product.slug]) {
    return CONVERSION_REFERENCE_BY_SLUG[product.slug];
  }

  const designKey = product.launchDesign?.trim();
  if (designKey && CONVERSION_REFERENCE_BY_DESIGN[designKey]) {
    return CONVERSION_REFERENCE_BY_DESIGN[designKey];
  }

  const signKey = product.zodiacSign?.trim();
  if (signKey && CONVERSION_REFERENCE_BY_DESIGN[signKey]) {
    return CONVERSION_REFERENCE_BY_DESIGN[signKey];
  }

  const normalized = `${product.slug} ${product.name}`.toLowerCase();
  if (normalized.includes('dont-care') || normalized.includes("don't care")) {
    return CONVERSION_REFERENCE_BY_DESIGN['i-dont-care'];
  }
  if (normalized.includes('care')) return CONVERSION_REFERENCE_BY_DESIGN['i-care'];
  if (normalized.includes('walk') || normalized.includes('revolt')) {
    return CONVERSION_REFERENCE_BY_DESIGN['walk-alone'];
  }
  if (normalized.includes('rest') || normalized.includes('quiet')) {
    return CONVERSION_REFERENCE_BY_DESIGN['rest-your-mind'];
  }

  const hash = [...product.slug].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CONVERSION_REFERENCE_IMAGES[hash % CONVERSION_REFERENCE_IMAGES.length] ?? CONVERSION_REFERENCE_IMAGES[0];
}

export function isHomepageReferenceImageSrc(src: string | undefined): boolean {
  const value = src?.trim() ?? '';
  return value.includes('/images/homepage-reference/');
}

export function shouldUseConversionReferenceImage(src: string | undefined): boolean {
  const value = src?.trim().toLowerCase() ?? '';
  if (!value) return true;
  return (
    isGenericBrandPlaceholderSrc(src) ||
    isBackLikeProductImageSrc(src) ||
    value.endsWith('.svg') ||
    value.includes('/images/proof/') ||
    value.startsWith('http://localhost:9000/static/') ||
    value.startsWith('http://127.0.0.1:9000/static/')
  );
}

/**
 * Homepage / PLP card display URL — curated reference art until every drop has a tagged `card` front photo.
 */
export function preferHomeCardDisplaySrc(product: Product): string {
  const taggedCard = product.media?.card?.trim();
  if (
    taggedCard &&
    !isBackLikeProductImageSrc(taggedCard) &&
    !isGenericBrandPlaceholderSrc(taggedCard) &&
    !shouldUseConversionReferenceImage(taggedCard)
  ) {
    return taggedCard;
  }

  const picked = pickHomeCardImageSrc(product).trim();
  if (picked && !shouldUseConversionReferenceImage(picked)) {
    return picked;
  }

  return conversionReferenceImageForProduct(product);
}

export function getConversionProductCardImageSrc(product: Product, candidateSrc?: string): string {
  const src = candidateSrc?.trim() || getProductCardImageSrc(product);
  return shouldUseConversionReferenceImage(src) ? conversionReferenceImageForProduct(product) : src;
}

export type StorefrontImageSlot = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export type FeelingStorefrontImages = {
  cover: StorefrontImageSlot;
  hero: StorefrontImageSlot;
  proof: StorefrontImageSlot;
};

type OccasionStorefrontImages = {
  hero: StorefrontImageSlot;
  proof: StorefrontImageSlot;
};

const FALLBACK_OCCASION_VISUALS: OccasionStorefrontImages = {
  hero: {
    src: heroVectorizedV2,
    alt: 'HORO occasion collection — brand mark placeholder.',
    objectPosition: 'center 50%',
  },
  proof: {
    src: heroVectorizedV2,
    alt: 'HORO occasion proof — brand mark placeholder.',
    objectPosition: 'center 50%',
  },
};

export const STOREFRONT_IMAGE_SLOTS: {
  home: {
    hero: StorefrontImageSlot;
    proof: StorefrontImageSlot;
  };
  feelings: Record<string, FeelingStorefrontImages>;
  occasions: Record<string, OccasionStorefrontImages>;
  gifts: {
    proof: StorefrontImageSlot;
  };
  about: {
    hero: StorefrontImageSlot;
    bridge: StorefrontImageSlot;
  };
} = {
  home: {
    hero: {
      src: heroVectorizedV2,
      alt: 'HORO home hero — brand mark.',
      objectPosition: 'center 50%',
    },
    proof: {
      src: tee.studioTee,
      alt: 'Studio proof image of a HORO graphic tee with the artwork taking visual focus.',
      objectPosition: 'center 24%',
    },
  },
  feelings: {
    mood: {
      cover: {
        src: heroVectorizedV2,
        alt: 'Mood — HORO collection placeholder.',
        objectPosition: 'center 50%',
      },
      hero: {
        src: heroVectorizedV2,
        alt: 'Mood collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: tee.whiteFront,
        alt: 'Mood proof — HORO tee with quiet studio focus.',
        objectPosition: 'center 20%',
      },
    },
    zodiac: {
      cover: {
        src: heroVectorizedV2,
        alt: 'Zodiac — HORO collection placeholder.',
        objectPosition: 'center 50%',
      },
      hero: {
        src: heroVectorizedV2,
        alt: 'Zodiac collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: tee.relaxedFit,
        alt: 'Zodiac proof — relaxed-fit HORO tee.',
        objectPosition: 'center 18%',
      },
    },
    fiction: {
      cover: {
        src: heroVectorizedV2,
        alt: 'Fiction — HORO collection placeholder.',
        objectPosition: 'center 50%',
      },
      hero: {
        src: heroVectorizedV2,
        alt: 'Fiction collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: tee.studioTee,
        alt: 'Fiction proof — studio-lit HORO tee.',
        objectPosition: 'center 18%',
      },
    },
    career: {
      cover: {
        src: heroVectorizedV2,
        alt: 'Career — HORO collection placeholder.',
        objectPosition: 'center 50%',
      },
      hero: {
        src: heroVectorizedV2,
        alt: 'Career collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: tee.walkingStreet,
        alt: 'Career proof — city-led HORO styling.',
        objectPosition: 'center 24%',
      },
    },
    trends: {
      cover: {
        src: heroVectorizedV2,
        alt: 'Trends — HORO collection placeholder.',
        objectPosition: 'center 50%',
      },
      hero: {
        src: heroVectorizedV2,
        alt: 'Trends collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: tee.outdoorTee,
        alt: 'Trends proof — outdoor HORO styling.',
        objectPosition: 'center 22%',
      },
    },
  },
  occasions: {
    'gift-something-real': {
      hero: {
        src: heroVectorizedV2,
        alt: 'Gift Something Real collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: heroVectorizedV2,
        alt: 'Gift Something Real proof — HORO placeholder.',
        objectPosition: 'center 50%',
      },
    },
    'graduation-season': {
      hero: {
        src: heroVectorizedV2,
        alt: 'Graduation Season collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: heroVectorizedV2,
        alt: 'Graduation Season proof — HORO placeholder.',
        objectPosition: 'center 50%',
      },
    },
    'eid-and-ramadan': {
      hero: {
        src: heroVectorizedV2,
        alt: 'Eid and Ramadan collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: heroVectorizedV2,
        alt: 'Eid and Ramadan proof — HORO placeholder.',
        objectPosition: 'center 50%',
      },
    },
    'birthday-pick': {
      hero: {
        src: heroVectorizedV2,
        alt: 'Birthday Pick collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: heroVectorizedV2,
        alt: 'Birthday Pick proof — HORO placeholder.',
        objectPosition: 'center 50%',
      },
    },
    'just-because': {
      hero: {
        src: heroVectorizedV2,
        alt: 'Just Because collection — HORO placeholder.',
        objectPosition: 'center 50%',
      },
      proof: {
        src: heroVectorizedV2,
        alt: 'Just Because proof — HORO placeholder.',
        objectPosition: 'center 50%',
      },
    },
  },
  gifts: {
    proof: {
      src: '/images/cart/gift-wrap-story-card-preview.svg',
      alt: 'Preview of the HORO story card and gift wrap add-on.',
    },
  },
  about: {
    hero: {
      src: '/images/homepage-reference/our-story.png',
      alt: 'Group editorial image of young adults wearing HORO graphic tees, representing shared identity and belonging.',
      objectPosition: 'center 22%',
    },
    bridge: {
      src: '/images/homepage-reference/our-story-artist.png',
      alt: 'Editorial street image of a HORO graphic tee, bridging the brand story back into the collection.',
      objectPosition: 'center 24%',
    },
  },
};

/** Homepage hero asset path — brand vector placeholder until editorial photography ships. */
export const heroHomeTee = STOREFRONT_IMAGE_SLOTS.home.hero.src;
export const giftWrapPreview = STOREFRONT_IMAGE_SLOTS.gifts.proof.src;
export const aboutHero = STOREFRONT_IMAGE_SLOTS.about.hero.src;
export const aboutHeroAlt = STOREFRONT_IMAGE_SLOTS.about.hero.alt;
export const aboutBridgeImage = STOREFRONT_IMAGE_SLOTS.about.bridge.src;
export const aboutBridgeAlt = STOREFRONT_IMAGE_SLOTS.about.bridge.alt;
export const proofCards = {
  backFit: '/images/proof/back-fit-card.svg',
  macroDetail: '/images/proof/macro-detail-card.svg',
  fabricTag: '/images/proof/fabric-tag-card.svg',
  weightScale: '/images/proof/weight-scale-card.svg',
  washTest: '/images/proof/wash-test-card.svg',
} as const;

export const homeProofGallery = [
  {
    src: tee.studioTee,
    alt: 'Studio flat-lay proof image showing a HORO tee with the illustration taking visual priority.',
    objectPosition: 'center 22%',
    label: 'Flat lay',
  },
  {
    src: proofCards.weightScale,
    alt: 'Proof card showing the HORO fabric verification panel.',
    label: 'fabric proof',
  },
  {
    src: proofCards.washTest,
    alt: 'Proof card showing the HORO launch wash-check panel.',
    label: 'Wash check',
  },
] as const;

function firstNonEmptyString(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export function galleryItemSrc(item: ProductMediaGalleryItem | string | null | undefined): string | undefined {
  return productMediaGalleryItemSrc(item);
}

export function galleryItemsToSrcList(items: Array<ProductMediaGalleryItem | string> | null | undefined): string[] {
  return (items ?? []).map(galleryItemSrc).filter((value): value is string => Boolean(value));
}

function runtimeProductImage(productSlug: string): string | undefined {
  const product = getProduct(productSlug);
  return firstNonEmptyString(product?.media?.main, ...galleryItemsToSrcList(product?.media?.gallery), product?.thumbnail);
}

function firstRuntimeProductImage(productSlugs: string[]): string | undefined {
  for (const productSlug of productSlugs) {
    const image = runtimeProductImage(productSlug);
    if (image) {
      return image;
    }
  }

  return undefined;
}

function usableOccasionImageSrc(src: string | undefined): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;
  return shouldUseConversionReferenceImage(value) ? undefined : value;
}

function firstOccasionProductCardImage(occasionSlug: string): string | undefined {
  for (const product of productsByOccasion(occasionSlug)) {
    const src = getConversionProductCardImageSrc(product);
    if (src && !isGenericBrandPlaceholderSrc(src)) return src;
  }
  return undefined;
}

export function getFeelingCollectionVisual(slug: string): FeelingStorefrontImages {
  const feeling = getFeeling(slug);
  const productFallback = firstRuntimeProductImage(productsByFeeling(slug).map((product) => product.slug));
  /** No generic street hero as pillar “photography” — cover stays empty until Medusa feeling art or a real product image exists. */
  const coverSrc = firstNonEmptyString(feeling?.cardImageSrc, feeling?.heroImageSrc, productFallback) ?? '';
  const heroSrc = firstNonEmptyString(feeling?.heroImageSrc, feeling?.cardImageSrc, productFallback, coverSrc) ?? coverSrc;
  const proofSrc = firstNonEmptyString(heroSrc, coverSrc, productFallback, heroVectorizedV2) ?? heroVectorizedV2;
  const name = feeling?.name ?? slug.replace(/-/g, ' ');

  return {
    cover: {
      src: coverSrc,
      alt: firstNonEmptyString(feeling?.cardImageAlt, feeling?.heroImageAlt, `${name} collection cover`) ?? `${name} collection cover`,
    },
    hero: {
      src: heroSrc,
      alt: firstNonEmptyString(feeling?.heroImageAlt, feeling?.cardImageAlt, `${name} collection image`) ?? `${name} collection image`,
    },
    proof: {
      src: proofSrc,
      alt: firstNonEmptyString(feeling?.heroImageAlt, feeling?.cardImageAlt, `${name} category image`) ?? `${name} category image`,
    },
  };
}

/** @deprecated Use getFeelingCollectionVisual */
export const getVibeCollectionVisual = getFeelingCollectionVisual;

export function getSubfeelingCollectionVisual(slug: string): StorefrontImageSlot {
  const subfeeling = getSubfeeling(slug);
  const parentFeeling = subfeeling ? getFeeling(subfeeling.feelingSlug) : undefined;
  const subfeelingProductFallback = firstRuntimeProductImage(
    productsBySubfeeling(slug).map((product) => product.slug)
  );
  const parentFeelingFallback = parentFeeling
    ? firstRuntimeProductImage(productsByFeeling(parentFeeling.slug).map((product) => product.slug))
    : undefined;
  const src =
    firstNonEmptyString(
      subfeeling?.cardImageSrc,
      subfeeling?.heroImageSrc,
      subfeelingProductFallback,
      parentFeeling?.cardImageSrc,
      parentFeeling?.heroImageSrc,
      parentFeelingFallback,
      heroVectorizedV2
    ) ?? heroVectorizedV2;
  const name = subfeeling?.name ?? slug.replace(/-/g, ' ');

  return {
    src,
    alt:
      firstNonEmptyString(
        subfeeling?.cardImageAlt,
        subfeeling?.heroImageAlt,
        parentFeeling?.cardImageAlt,
        `${name} collection image`
      ) ?? `${name} collection image`,
  };
}

export function getOccasionCollectionVisual(slug: string): OccasionStorefrontImages {
  const occasion = getOccasion(slug);
  const slotVisuals = STOREFRONT_IMAGE_SLOTS.occasions[slug];
  const runtimeHeroSrc = usableOccasionImageSrc(occasion?.heroImageSrc);
  const runtimeProofSrc = usableOccasionImageSrc(occasion?.cardImageSrc);
  const productFallback = firstOccasionProductCardImage(slug);
  const giftFallback = occasion?.isGiftOccasion ? GIFT_PACKAGING_REFERENCE_IMAGE : undefined;
  const name = occasion?.name ?? slug.replace(/-/g, ' ');
  const heroSrc =
    firstNonEmptyString(
      runtimeHeroSrc,
      runtimeProofSrc,
      productFallback,
      giftFallback,
      usableOccasionImageSrc(slotVisuals?.hero.src),
      usableOccasionImageSrc(FALLBACK_OCCASION_VISUALS.hero.src),
    ) ?? heroVectorizedV2;
  const proofSrc =
    firstNonEmptyString(
      runtimeProofSrc,
      runtimeHeroSrc,
      productFallback,
      giftFallback,
      usableOccasionImageSrc(slotVisuals?.proof.src),
      heroSrc,
    ) ?? heroSrc;

  return {
    hero: {
      src: heroSrc,
      alt:
        firstNonEmptyString(
          occasion?.heroImageAlt,
          occasion?.cardImageAlt,
          slotVisuals?.hero.alt,
          `${name} collection image`,
        ) ?? `${name} collection image`,
      objectPosition: slotVisuals?.hero.objectPosition,
    },
    proof: {
      src: proofSrc,
      alt:
        firstNonEmptyString(
          occasion?.cardImageAlt,
          occasion?.heroImageAlt,
          slotVisuals?.proof.alt,
          `${name} occasion image`,
        ) ?? `${name} occasion image`,
      objectPosition: slotVisuals?.proof.objectPosition,
    },
  };
}

export function getFeelingsHubHeroTiles() {
  return getFeelings()
    .filter((feeling) => feeling.active !== false)
    .map((feeling, index) => ({ feeling, index }))
    .sort(
      (left, right) =>
        (left.feeling.sortOrder ?? left.index) - (right.feeling.sortOrder ?? right.index) ||
        left.index - right.index,
    )
    .map(({ feeling }) => {
      const { cover, hero, proof } = getFeelingCollectionVisual(feeling.slug);
      /** Hub uses `<img src>`; `cover` can be "" by design — fall back like proof does so src is never empty. */
      const src = firstNonEmptyString(cover.src, hero.src, proof.src) ?? heroVectorizedV2;
      return {
        slug: feeling.slug,
        ...cover,
        src,
      };
    });
}

export function getFeelingEditorialImagery(slug: string) {
  const visuals = getFeelingCollectionVisual(slug);
  return {
    wide: visuals.hero.src,
    detail: visuals.proof.src,
  };
}

export const PDP_VIEW_ORDER = [
  'hero',
  'gallery-1',
  'gallery-2',
  'gallery-3',
  'gallery-4',
  'gallery-5',
  'gallery-6',
  'gallery-7',
] as const;

/** PDP gallery tag order — align with medusa-backend `PDP_GALLERY_TAG_PRIORITY`. */
export const PDP_GALLERY_TAG_PRIORITY: NonNullable<ProductMediaGalleryItem['tag']>[] = [
  'lifestyle',
  'artwork_detail',
  'proof_print',
  'proof_fabric',
  'proof_wash',
  'back',
  'gift',
  'flat_lay',
];

const PDP_GALLERY_LABELS = ['front', 'model', 'detail', 'fabric', 'print proof', 'back', 'gift', 'flat lay'] as const;

export type ProductPdpViewKey = (typeof PDP_VIEW_ORDER)[number];

export type ProductPdpGalleryView = {
  key: ProductPdpViewKey;
  src: string;
  label: string;
  alt: string;
};

export type ProductMedia = {
  gallery?: string[];
  main: string;
};

const FALLBACK_PRODUCT_GALLERY = [heroVectorizedV2, proofCards.macroDetail, proofCards.weightScale];

const PDP_INFOGRAPHIC_IMAGE_PATTERN =
  /(proof|story-card|size-guide|weight-scale|wash-test|macro-detail|fabric-tag|_card|\/cards?\/)/i;

/** Fallback when tags are missing — prefer explicit drop tags over URL guessing. */
const BACK_LIKE_URL_PATTERN = /(?:^|[/_-])(back|rear|backview|back-view)(?:[/_\-.]|$)/i;
const FLAT_LAY_URL_PATTERN = /(?:^|[/_-])flat[-_]?lay(?:[/_\-.]|$)/i;
const PLAIN_GARMENT_URL_PATTERN =
  /(?:^|[/_-])(?:plain|blank|white[-_]?tee|garment[-_]?only|undecorated|no[-_]?print|tee[-_]?only|mock[-_]?blank|studio[-_]?blank)(?:[/_\-.]|$)/i;

function isUnsafeHomeCardUrl(src: string): boolean {
  return BACK_LIKE_URL_PATTERN.test(src) || FLAT_LAY_URL_PATTERN.test(src);
}

/** Exported for gift/editorial sections that must not use back/flat-lay fallbacks. */
export function isBackLikeProductImageSrc(src: string | undefined): boolean {
  const value = src?.trim();
  return value ? isUnsafeHomeCardUrl(value) : false;
}

/** Plain garment / blank tee — must not lead PDP or conversion cards. */
export function isPlainGarmentProductImageSrc(src: string | undefined): boolean {
  const value = src?.trim();
  if (!value) return false;
  return PLAIN_GARMENT_URL_PATTERN.test(value);
}

/** Catalog URL suitable as a graphic-forward PDP/card lead (not back, plain, or brand placeholder). */
export function isGraphicForwardCatalogImageSrc(src: string | undefined): boolean {
  const value = src?.trim();
  if (!value) return false;
  if (
    isBackLikeProductImageSrc(value) ||
    isPlainGarmentProductImageSrc(value) ||
    isGenericBrandPlaceholderSrc(value) ||
    isHomepageReferenceImageSrc(value)
  ) {
    return false;
  }
  if (PDP_INFOGRAPHIC_IMAGE_PATTERN.test(value)) return false;
  return true;
}

function isUnsafeHomeCardGalleryItem(item: ProductMediaGalleryItem | string): boolean {
  if (typeof item === 'string') {
    return isUnsafeHomeCardUrl(item);
  }
  if (item.tag === 'back' || item.tag === 'flat_lay') {
    return true;
  }
  const url = galleryItemSrc(item);
  return url ? isUnsafeHomeCardUrl(url) : true;
}

function isPrivateImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return true;
  }
  if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.')) {
    return true;
  }
  return false;
}

function galleryUrlByTag(
  product: Product,
  tag: ProductMediaGalleryItem['tag'],
): string | undefined {
  if (!tag) return undefined;
  for (const item of product.media?.gallery ?? []) {
    if (typeof item === 'string') continue;
    if (item.tag !== tag) continue;
    if (isUnsafeHomeCardGalleryItem(item)) continue;
    const url = galleryItemSrc(item);
    if (url && !isUnsafeHomeCardUrl(url)) return url;
  }
  return undefined;
}

/**
 * Unsplash-style transform params are only safe on hosts that honor them.
 * Medusa/R2/CDN URLs often break or ignore `w`/`fit` query params.
 */
function shouldAppendUnsplashStyleParams(src: string): boolean {
  const t = src.trim();
  if (!t.startsWith('http://') && !t.startsWith('https://')) {
    return false;
  }
  try {
    const host = new URL(t).hostname.toLowerCase();
    return host === 'images.unsplash.com' || host.endsWith('.unsplash.com') || host === 'unsplash.com';
  } catch {
    return false;
  }
}

export function imgUrl(src: string, w: number) {
  if (!shouldAppendUnsplashStyleParams(src)) {
    return src;
  }
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
}

/**
 * Prefix root-relative file URLs from Medusa (`/static/...`) with `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
 * so the browser does not request them from the storefront origin.
 */
export function resolveProductImageSrcForDisplay(src: string): string {
  const t = src.trim();
  if (!t) return t;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/static/') && !t.startsWith('//')) {
    const base = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL : '') || '';
    const origin = base.replace(/\/+$/, '');
    if (origin) return `${origin}${t}`;
  }
  return t;
}

/**
 * `next/image` only loads hosts listed in `next.config` `images.remotePatterns`. Catalog photos
 * often use S3/R2/CDN domains that are not listed; the browser's `<img>` has no such restriction.
 */
export function useNextImageOptimizerForSrc(resolvedSrc: string): boolean {
  const t = resolvedSrc.trim();
  if (!t) return false;
  if (t.toLowerCase().endsWith('.svg')) {
    return false;
  }
  if (t.startsWith('/') && !t.startsWith('//')) {
    return true;
  }
  if (shouldAppendUnsplashStyleParams(t)) {
    return true;
  }

  try {
    const url = new URL(t);
    const configuredHosts = new Set([
      'horo5-production.up.railway.app',
      'localhost:9000',
      '127.0.0.1:9000',
    ]);
    const medusaBase =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''
        : '';
    if (medusaBase) {
      try {
        configuredHosts.add(new URL(medusaBase).host);
      } catch {
        /* ignore invalid env */
      }
    }
    const extraHosts =
      typeof process !== 'undefined'
        ? (process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS || '')
            .split(',')
            .map((part) => part.trim().replace(/^https?:\/\//, '').split('/')[0])
            .filter(Boolean)
        : [];
    for (const host of extraHosts) configuredHosts.add(host);

    if (isPrivateImageHost(url.hostname)) {
      return false;
    }

    return configuredHosts.has(url.host);
  } catch {
    return false;
  }
}

export function getProductMedia(slug: string): ProductMedia {
  const product = getProduct(slug);
  const runtimeGallery = galleryItemsToSrcList(product?.media?.gallery);
  const main = product?.media?.main ?? runtimeGallery[0] ?? product?.thumbnail ?? FALLBACK_PRODUCT_GALLERY[0];

  return {
    gallery: runtimeGallery.length > 0 ? runtimeGallery : FALLBACK_PRODUCT_GALLERY,
    main,
  };
}

/**
 * Homepage / PLP card image — media contract:
 * card → main → lifestyle → artwork_detail → first safe gallery → thumbnail → feeling proof.
 */
function backTaggedGalleryUrls(product: Product): Set<string> {
  const urls = new Set<string>();
  for (const item of product.media?.gallery ?? []) {
    if (typeof item === 'string') continue;
    if (item.tag !== 'back' && item.tag !== 'flat_lay') continue;
    const url = galleryItemSrc(item);
    if (url) urls.add(url);
  }
  return urls;
}

function isBlockedHomeCardSrc(src: string, backTaggedUrls: Set<string>): boolean {
  return isUnsafeHomeCardUrl(src) || backTaggedUrls.has(src);
}

export function pickHomeCardImageSrc(product: Product): string {
  const backTaggedUrls = backTaggedGalleryUrls(product);

  const card = product.media?.card?.trim();
  if (card && !isBlockedHomeCardSrc(card, backTaggedUrls)) return card;

  const main = product.media?.main?.trim();
  if (main && !isBlockedHomeCardSrc(main, backTaggedUrls)) return main;

  const lifestyle = galleryUrlByTag(product, 'lifestyle');
  if (lifestyle) return lifestyle;

  const artworkDetail = galleryUrlByTag(product, 'artwork_detail');
  if (artworkDetail) return artworkDetail;

  for (const item of product.media?.gallery ?? []) {
    if (isUnsafeHomeCardGalleryItem(item)) continue;
    const url = galleryItemSrc(item);
    if (url && !isUnsafeHomeCardUrl(url)) return url;
  }

  const thumb = product.thumbnail?.trim();
  if (thumb && !isUnsafeHomeCardUrl(thumb)) return thumb;

  const feelingSlug = product.primaryFeelingSlug ?? product.feelingSlug;
  const feelingProof = feelingSlug ? STOREFRONT_IMAGE_SLOTS.feelings[feelingSlug]?.proof?.src : undefined;
  if (feelingProof && feelingProof !== heroVectorizedV2) return feelingProof;

  return interimCardImageForSlug(product.slug);
}

export function getProductCardImageSrc(product: Product): string {
  const primary = pickHomeCardImageSrc(product);
  if (primary && primary !== FALLBACK_PRODUCT_GALLERY[0] && primary !== heroVectorizedV2) {
    return primary;
  }
  return interimCardImageForSlug(product.slug);
}

/** Secondary PLP hover image when gallery has a second slot (P2). */
export function getProductCardHoverImageSrc(product: Product): string | null {
  const primary = pickHomeCardImageSrc(product);
  const lifestyle = galleryUrlByTag(product, 'lifestyle');
  if (lifestyle && lifestyle !== primary) return lifestyle;
  const gallery = galleryItemsToSrcList(product.media?.gallery);
  const secondary = gallery.find((src) => src !== primary && !isUnsafeHomeCardUrl(src));
  if (!secondary || secondary === heroVectorizedV2) return null;
  return secondary;
}

export function getProductComparisonImageSrc(product: Product): string {
  return (
    firstNonEmptyString(
      product.media?.main,
      product.thumbnail,
      ...galleryItemsToSrcList(product.media?.gallery),
      product.media?.card,
      FALLBACK_PRODUCT_GALLERY[0],
    ) ?? FALLBACK_PRODUCT_GALLERY[0]
  );
}

function isSafePdpGalleryUrl(src: string | undefined): boolean {
  const value = src?.trim();
  if (!value) return false;
  return !isHomepageReferenceImageSrc(value) && !PDP_INFOGRAPHIC_IMAGE_PATTERN.test(value);
}

function sortPdpGallerySources(urls: string[]): string[] {
  const graphicForward: string[] = [];
  const neutral: string[] = [];
  const plainGarment: string[] = [];
  const backLike: string[] = [];

  for (const url of urls) {
    if (isBackLikeProductImageSrc(url)) {
      backLike.push(url);
    } else if (isPlainGarmentProductImageSrc(url)) {
      plainGarment.push(url);
    } else if (isGraphicForwardCatalogImageSrc(url)) {
      graphicForward.push(url);
    } else {
      neutral.push(url);
    }
  }

  return [...graphicForward, ...neutral, ...plainGarment, ...backLike];
}

/** PDP hero when catalog only has plain/placeholder URLs — curated reference art. */
export function pdpConversionLeadImageForProduct(product: Product): string {
  return conversionReferenceImageForProduct(product);
}

/** Collect PDP URLs in tag order; excludes homepage reference art. */
export function collectPdpGallerySources(product: Product): string[] {
  const urls: string[] = [];
  const push = (src: string | undefined) => {
    const value = src?.trim();
    if (!value || !isSafePdpGalleryUrl(value)) return;
    if (urls.includes(value)) return;
    urls.push(value);
  };

  const main = product.media?.main?.trim();
  const card = product.media?.card?.trim();
  if (main && !isBackLikeProductImageSrc(main)) {
    push(main);
  } else if (card && !isBackLikeProductImageSrc(card)) {
    push(card);
  }

  for (const tag of PDP_GALLERY_TAG_PRIORITY) {
    for (const item of product.media?.gallery ?? []) {
      if (typeof item === 'string') continue;
      if (item.tag !== tag) continue;
      push(galleryItemSrc(item));
    }
  }

  for (const item of product.media?.gallery ?? []) {
    push(galleryItemSrc(item));
  }

  push(product.thumbnail ?? undefined);

  const ordered = sortPdpGallerySources(urls);
  const lead = ordered.find((url) => isGraphicForwardCatalogImageSrc(url));
  if (!lead) {
    const referenceLead = pdpConversionLeadImageForProduct(product);
    if (referenceLead && !ordered.includes(referenceLead)) {
      return [referenceLead, ...ordered];
    }
  }

  return ordered;
}

function buildProductPdpGalleryFromSources(
  productName: string,
  sources: string[],
): ProductPdpGalleryView[] {
  const gallerySources = sources.length > 0 ? sources : FALLBACK_PRODUCT_GALLERY;

  return gallerySources.map((src, index) => ({
    alt: `HORO “${productName}” gallery image ${index + 1}.`,
    key: (PDP_VIEW_ORDER[index] ?? `gallery-${index}`) as ProductPdpViewKey,
    label: PDP_GALLERY_LABELS[index] ?? (index === 0 ? 'hero image' : `gallery image ${index + 1}`),
    src,
  }));
}

export function buildProductPdpGalleryFromProduct(
  productName: string,
  product: Product,
): ProductPdpGalleryView[] {
  return buildProductPdpGalleryFromSources(productName, collectPdpGallerySources(product));
}

export function buildProductPdpGallery(productName: string, media: ProductMedia): ProductPdpGalleryView[] {
  const ordered = Array.from(new Set([media.main, ...(media.gallery ?? [])].filter(Boolean))).filter(
    (src) => isSafePdpGalleryUrl(src),
  );

  if (ordered.length > 1 && isBackLikeProductImageSrc(ordered[0])) {
    const frontIndex = ordered.findIndex((url) => !isBackLikeProductImageSrc(url));
    if (frontIndex > 0) {
      const [front] = ordered.splice(frontIndex, 1);
      ordered.unshift(front);
    }
  }

  return buildProductPdpGalleryFromSources(productName, ordered);
}

export function getProductPdpGallery(productName: string, slug: string): ProductPdpGalleryView[] {
  const product = getProduct(slug);
  if (product) {
    return buildProductPdpGalleryFromProduct(productName, product);
  }
  return buildProductPdpGallery(productName, getProductMedia(slug));
}
