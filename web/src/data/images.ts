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
  fictious: {
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
  fictious: vibeEditorialImagery.fictious.wide,
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
