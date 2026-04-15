export type LegacyProductMedia = {
  gallery: string[]
  main: string
}

/** On-brand vector from the storefront bundle (§3.4) — replaces non-compliant placeholder photography. */
const BRAND_PLACEHOLDER = "/images/hero/horo_vectorized_v2.svg"

const proofCards = {
  backFit: "/images/proof/back-fit-card.svg",
  fabricTag: "/images/proof/fabric-tag-card.svg",
  macroDetail: "/images/proof/macro-detail-card.svg",
  washTest: "/images/proof/wash-test-card.svg",
  weightScale: "/images/proof/weight-scale-card.svg",
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
  } = {},
): LegacyProductMedia {
  return {
    gallery: uniqueGallery([
      frontOnBody,
      options.backOnBody ?? proofCards.backFit,
      options.macroDetail ?? proofCards.macroDetail,
      options.fabricTag ?? proofCards.fabricTag,
      options.flatLay ?? proofCards.weightScale,
      options.lifestyle ?? proofCards.washTest,
      options.weightScale ?? proofCards.weightScale,
      options.washTest ?? proofCards.washTest,
    ]),
    main: frontOnBody,
  }
}

const LEGACY_MEDIA_BY_PRODUCT: Record<string, LegacyProductMedia> = {
  "career-boardroom-rebel": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "career-ceo-mindset": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "career-climb-the-ladder": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "career-hustle-hard": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "career-office-hours": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
  "cairo-thread": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "emotions-deep-waters": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "emotions-raw-nerve": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "emotions-shattered-peace": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "emotions-silent-scream": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "emotions-unspoken": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
  "fiction-cyber-ghost": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "fiction-distanted-suns": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "fiction-distant-suns": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "fiction-dragon-scale": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "fiction-mythic-realm": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "fiction-neon-dreams": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "midnight-compass": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
  "quiet-revolt": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "signal-line": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "the-weight-of-light": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "trends-drop-culture": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
  "trends-hype-check": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "trends-next-wave": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "trends-street-culture": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "trends-viral-moment": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "zodiac-astral-body": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "zodiac-cosmic-dust": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "zodiac-lunar-pull": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
  "zodiac-solar-flare": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.weightScale,
  }),
  "zodiac-star-alignment": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  /** Egypt catalog hero SKUs (see egypt-products.ts + seed-egypt-catalog) */
  "horo-career-vibe": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "horo-emotions-vibe": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.fabricTag,
  }),
  "horo-fiction-vibe": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.washTest,
  }),
  "horo-signature-hero": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.macroDetail,
  }),
  "horo-zodiac-vibe": legacyGallery(BRAND_PLACEHOLDER, {
    flatLay: proofCards.macroDetail,
    lifestyle: proofCards.backFit,
  }),
}

const DEFAULT_MEDIA = legacyGallery(BRAND_PLACEHOLDER, {
  flatLay: proofCards.macroDetail,
  lifestyle: proofCards.washTest,
})

export function getLegacyProductMedia(slug: string): LegacyProductMedia {
  return LEGACY_MEDIA_BY_PRODUCT[slug] || DEFAULT_MEDIA
}
