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

/** Hero: urban, warm, model in tee */
export const heroStreet = '/images/tees/tee_walking_street.png';

/** Home hero: secondary vector artwork */
export const heroVectorizedV2 = '/images/hero/horo_vectorized_v2.svg';

/** Home hero: model-led editorial cutout */
export const heroModelHome = '/images/hero/hero-model.png';

/** Models in tees / streetwear — varied angles (used across vibes & PDP) */
export const tee = {
  whiteFront: '/images/tees/bg_tee_white_front.png',
  womanSmile: '/images/tees/bg_vibe_emotions.png',
  womanStreet: '/images/tees/bg_tee_woman_street.png',
  manCasual: '/images/tees/bg_tee_man_casual.png',
  womanUrban: '/images/tees/bg_vibe_fictious.png',
  walkingStreet: '/images/tees/tee_walking_street.png',
  yellowTee: '/images/tees/bg_vibe_trends.png',
  relaxedFit: '/images/tees/bg_vibe_career.png',
  studioTee: '/images/tees/bg_tee_studio_tee.png',
  friendsTees: '/images/tees/bg_tee_friends_tees.png',
  flatLayStyle: '/images/tees/bg_tee_flatlay.png',
  outdoorTee: '/images/tees/bg_tee_outdoor.png',
  streetPose: '/images/tees/bg_vibe_zodiac.png',
} as const;

/** Generated AI assets for new products */
export const newTees = {
  emotions1: '/images/tees/emotions_vibe_1_1774374034307.png',
  emotions2: '/images/tees/emotions_vibe_2_1774374055078.png',
  emotions3: '/images/tees/emotions_vibe_3_1774374073378.png',
  emotions4: '/images/tees/emotions_vibe_4_1774374088034.png',
  emotions5: '/images/tees/emotions_vibe_5_1774374107073.png',
  zodiac1: '/images/tees/zodiac_vibe_1_1774374128029.png',
  zodiac2: '/images/tees/zodiac_vibe_2_1774374153203.png',
  zodiac3: '/images/tees/zodiac_vibe_3_1774374174567.png',
  zodiac4: '/images/tees/zodiac_vibe_4_1774374196317.png',
  zodiac5: '/images/tees/zodiac_vibe_5_1774374214170.png',
  fiction1: '/images/tees/fiction_vibe_1_1774374247152.png',
  fiction2: '/images/tees/fiction_vibe_2_1774374267156.png',
  fiction3: '/images/tees/fiction_vibe_3_1774374284774.png',
  fiction4: '/images/tees/fiction_vibe_4_1774374302082.png',
  fiction5: '/images/tees/fiction_vibe_5_1774374319387.png',
  career1: '/images/tees/career_vibe_1_1774374340994.png',
  career2: '/images/tees/career_vibe_2_1774374359412.png',
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
    src: heroStreet,
    alt: 'HORO occasion collection hero — editorial styling in a graphic tee.',
    objectPosition: 'center 24%',
  },
  proof: {
    src: heroStreet,
    alt: 'HORO occasion proof image — editorial styling in a graphic tee.',
    objectPosition: 'center 24%',
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
      src: heroModelHome,
      alt: 'HORO home hero — editorial model wearing a HORO graphic tee.',
      objectPosition: 'center 18%',
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
        src: '/images/tees/bg_vibe_emotions.png',
        alt: 'Mood — calm editorial styling in a HORO tee.',
        objectPosition: 'center 24%',
      },
      hero: {
        src: '/images/tees/bg_vibe_emotions.png',
        alt: 'Mood collection — reflective emotional energy, HORO tee.',
        objectPosition: 'center 24%',
      },
      proof: {
        src: tee.whiteFront,
        alt: 'Mood proof — HORO tee with quiet studio focus.',
        objectPosition: 'center 20%',
      },
    },
    zodiac: {
      cover: {
        src: '/images/tees/bg_vibe_zodiac.png',
        alt: 'Zodiac — gift-ready editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      hero: {
        src: '/images/tees/bg_vibe_zodiac.png',
        alt: 'Zodiac collection hero — thoughtful gifting mood.',
        objectPosition: 'center 18%',
      },
      proof: {
        src: tee.relaxedFit,
        alt: 'Zodiac proof — relaxed-fit HORO tee.',
        objectPosition: 'center 18%',
      },
    },
    fiction: {
      cover: {
        src: '/images/tees/bg_vibe_fictious.png',
        alt: 'Fiction — expressive editorial styling in a HORO tee.',
        objectPosition: 'center 26%',
      },
      hero: {
        src: '/images/tees/bg_vibe_fictious.png',
        alt: 'Fiction collection hero — character-led HORO tee.',
        objectPosition: 'center 26%',
      },
      proof: {
        src: tee.studioTee,
        alt: 'Fiction proof — studio-lit HORO tee.',
        objectPosition: 'center 18%',
      },
    },
    career: {
      cover: {
        src: '/images/tees/bg_vibe_career.png',
        alt: 'Career — repeat-wear editorial styling in a HORO tee.',
        objectPosition: 'center 20%',
      },
      hero: {
        src: '/images/tees/bg_vibe_career.png',
        alt: 'Career collection hero — daily confidence.',
        objectPosition: 'center 20%',
      },
      proof: {
        src: tee.walkingStreet,
        alt: 'Career proof — city-led HORO styling.',
        objectPosition: 'center 24%',
      },
    },
    trends: {
      cover: {
        src: '/images/tees/bg_vibe_trends.png',
        alt: 'Trends — going-out editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      hero: {
        src: '/images/tees/bg_vibe_trends.png',
        alt: 'Trends collection hero — visible statement.',
        objectPosition: 'center 18%',
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
        src: '/images/tees/bg_tee_friends_tees.png',
        alt: 'Gift Something Real collection hero — warm group styling in HORO graphic tees.',
        objectPosition: 'center 22%',
      },
      proof: {
        src: '/images/tees/bg_tee_friends_tees.png',
        alt: 'Gift Something Real proof image — gift-ready HORO styling with a shared moment.',
        objectPosition: 'center 20%',
      },
    },
    'graduation-season': {
      hero: {
        src: tee.relaxedFit,
        alt: 'Graduation Season collection hero — HORO tee styled with a polished, ambitious look.',
        objectPosition: 'center 16%',
      },
      proof: {
        src: '/images/tees/bg_vibe_career.png',
        alt: 'Graduation Season proof image — confident career-led HORO styling for milestone gifting.',
        objectPosition: 'center 18%',
      },
    },
    'eid-and-ramadan': {
      hero: {
        src: tee.streetPose,
        alt: 'Eid and Ramadan collection hero — close editorial styling for a seasonal HORO tee.',
        objectPosition: 'center 22%',
      },
      proof: {
        src: tee.studioTee,
        alt: 'Eid and Ramadan proof image — expressive seasonal HORO styling for meaningful gifting.',
        objectPosition: 'center 20%',
      },
    },
    'birthday-pick': {
      hero: {
        src: '/images/tees/bg_tee_man_casual.png',
        alt: 'Birthday Pick collection hero — editorial portrait of a model wearing a HORO tee.',
        objectPosition: 'center 18%',
      },
      proof: {
        src: '/images/tees/bg_tee_man_casual.png',
        alt: 'Birthday Pick proof image — personality-led HORO styling for an easy gift decision.',
        objectPosition: 'center 18%',
      },
    },
    'just-because': {
      hero: {
        src: '/images/tees/bg_tee_outdoor.png',
        alt: 'Just Because collection hero — relaxed self-treat styling in a HORO tee.',
        objectPosition: 'center 22%',
      },
      proof: {
        src: '/images/tees/bg_tee_outdoor.png',
        alt: 'Just Because proof image — relaxed HORO styling for an everyday self-treat.',
        objectPosition: 'center 22%',
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

/**
 * Homepage hero — full-bleed model in tee (warm, editorial).
 */
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
  const coverSrc = firstNonEmptyString(feeling?.cardImageSrc, feeling?.heroImageSrc, productFallback, heroStreet) ?? heroStreet;
  const heroSrc = firstNonEmptyString(feeling?.heroImageSrc, feeling?.cardImageSrc, productFallback, coverSrc) ?? coverSrc;
  const proofSrc = firstNonEmptyString(heroSrc, coverSrc, productFallback, heroStreet) ?? heroStreet;
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
      heroStreet
    ) ?? heroStreet;
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
  return getFeelings().map((feeling) => ({
    slug: feeling.slug,
    ...getFeelingCollectionVisual(feeling.slug).cover,
  }));
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

const FALLBACK_PRODUCT_GALLERY = [
  tee.studioTee,
  tee.flatLayStyle,
  tee.walkingStreet,
  proofCards.macroDetail,
];

export function imgUrl(src: string, w: number) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
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
    alt: `HORO “${productName}” t-shirt gallery image ${index + 1}.`,
    key: (PDP_VIEW_ORDER[index] ?? `gallery-${index}`) as ProductPdpViewKey,
    label: index === 0 ? 'hero image' : `gallery image ${index + 1}`,
    src,
  }));
}

export function getProductPdpGallery(productName: string, slug: string): ProductPdpGalleryView[] {
  return buildProductPdpGallery(productName, getProductMedia(slug));
}
