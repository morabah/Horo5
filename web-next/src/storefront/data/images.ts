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
  productsBySubfeeling,
} from './site.ts';

/** On-brand vector mark — default storefront slot fill until Cairo photography ships (§3.4). */
export const heroVectorizedV2 = '/images/hero/horo_vectorized_v2.svg';

/**
 * Named slot paths for layouts — all point at the brand vector until real product/lifestyle photography exists.
 */
export const tee = {
  whiteFront: heroVectorizedV2,
  womanSmile: heroVectorizedV2,
  womanStreet: heroVectorizedV2,
  manCasual: heroVectorizedV2,
  womanUrban: heroVectorizedV2,
  walkingStreet: heroVectorizedV2,
  yellowTee: heroVectorizedV2,
  relaxedFit: heroVectorizedV2,
  studioTee: heroVectorizedV2,
  friendsTees: heroVectorizedV2,
  flatLayStyle: heroVectorizedV2,
  outdoorTee: heroVectorizedV2,
  streetPose: heroVectorizedV2,
} as const;

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
      src: tee.friendsTees,
      alt: 'Group editorial image of young adults wearing HORO graphic tees, representing shared identity and belonging.',
      objectPosition: 'center 22%',
    },
    bridge: {
      src: tee.walkingStreet,
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
    alt: 'Proof card showing the HORO 220 GSM verification panel.',
    label: '220 GSM proof',
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

function runtimeProductImage(productSlug: string): string | undefined {
  const product = getProduct(productSlug);
  return firstNonEmptyString(product?.media?.main, ...(product?.media?.gallery ?? []), product?.thumbnail);
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
  const runtimeVisuals =
    occasion?.cardImageSrc || occasion?.heroImageSrc
      ? {
          hero: {
            src: occasion.heroImageSrc ?? occasion.cardImageSrc,
            alt: occasion.heroImageAlt,
          },
          proof: {
            src: occasion.cardImageSrc ?? occasion.heroImageSrc,
            alt: occasion.cardImageAlt,
          },
        }
      : null;

  return runtimeVisuals ?? STOREFRONT_IMAGE_SLOTS.occasions[slug] ?? FALLBACK_OCCASION_VISUALS;
}

export function getFeelingsHubHeroTiles() {
  return getFeelings().map((feeling) => {
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
  if (t.startsWith('/') && !t.startsWith('//')) {
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
  if (t.startsWith('/') && !t.startsWith('//')) {
    return true;
  }
  return shouldAppendUnsplashStyleParams(t);
}

export function getProductMedia(slug: string): ProductMedia {
  const product = getProduct(slug);
  const runtimeGallery = product?.media?.gallery?.filter(Boolean) ?? [];
  const main = product?.media?.main ?? runtimeGallery[0] ?? product?.thumbnail ?? FALLBACK_PRODUCT_GALLERY[0];

  return {
    gallery: runtimeGallery.length > 0 ? runtimeGallery : FALLBACK_PRODUCT_GALLERY,
    main,
  };
}

export function buildProductPdpGallery(productName: string, media: ProductMedia): ProductPdpGalleryView[] {
  const ordered = Array.from(new Set([media.main, ...(media.gallery ?? [])].filter(Boolean)));

  return ordered.map((src, index) => ({
    alt: `HORO “${productName}” gallery image ${index + 1}.`,
    key: (PDP_VIEW_ORDER[index] ?? `gallery-${index}`) as ProductPdpViewKey,
    label: index === 0 ? 'hero image' : `gallery image ${index + 1}`,
    src,
  }));
}

export function getProductPdpGallery(productName: string, slug: string): ProductPdpGalleryView[] {
  return buildProductPdpGallery(productName, getProductMedia(slug));
}
