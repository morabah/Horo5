/**
 * Legacy slug normalization for storefront reads and seed scripts.
 * Keeps historical product metadata / old feeling keys mapping to canonical taxonomy slugs.
 */

export const DEFAULT_SUBFEELING_BY_FEELING: Record<string, string> = {
  career: "ambition",
  fiction: "sci-fi",
  mood: "i-care",
  trends: "streetwear",
  zodiac: "fire-sign",
}

export const LEGACY_FEELING_TO_TAXONOMY: Record<string, string> = {
  "bold-electric": "trends",
  "grounded-everyday": "career",
  "playful-offbeat": "fiction",
  "soft-quiet": "mood",
  "warm-romantic": "zodiac",
}

export const LEGACY_SUBFEELING_TO_TAXONOMY: Record<string, string> = {
  career: "ambition",
  emotions: "i-care",
  fiction: "sci-fi",
  trends: "streetwear",
  zodiac: "fire-sign",
}

export function inferFeelingSlugFromHandle(handle: string): string {
  const normalized = handle.toLowerCase()

  if (normalized.startsWith("emotions-")) return "mood"
  if (normalized.startsWith("zodiac-")) return "zodiac"
  if (normalized.startsWith("fiction-")) return "fiction"
  if (normalized.startsWith("career-")) return "career"
  if (normalized.startsWith("trends-")) return "trends"

  return "mood"
}

export function inferSubfeelingSlugFromHandle(handle: string, feelingSlug: string): string {
  const normalized = handle.toLowerCase()

  if (normalized.includes("silent") || normalized.includes("deep") || normalized.includes("unspoken")) {
    return feelingSlug === "mood" ? "i-care" : DEFAULT_SUBFEELING_BY_FEELING[feelingSlug] || "i-care"
  }

  if (normalized.includes("shattered") || normalized.includes("raw") || normalized.includes("quiet-revolt")) {
    return feelingSlug === "mood" ? "i-dont-care" : DEFAULT_SUBFEELING_BY_FEELING[feelingSlug] || "i-care"
  }

  return DEFAULT_SUBFEELING_BY_FEELING[feelingSlug] || "i-care"
}

export function normalizeFeelingSlug(value: string | undefined, handle: string): string {
  if (!value) {
    return inferFeelingSlugFromHandle(handle)
  }

  return LEGACY_FEELING_TO_TAXONOMY[value] || value
}

export function normalizeSubfeelingSlug(value: string | undefined, handle: string, feelingSlug: string): string {
  if (!value) {
    return inferSubfeelingSlugFromHandle(handle, feelingSlug)
  }

  return LEGACY_SUBFEELING_TO_TAXONOMY[value] || value
}

/** Used by seed when mapping legacy web catalog feeling slugs to module slugs. */
export function normalizeLegacyWebFeelingSlug(legacyFeelingSlug: string): string {
  if (legacyFeelingSlug === "soft-quiet") return "mood"
  if (legacyFeelingSlug === "warm-romantic") return "zodiac"
  if (legacyFeelingSlug === "bold-electric") return "trends"
  if (legacyFeelingSlug === "grounded-everyday") return "career"
  if (legacyFeelingSlug === "playful-offbeat") return "fiction"
  return legacyFeelingSlug
}

export function derivePrimarySubfeelingSlugFromLegacyProduct(args: {
  slug: string
  feelingSlug: string
}): string {
  const feelingSlug = normalizeLegacyWebFeelingSlug(args.feelingSlug)
  const handle = args.slug.toLowerCase()

  if (handle.startsWith("emotions-")) {
    if (handle.includes("raw") || handle.includes("shattered")) return "i-dont-care"
    if (handle.includes("silent") || handle.includes("unspoken")) return "i-care"
    if (handle.includes("deep")) return "overthinking"
    return "numb"
  }

  if (feelingSlug === "zodiac") return "fire-sign"
  if (feelingSlug === "trends") return "streetwear"
  if (feelingSlug === "career") return "ambition"
  if (feelingSlug === "fiction") return "sci-fi"

  return "i-care"
}
