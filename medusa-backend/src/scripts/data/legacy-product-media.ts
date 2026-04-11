export type LegacyProductMedia = {
  gallery: string[]
  main: string
}

const tee = {
  flatLayStyle: "/images/tees/bg_tee_flatlay.png",
  manCasual: "/images/tees/bg_tee_man_casual.png",
  outdoorTee: "/images/tees/bg_tee_outdoor.png",
  relaxedFit: "/images/tees/bg_vibe_career.png",
  streetPose: "/images/tees/bg_vibe_zodiac.png",
  studioTee: "/images/tees/bg_tee_studio_tee.png",
  walkingStreet: "/images/tees/tee_walking_street.png",
  whiteFront: "/images/tees/bg_tee_white_front.png",
  womanStreet: "/images/tees/bg_tee_woman_street.png",
  womanUrban: "/images/tees/bg_vibe_fictious.png",
  yellowTee: "/images/tees/bg_vibe_trends.png",
} as const

const proofCards = {
  backFit: "/images/proof/back-fit-card.svg",
  fabricTag: "/images/proof/fabric-tag-card.svg",
  macroDetail: "/images/proof/macro-detail-card.svg",
  washTest: "/images/proof/wash-test-card.svg",
  weightScale: "/images/proof/weight-scale-card.svg",
} as const

const newTees = {
  career1: "/images/tees/career_vibe_1_1774374340994.png",
  career2: "/images/tees/career_vibe_2_1774374359412.png",
  emotions1: "/images/tees/emotions_vibe_1_1774374034307.png",
  emotions2: "/images/tees/emotions_vibe_2_1774374055078.png",
  emotions3: "/images/tees/emotions_vibe_3_1774374073378.png",
  emotions4: "/images/tees/emotions_vibe_4_1774374088034.png",
  emotions5: "/images/tees/emotions_vibe_5_1774374107073.png",
  fiction1: "/images/tees/fiction_vibe_1_1774374247152.png",
  fiction2: "/images/tees/fiction_vibe_2_1774374267156.png",
  fiction3: "/images/tees/fiction_vibe_3_1774374284774.png",
  fiction4: "/images/tees/fiction_vibe_4_1774374302082.png",
  fiction5: "/images/tees/fiction_vibe_5_1774374319387.png",
  zodiac1: "/images/tees/zodiac_vibe_1_1774374128029.png",
  zodiac2: "/images/tees/zodiac_vibe_2_1774374153203.png",
  zodiac3: "/images/tees/zodiac_vibe_3_1774374174567.png",
  zodiac4: "/images/tees/zodiac_vibe_4_1774374196317.png",
  zodiac5: "/images/tees/zodiac_vibe_5_1774374214170.png",
} as const

function uniqueGallery(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const gallery: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    gallery.push(value)
  }

  return gallery
}

function legacyGallery(
  frontOnBody: string,
  options: {
    backOnBody?: string
    fabricTag?: string
    flatLay?: string
    lifestyle?: string
    macroDetail?: string
    weightScale?: string
    washTest?: string
  } = {}
): LegacyProductMedia {
  return {
    gallery: uniqueGallery([
      frontOnBody,
      options.backOnBody ?? proofCards.backFit,
      options.macroDetail ?? proofCards.macroDetail,
      options.fabricTag ?? proofCards.fabricTag,
      options.flatLay ?? tee.flatLayStyle,
      options.lifestyle ?? tee.walkingStreet,
      options.weightScale ?? proofCards.weightScale,
      options.washTest ?? proofCards.washTest,
    ]),
    main: frontOnBody,
  }
}

const LEGACY_MEDIA_BY_PRODUCT: Record<string, LegacyProductMedia> = {
  "career-boardroom-rebel": legacyGallery(tee.whiteFront, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "career-ceo-mindset": legacyGallery(newTees.career2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "career-climb-the-ladder": legacyGallery(tee.relaxedFit, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "career-hustle-hard": legacyGallery(newTees.career1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  "career-office-hours": legacyGallery(tee.walkingStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.manCasual,
  }),
  "cairo-thread": legacyGallery(tee.walkingStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  "emotions-deep-waters": legacyGallery(newTees.emotions2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanStreet,
  }),
  "emotions-raw-nerve": legacyGallery(newTees.emotions4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "emotions-shattered-peace": legacyGallery(newTees.emotions3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanUrban,
  }),
  "emotions-silent-scream": legacyGallery(newTees.emotions1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanStreet,
  }),
  "emotions-unspoken": legacyGallery(newTees.emotions5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "fiction-cyber-ghost": legacyGallery(newTees.fiction4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  "fiction-distanted-suns": legacyGallery(newTees.fiction3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "fiction-distant-suns": legacyGallery(newTees.fiction3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "fiction-dragon-scale": legacyGallery(newTees.fiction2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "fiction-mythic-realm": legacyGallery(newTees.fiction5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.studioTee,
  }),
  "fiction-neon-dreams": legacyGallery(newTees.fiction1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanUrban,
  }),
  "midnight-compass": legacyGallery(tee.yellowTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  "quiet-revolt": legacyGallery(tee.womanUrban, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.womanStreet,
  }),
  "signal-line": legacyGallery(tee.streetPose, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "the-weight-of-light": legacyGallery(tee.whiteFront, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "trends-drop-culture": legacyGallery(tee.streetPose, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "trends-hype-check": legacyGallery(tee.manCasual, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "trends-next-wave": legacyGallery(tee.outdoorTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.yellowTee,
  }),
  "trends-street-culture": legacyGallery(tee.womanStreet, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "trends-viral-moment": legacyGallery(tee.yellowTee, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "zodiac-astral-body": legacyGallery(newTees.zodiac1, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.streetPose,
  }),
  "zodiac-cosmic-dust": legacyGallery(newTees.zodiac5, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.relaxedFit,
  }),
  "zodiac-lunar-pull": legacyGallery(newTees.zodiac3, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.walkingStreet,
  }),
  "zodiac-solar-flare": legacyGallery(newTees.zodiac4, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.outdoorTee,
  }),
  "zodiac-star-alignment": legacyGallery(newTees.zodiac2, {
    flatLay: tee.flatLayStyle,
    lifestyle: tee.yellowTee,
  }),
}

const DEFAULT_MEDIA = legacyGallery(tee.manCasual, {
  flatLay: tee.flatLayStyle,
  lifestyle: tee.walkingStreet,
})

export function getLegacyProductMedia(slug: string): LegacyProductMedia {
  return LEGACY_MEDIA_BY_PRODUCT[slug] || DEFAULT_MEDIA
}
