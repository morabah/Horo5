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

/** Product slug → main card image + 5 gallery images (PDP) — all model-in-tee or product shots */
export const productMedia: Record<string, { main: string; gallery: string[] }> = {
  'the-weight-of-light': {
    main: tee.whiteFront,
    gallery: [tee.whiteFront, tee.womanSmile, tee.walkingStreet, tee.flatLayStyle, tee.womanUrban],
  },
  'midnight-compass': {
    main: tee.yellowTee,
    gallery: [tee.yellowTee, tee.studioTee, tee.outdoorTee, tee.flatLayStyle, tee.manCasual],
  },
  'quiet-revolt': {
    main: tee.womanUrban,
    gallery: [tee.womanUrban, tee.relaxedFit, tee.womanSmile, tee.flatLayStyle, tee.streetPose],
  },
  'cairo-thread': {
    main: tee.walkingStreet,
    gallery: [tee.walkingStreet, tee.womanStreet, tee.outdoorTee, tee.flatLayStyle, tee.streetPose],
  },
  'signal-line': {
    main: tee.streetPose,
    gallery: [tee.streetPose, tee.womanStreet, tee.outdoorTee, tee.flatLayStyle, tee.friendsTees],
  },
  // --- New Emotions ---
  'emotions-silent-scream': { main: newTees.emotions1, gallery: [newTees.emotions1, tee.womanSmile, tee.flatLayStyle] },
  'emotions-deep-waters': { main: newTees.emotions2, gallery: [newTees.emotions2, tee.whiteFront, tee.womanStreet] },
  'emotions-shattered-peace': { main: newTees.emotions3, gallery: [newTees.emotions3, tee.studioTee, tee.friendsTees] },
  'emotions-raw-nerve': { main: newTees.emotions4, gallery: [newTees.emotions4, tee.manCasual, tee.outdoorTee] },
  'emotions-unspoken': { main: newTees.emotions5, gallery: [newTees.emotions5, tee.womanUrban, tee.flatLayStyle] },
  // --- New Zodiac ---
  'zodiac-astral-body': { main: newTees.zodiac1, gallery: [newTees.zodiac1, tee.streetPose, tee.flatLayStyle] },
  'zodiac-star-alignment': { main: newTees.zodiac2, gallery: [newTees.zodiac2, tee.womanStreet, tee.womanSmile] },
  'zodiac-lunar-pull': { main: newTees.zodiac3, gallery: [newTees.zodiac3, tee.studioTee, tee.manCasual] },
  'zodiac-solar-flare': { main: newTees.zodiac4, gallery: [newTees.zodiac4, tee.yellowTee, tee.outdoorTee] },
  'zodiac-cosmic-dust': { main: newTees.zodiac5, gallery: [newTees.zodiac5, tee.womanUrban, tee.friendsTees] },
  // --- New Fiction ---
  'fiction-neon-dreams': { main: newTees.fiction1, gallery: [newTees.fiction1, tee.womanUrban, tee.flatLayStyle] },
  'fiction-dragon-scale': { main: newTees.fiction2, gallery: [newTees.fiction2, tee.streetPose, tee.womanStreet] },
  'fiction-distant-suns': { main: newTees.fiction3, gallery: [newTees.fiction3, tee.studioTee, tee.manCasual] },
  'fiction-cyber-ghost': { main: newTees.fiction4, gallery: [newTees.fiction4, tee.whiteFront, tee.outdoorTee] },
  'fiction-mythic-realm': { main: newTees.fiction5, gallery: [newTees.fiction5, tee.yellowTee, tee.friendsTees] },
  // --- New Career ---
  'career-hustle-hard': { main: newTees.career1, gallery: [newTees.career1, tee.relaxedFit, tee.flatLayStyle] },
  'career-ceo-mindset': { main: newTees.career2, gallery: [newTees.career2, tee.womanStreet, tee.studioTee] },
  'career-climb-the-ladder': { main: tee.relaxedFit, gallery: [tee.relaxedFit, tee.manCasual, tee.outdoorTee] },
  'career-office-hours': { main: tee.walkingStreet, gallery: [tee.walkingStreet, tee.womanUrban, tee.friendsTees] },
  'career-boardroom-rebel': { main: tee.whiteFront, gallery: [tee.whiteFront, tee.streetPose, tee.flatLayStyle] },
  // --- New Trends ---
  'trends-viral-moment': { main: tee.yellowTee, gallery: [tee.yellowTee, tee.outdoorTee, tee.flatLayStyle] },
  'trends-street-culture': { main: tee.womanStreet, gallery: [tee.womanStreet, tee.streetPose, tee.friendsTees] },
  'trends-hype-check': { main: tee.manCasual, gallery: [tee.manCasual, tee.studioTee, tee.whiteFront] },
  'trends-next-wave': { main: tee.outdoorTee, gallery: [tee.outdoorTee, tee.yellowTee, tee.relaxedFit] },
  'trends-drop-culture': { main: tee.streetPose, gallery: [tee.streetPose, tee.womanUrban, tee.flatLayStyle] },
};

export function imgUrl(src: string, w: number) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80&auto=format&fit=crop`;
}

export function getProductMedia(slug: string) {
  return (
    productMedia[slug] ?? {
      main: tee.whiteFront,
      gallery: [tee.whiteFront, tee.womanSmile, tee.relaxedFit, tee.flatLayStyle, tee.manCasual],
    }
  );
}

/** Artist listing avatars — people in casual / graphic tees */
export const artistAvatars: Record<string, string> = {
  'nada-ibrahim': tee.womanSmile,
  'omar-hassan': tee.manCasual,
  'layla-farid': tee.womanUrban,
};
