/**
 * Remote images (Unsplash) — models in graphic / printed t-shirts & streetwear.
 * License: Unsplash (https://unsplash.com/license) — free to use.
 * Sizes: pass ?w= for width; we append in imgUrl().
 */



/** Hero: urban, warm, model in tee */
export const heroStreet = '/images/tees/bg_tee_walking_street.png';
export const giftWrapPreview = '/images/cart/gift-wrap-story-card-preview.svg';

/** Models in tees / streetwear — varied angles (used across vibes & PDP) */
export const tee = {
  whiteFront: '/images/tees/bg_tee_white_front.png',
  womanSmile: '/images/tees/bg_vibe_emotions.png',
  womanStreet: '/images/tees/bg_tee_woman_street.png',
  manCasual: '/images/tees/bg_tee_man_casual.png',
  womanUrban: '/images/tees/bg_vibe_fictious.png',
  walkingStreet: '/images/tees/bg_tee_walking_street.png',
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

/**
 * Homepage hero — full-bleed model in tee (warm, editorial).
 */
export const heroHomeTee = tee.walkingStreet;
export const aboutHero = tee.friendsTees;
export const aboutHeroAlt =
  'Group editorial image of young adults wearing HORO graphic tees, representing shared identity and belonging.';
export const aboutBridgeImage = tee.walkingStreet;
export const aboutBridgeAlt =
  'Editorial street image of a HORO graphic tee, bridging the brand story back into the collection.';

/**
 * Editorial wide + detail per vibe — every shot is a model wearing a t-shirt,
 * chosen to match the vibe (mood / night-out / bold graphic / pro casual / street trend).
 */
export const vibeEditorialImagery: Record<string, { wide: string; detail: string }> = {
  emotions: {
    wide: '/images/tees/bg_vibe_emotions.png',
    detail: tee.whiteFront,
  },
  zodiac: {
    wide: '/images/tees/bg_vibe_zodiac.png',
    detail: tee.relaxedFit,
  },
  fiction: {
    wide: '/images/tees/bg_vibe_fictious.png',
    detail: tee.studioTee,
  },
  career: {
    wide: '/images/tees/bg_vibe_career.png',
    detail: tee.walkingStreet,
  },
  trends: {
    wide: '/images/tees/bg_vibe_trends.png',
    detail: tee.outdoorTee,
  },
};

/** Vibe listing cards — same wide image as editorial for consistency */
export const vibeCovers: Record<string, string> = {
  emotions: vibeEditorialImagery.emotions.wide,
  zodiac: vibeEditorialImagery.zodiac.wide,
  fiction: vibeEditorialImagery.fiction.wide,
  career: vibeEditorialImagery.career.wide,
  trends: vibeEditorialImagery.trends.wide,
};

export const vibesHubHeroTiles = [
  {
    slug: 'emotions',
    src: vibeCovers.emotions,
    alt: 'Emotions vibe — expressive editorial styling in a HORO tee.',
    objectPosition: 'center 24%',
  },
  {
    slug: 'zodiac',
    src: vibeCovers.zodiac,
    alt: 'Zodiac vibe — cosmic editorial styling in a HORO tee.',
    objectPosition: 'center 18%',
  },
  {
    slug: 'fiction',
    src: vibeCovers.fiction,
    alt: 'Fiction vibe — story-led editorial styling in a HORO tee.',
    objectPosition: 'center 26%',
  },
  {
    slug: 'career',
    src: vibeCovers.career,
    alt: 'Career vibe — grounded editorial styling in a HORO tee.',
    objectPosition: 'center 20%',
  },
  {
    slug: 'trends',
    src: vibeCovers.trends,
    alt: 'Trends vibe — street-led editorial styling in a HORO tee.',
    objectPosition: 'center 18%',
  },
] as const;

export const PDP_VIEW_ORDER = ['flatLay', 'onBody', 'lifestyle', 'detail', 'sizeReference'] as const;

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
  flatLay: 'flat lay',
  onBody: 'on-body',
  lifestyle: 'lifestyle',
  detail: 'print detail',
  sizeReference: 'size reference',
};

const PDP_VIEW_ALTS: Record<ProductPdpViewKey, string> = {
  flatLay: 'flat lay on a warm studio surface',
  onBody: 'worn on body in studio light',
  lifestyle: 'styled in an everyday street setting',
  detail: 'close-up showing print detail and fabric texture',
  sizeReference: 'worn on body for size reference',
};

function product(main: string, pdp: ProductPdpViewMap): ProductMedia {
  return { main, pdp };
}

function flatLay(main: string): ProductMedia {
  return product(main, { flatLay: main });
}

function onBody(main: string): ProductMedia {
  return product(main, { onBody: main });
}

function lifestyle(main: string): ProductMedia {
  return product(main, { lifestyle: main });
}

/** Product slug → main card image + structured PDP image views */
export const productMedia: Record<string, ProductMedia> = {
  'the-weight-of-light': flatLay(tee.whiteFront),
  'midnight-compass': onBody(tee.yellowTee),
  'quiet-revolt': onBody(tee.womanUrban),
  'cairo-thread': lifestyle(tee.walkingStreet),
  'signal-line': onBody(tee.streetPose),
  // --- New Emotions ---
  'emotions-silent-scream': onBody(newTees.emotions1),
  'emotions-deep-waters': onBody(newTees.emotions2),
  'emotions-shattered-peace': onBody(newTees.emotions3),
  'emotions-raw-nerve': onBody(newTees.emotions4),
  'emotions-unspoken': onBody(newTees.emotions5),
  // --- New Zodiac ---
  'zodiac-astral-body': onBody(newTees.zodiac1),
  'zodiac-star-alignment': onBody(newTees.zodiac2),
  'zodiac-lunar-pull': onBody(newTees.zodiac3),
  'zodiac-solar-flare': onBody(newTees.zodiac4),
  'zodiac-cosmic-dust': onBody(newTees.zodiac5),
  // --- New Fiction ---
  'fiction-neon-dreams': onBody(newTees.fiction1),
  'fiction-dragon-scale': onBody(newTees.fiction2),
  'fiction-distant-suns': onBody(newTees.fiction3),
  'fiction-cyber-ghost': onBody(newTees.fiction4),
  'fiction-mythic-realm': onBody(newTees.fiction5),
  // --- New Career ---
  'career-hustle-hard': onBody(newTees.career1),
  'career-ceo-mindset': onBody(newTees.career2),
  'career-climb-the-ladder': onBody(tee.relaxedFit),
  'career-office-hours': lifestyle(tee.walkingStreet),
  'career-boardroom-rebel': flatLay(tee.whiteFront),
  // --- New Trends ---
  'trends-viral-moment': onBody(tee.yellowTee),
  'trends-street-culture': onBody(tee.womanStreet),
  'trends-hype-check': onBody(tee.manCasual),
  'trends-next-wave': onBody(tee.outdoorTee),
  'trends-drop-culture': onBody(tee.streetPose),
};

export function imgUrl(src: string, w: number) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
}

export function getProductMedia(slug: string): ProductMedia {
  return productMedia[slug] ?? flatLay(tee.whiteFront);
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
