/**
 * Local storefront imagery. Phase 2 standardizes these into named storefront slots
 * so page sections stop pulling from an ad hoc shared pool.
 */

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

type VibeStorefrontImages = {
  cover: StorefrontImageSlot;
  hero: StorefrontImageSlot;
  proof: StorefrontImageSlot;
};

type OccasionStorefrontImages = {
  hero: StorefrontImageSlot;
  proof: StorefrontImageSlot;
};

const FALLBACK_VIBE_VISUALS: VibeStorefrontImages = {
  cover: {
    src: heroStreet,
    alt: 'HORO vibe cover — editorial styling in a graphic tee.',
    objectPosition: 'center 24%',
  },
  hero: {
    src: heroStreet,
    alt: 'HORO vibe collection hero — editorial styling in a graphic tee.',
    objectPosition: 'center 24%',
  },
  proof: {
    src: heroStreet,
    alt: 'HORO vibe proof image — editorial styling in a graphic tee.',
    objectPosition: 'center 24%',
  },
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
  vibes: Record<string, VibeStorefrontImages>;
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
  vibes: {
    emotions: {
      cover: {
        src: '/images/tees/bg_vibe_emotions.png',
        alt: 'Emotions vibe — expressive editorial styling in a HORO tee.',
        objectPosition: 'center 24%',
      },
      hero: {
        src: '/images/tees/bg_vibe_emotions.png',
        alt: 'Emotions collection hero — expressive editorial styling in a HORO tee.',
        objectPosition: 'center 24%',
      },
      proof: {
        src: tee.whiteFront,
        alt: 'Emotions collection proof image — a HORO tee styled with quiet studio focus.',
        objectPosition: 'center 20%',
      },
    },
    zodiac: {
      cover: {
        src: '/images/tees/bg_vibe_zodiac.png',
        alt: 'Zodiac vibe — cosmic editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      hero: {
        src: '/images/tees/bg_vibe_zodiac.png',
        alt: 'Zodiac collection hero — cosmic editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      proof: {
        src: tee.relaxedFit,
        alt: 'Zodiac collection proof image — relaxed-fit HORO tee with celestial mood.',
        objectPosition: 'center 18%',
      },
    },
    fiction: {
      cover: {
        src: '/images/tees/bg_vibe_fictious.png',
        alt: 'Fiction vibe — story-led editorial styling in a HORO tee.',
        objectPosition: 'center 26%',
      },
      hero: {
        src: '/images/tees/bg_vibe_fictious.png',
        alt: 'Fiction collection hero — story-led editorial styling in a HORO tee.',
        objectPosition: 'center 26%',
      },
      proof: {
        src: tee.studioTee,
        alt: 'Fiction collection proof image — studio-lit HORO tee with story-led artwork.',
        objectPosition: 'center 18%',
      },
    },
    career: {
      cover: {
        src: '/images/tees/bg_vibe_career.png',
        alt: 'Career vibe — grounded editorial styling in a HORO tee.',
        objectPosition: 'center 20%',
      },
      hero: {
        src: '/images/tees/bg_vibe_career.png',
        alt: 'Career collection hero — grounded editorial styling in a HORO tee.',
        objectPosition: 'center 20%',
      },
      proof: {
        src: tee.walkingStreet,
        alt: 'Career collection proof image — city-led HORO styling with polished momentum.',
        objectPosition: 'center 24%',
      },
    },
    trends: {
      cover: {
        src: '/images/tees/bg_vibe_trends.png',
        alt: 'Trends vibe — street-led editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      hero: {
        src: '/images/tees/bg_vibe_trends.png',
        alt: 'Trends collection hero — street-led editorial styling in a HORO tee.',
        objectPosition: 'center 18%',
      },
      proof: {
        src: tee.outdoorTee,
        alt: 'Trends collection proof image — outdoor HORO styling with modern streetwear energy.',
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

/**
 * Editorial wide + detail per vibe — every shot is a model wearing a t-shirt,
 * chosen to match the vibe (mood / night-out / bold graphic / pro casual / street trend).
 */
export const vibeEditorialImagery: Record<string, { wide: string; detail: string }> = {
  emotions: {
    wide: STOREFRONT_IMAGE_SLOTS.vibes.emotions.hero.src,
    detail: STOREFRONT_IMAGE_SLOTS.vibes.emotions.proof.src,
  },
  zodiac: {
    wide: STOREFRONT_IMAGE_SLOTS.vibes.zodiac.hero.src,
    detail: STOREFRONT_IMAGE_SLOTS.vibes.zodiac.proof.src,
  },
  fiction: {
    wide: STOREFRONT_IMAGE_SLOTS.vibes.fiction.hero.src,
    detail: STOREFRONT_IMAGE_SLOTS.vibes.fiction.proof.src,
  },
  career: {
    wide: STOREFRONT_IMAGE_SLOTS.vibes.career.hero.src,
    detail: STOREFRONT_IMAGE_SLOTS.vibes.career.proof.src,
  },
  trends: {
    wide: STOREFRONT_IMAGE_SLOTS.vibes.trends.hero.src,
    detail: STOREFRONT_IMAGE_SLOTS.vibes.trends.proof.src,
  },
};

/** Vibe listing cards — same wide image as editorial for consistency */
export const vibeCovers: Record<string, string> = {
  emotions: STOREFRONT_IMAGE_SLOTS.vibes.emotions.cover.src,
  zodiac: STOREFRONT_IMAGE_SLOTS.vibes.zodiac.cover.src,
  fiction: STOREFRONT_IMAGE_SLOTS.vibes.fiction.cover.src,
  career: STOREFRONT_IMAGE_SLOTS.vibes.career.cover.src,
  trends: STOREFRONT_IMAGE_SLOTS.vibes.trends.cover.src,
};

export const vibesHubHeroTiles = [
  {
    slug: 'emotions',
    ...STOREFRONT_IMAGE_SLOTS.vibes.emotions.cover,
  },
  {
    slug: 'zodiac',
    ...STOREFRONT_IMAGE_SLOTS.vibes.zodiac.cover,
  },
  {
    slug: 'fiction',
    ...STOREFRONT_IMAGE_SLOTS.vibes.fiction.cover,
  },
  {
    slug: 'career',
    ...STOREFRONT_IMAGE_SLOTS.vibes.career.cover,
  },
  {
    slug: 'trends',
    ...STOREFRONT_IMAGE_SLOTS.vibes.trends.cover,
  },
] as const;

export function getVibeCollectionVisual(slug: string): VibeStorefrontImages {
  return STOREFRONT_IMAGE_SLOTS.vibes[slug] ?? FALLBACK_VIBE_VISUALS;
}

export function getOccasionCollectionVisual(slug: string): OccasionStorefrontImages {
  return STOREFRONT_IMAGE_SLOTS.occasions[slug] ?? FALLBACK_OCCASION_VISUALS;
}

export const PDP_VIEW_ORDER = [
  'frontOnBody',
  'backOnBody',
  'macroDetail',
  'fabricTag',
  'flatLay',
  'lifestyle',
  'weightScale',
  'washTest',
] as const;

export type ProductPdpViewKey = (typeof PDP_VIEW_ORDER)[number];

export type ProductPdpViewMap = Partial<Record<ProductPdpViewKey, string>>;

export type ProductPdpGalleryView = {
  key: ProductPdpViewKey;
  src: string;
  label: string;
  alt: string;
};

export type ProductMedia = {
  main: string;
  pdp: ProductPdpViewMap;
};

const PDP_VIEW_LABELS: Record<ProductPdpViewKey, string> = {
  frontOnBody: 'front on-body',
  backOnBody: 'back fit card',
  macroDetail: 'print proof',
  fabricTag: 'fabric and tag',
  flatLay: 'flat lay',
  lifestyle: 'lifestyle',
  weightScale: 'weight proof',
  washTest: 'wash check',
};

const PDP_VIEW_ALTS: Record<ProductPdpViewKey, string> = {
  frontOnBody: 'front on-body view of the full tee',
  backOnBody: 'back fit verification card used until the real back view is photographed',
  macroDetail: 'print texture proof card used until the macro shot is photographed',
  fabricTag: 'fabric and tag proof card used until the inside-label shot is photographed',
  flatLay: 'flat lay on a warm studio surface',
  lifestyle: 'styled in an everyday street setting',
  weightScale: '220 GSM verification proof card',
  washTest: 'launch wash-check proof card',
};

function product(main: string, pdp: ProductPdpViewMap): ProductMedia {
  return { main, pdp };
}

function launchProofMedia(
  frontOnBody: string,
  options?: {
    main?: string;
    backOnBody?: string;
    macroDetail?: string;
    fabricTag?: string;
    flatLay?: string;
    lifestyle?: string;
    weightScale?: string;
    washTest?: string;
  },
): ProductMedia {
  return product(options?.main ?? frontOnBody, {
    frontOnBody,
    backOnBody: options?.backOnBody ?? proofCards.backFit,
    macroDetail: options?.macroDetail ?? proofCards.macroDetail,
    fabricTag: options?.fabricTag ?? proofCards.fabricTag,
    flatLay: options?.flatLay ?? tee.flatLayStyle,
    lifestyle: options?.lifestyle ?? tee.walkingStreet,
    weightScale: options?.weightScale ?? proofCards.weightScale,
    washTest: options?.washTest ?? proofCards.washTest,
  });
}

/** Product slug → main card image + structured PDP image views */
export const productMedia: Record<string, ProductMedia> = {
  'the-weight-of-light': launchProofMedia(tee.studioTee, {
    main: tee.whiteFront,
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'midnight-compass': launchProofMedia(tee.yellowTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  'quiet-revolt': launchProofMedia(tee.womanUrban, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanStreet,
  }),
  'cairo-thread': launchProofMedia(tee.walkingStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  'signal-line': launchProofMedia(tee.streetPose, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  // --- New Emotions ---
  'emotions-silent-scream': launchProofMedia(newTees.emotions1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanSmile,
  }),
  'emotions-deep-waters': launchProofMedia(newTees.emotions2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanStreet,
  }),
  'emotions-shattered-peace': launchProofMedia(newTees.emotions3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanUrban,
  }),
  'emotions-raw-nerve': launchProofMedia(newTees.emotions4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'emotions-unspoken': launchProofMedia(newTees.emotions5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  // --- New Zodiac ---
  'zodiac-astral-body': launchProofMedia(newTees.zodiac1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  'zodiac-star-alignment': launchProofMedia(newTees.zodiac2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.yellowTee,
  }),
  'zodiac-lunar-pull': launchProofMedia(newTees.zodiac3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  'zodiac-solar-flare': launchProofMedia(newTees.zodiac4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'zodiac-cosmic-dust': launchProofMedia(newTees.zodiac5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  // --- New Fiction ---
  'fiction-neon-dreams': launchProofMedia(newTees.fiction1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanUrban,
  }),
  'fiction-dragon-scale': launchProofMedia(newTees.fiction2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'fiction-distant-suns': launchProofMedia(newTees.fiction3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  'fiction-cyber-ghost': launchProofMedia(newTees.fiction4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  'fiction-mythic-realm': launchProofMedia(newTees.fiction5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.studioTee,
  }),
  // --- New Career ---
  'career-hustle-hard': launchProofMedia(newTees.career1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  'career-ceo-mindset': launchProofMedia(newTees.career2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  'career-climb-the-ladder': launchProofMedia(tee.relaxedFit, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  'career-office-hours': launchProofMedia(tee.walkingStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.manCasual,
  }),
  'career-boardroom-rebel': launchProofMedia(tee.manCasual, {
    main: tee.whiteFront,
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  // --- New Trends ---
  'trends-viral-moment': launchProofMedia(tee.yellowTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'trends-street-culture': launchProofMedia(tee.womanStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  'trends-hype-check': launchProofMedia(tee.manCasual, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  'trends-next-wave': launchProofMedia(tee.outdoorTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.yellowTee,
  }),
  'trends-drop-culture': launchProofMedia(tee.streetPose, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
};

export function imgUrl(src: string, w: number) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
}

export function getProductMedia(slug: string): ProductMedia {
  return productMedia[slug] ?? launchProofMedia(tee.manCasual, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  });
}

export function getProductPdpGallery(productName: string, slug: string): ProductPdpGalleryView[] {
  const media = getProductMedia(slug);
  const seen = new Set<string>();

  return PDP_VIEW_ORDER.flatMap((key) => {
    const src = media.pdp[key];
    if (!src || seen.has(src)) return [];
    seen.add(src);
    return [
      {
        key,
        src,
        label: PDP_VIEW_LABELS[key],
        alt: `HORO “${productName}” t-shirt, ${PDP_VIEW_ALTS[key]}.`,
      },
    ];
  });
}

/** Artist listing avatars — people in casual / graphic tees */
export const artistAvatars: Record<string, string> = {
  'nada-ibrahim': tee.womanSmile,
  'omar-hassan': tee.manCasual,
  'layla-farid': tee.womanUrban,
};
