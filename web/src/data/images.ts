/**
 * Remote images (Unsplash) — models in graphic / printed t-shirts & streetwear.
 * License: Unsplash (https://unsplash.com/license) — free to use.
 * Sizes: pass ?w= for width; we append in imgUrl().
 */



/** Hero: urban, warm, model in tee */
export const heroStreet = '/images/tees/bg_tee_walking_street.png';

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

/** PDP gallery: repeat the product main image so every thumb matches this SKU until per-angle assets exist. */
function g(main: string, count = 5): string[] {
  return Array.from({ length: count }, () => main);
}

/** Product slug → main card image + gallery images (PDP) */
export const productMedia: Record<string, { main: string; gallery: string[] }> = {
  'the-weight-of-light': {
    main: tee.whiteFront,
    gallery: g(tee.whiteFront),
  },
  'midnight-compass': {
    main: tee.yellowTee,
    gallery: g(tee.yellowTee),
  },
  'quiet-revolt': {
    main: tee.womanUrban,
    gallery: g(tee.womanUrban),
  },
  'cairo-thread': {
    main: tee.walkingStreet,
    gallery: g(tee.walkingStreet),
  },
  'signal-line': {
    main: tee.streetPose,
    gallery: g(tee.streetPose),
  },
  // --- New Emotions ---
  'emotions-silent-scream': { main: newTees.emotions1, gallery: g(newTees.emotions1) },
  'emotions-deep-waters': { main: newTees.emotions2, gallery: g(newTees.emotions2) },
  'emotions-shattered-peace': { main: newTees.emotions3, gallery: g(newTees.emotions3) },
  'emotions-raw-nerve': { main: newTees.emotions4, gallery: g(newTees.emotions4) },
  'emotions-unspoken': { main: newTees.emotions5, gallery: g(newTees.emotions5) },
  // --- New Zodiac ---
  'zodiac-astral-body': { main: newTees.zodiac1, gallery: g(newTees.zodiac1) },
  'zodiac-star-alignment': { main: newTees.zodiac2, gallery: g(newTees.zodiac2) },
  'zodiac-lunar-pull': { main: newTees.zodiac3, gallery: g(newTees.zodiac3) },
  'zodiac-solar-flare': { main: newTees.zodiac4, gallery: g(newTees.zodiac4) },
  'zodiac-cosmic-dust': { main: newTees.zodiac5, gallery: g(newTees.zodiac5) },
  // --- New Fiction ---
  'fiction-neon-dreams': { main: newTees.fiction1, gallery: g(newTees.fiction1) },
  'fiction-dragon-scale': { main: newTees.fiction2, gallery: g(newTees.fiction2) },
  'fiction-distant-suns': { main: newTees.fiction3, gallery: g(newTees.fiction3) },
  'fiction-cyber-ghost': { main: newTees.fiction4, gallery: g(newTees.fiction4) },
  'fiction-mythic-realm': { main: newTees.fiction5, gallery: g(newTees.fiction5) },
  // --- New Career ---
  'career-hustle-hard': { main: newTees.career1, gallery: g(newTees.career1) },
  'career-ceo-mindset': { main: newTees.career2, gallery: g(newTees.career2) },
  'career-climb-the-ladder': { main: tee.relaxedFit, gallery: g(tee.relaxedFit) },
  'career-office-hours': { main: tee.walkingStreet, gallery: g(tee.walkingStreet) },
  'career-boardroom-rebel': { main: tee.whiteFront, gallery: g(tee.whiteFront) },
  // --- New Trends ---
  'trends-viral-moment': { main: tee.yellowTee, gallery: g(tee.yellowTee) },
  'trends-street-culture': { main: tee.womanStreet, gallery: g(tee.womanStreet) },
  'trends-hype-check': { main: tee.manCasual, gallery: g(tee.manCasual) },
  'trends-next-wave': { main: tee.outdoorTee, gallery: g(tee.outdoorTee) },
  'trends-drop-culture': { main: tee.streetPose, gallery: g(tee.streetPose) },
};

export function imgUrl(src: string, w: number) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
}

export function getProductMedia(slug: string) {
  return (
    productMedia[slug] ?? {
      main: tee.whiteFront,
      gallery: g(tee.whiteFront),
    }
  );
}

/** Artist listing avatars — people in casual / graphic tees */
export const artistAvatars: Record<string, string> = {
  'nada-ibrahim': tee.womanSmile,
  'omar-hassan': tee.manCasual,
  'layla-farid': tee.womanUrban,
};
