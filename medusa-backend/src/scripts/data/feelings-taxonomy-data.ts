/** Shared feeling / subfeeling taxonomy used by seed and migration scripts. */

/** On-brand vector served from the storefront bundle until Cairo photography ships (§3.4). */
export const STOREFRONT_BRAND_PLACEHOLDER_SRC = "/images/hero/horo_vectorized_v2.svg"

export type FeelingTaxonomySeed = {
  slug: string
  name: string
  blurb: string
  tagline: string
  manifesto: string
  accent: string
  cardImageSrc: string
  cardImageAlt: string
  heroImageSrc: string
  heroImageAlt: string
  sort_order: number
}

export const FEELING_TAXONOMY: FeelingTaxonomySeed[] = [
  {
    slug: "mood",
    accent: "#B77A67",
    name: "Mood",
    blurb: "For emotional honesty, slower days, and pieces that read like a feeling before they read like a trend.",
    tagline: "For emotional honesty, slower days, and pieces that read like a feeling before they read like a trend.",
    manifesto: "Wear the feeling before you explain it.",
    cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    cardImageAlt: "Mood cover — emotional graphic tee styling.",
    heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    heroImageAlt: "Mood hero — HORO emotional graphic tee.",
    sort_order: 0,
  },
  {
    slug: "zodiac",
    accent: "#C5A15C",
    name: "Zodiac",
    blurb: "For cosmic identity, signs, and symbolism-led stories.",
    tagline: "For cosmic identity, signs, and symbolism-led stories.",
    manifesto: "Personal signs, bigger energy.",
    cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    cardImageAlt: "Zodiac cover — cosmic graphic tee styling.",
    heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    heroImageAlt: "Zodiac hero — HORO zodiac graphic tee.",
    sort_order: 10,
  },
  {
    slug: "trends",
    accent: "#556F73",
    name: "Trends",
    blurb: "For streetwear language, visible statements, and culture-led drops.",
    tagline: "For streetwear language, visible statements, and culture-led drops.",
    manifesto: "Current without becoming disposable.",
    cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    cardImageAlt: "Trends cover — brand placeholder.",
    heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    heroImageAlt: "Trends hero — brand placeholder.",
    sort_order: 20,
  },
  {
    slug: "career",
    accent: "#7D8771",
    name: "Career",
    blurb: "For ambition, office humor, and work-life identity.",
    tagline: "For ambition, office humor, and work-life identity.",
    manifesto: "Built for the work mode and the jokes about it.",
    cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    cardImageAlt: "Career cover — brand placeholder.",
    heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    heroImageAlt: "Career hero — brand placeholder.",
    sort_order: 30,
  },
  {
    slug: "fiction",
    accent: "#6A5B76",
    name: "Fiction",
    blurb: "For fandoms, story worlds, and reference-heavy graphics.",
    tagline: "For fandoms, story worlds, and reference-heavy graphics.",
    manifesto: "Specific stories beat generic graphics.",
    cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    cardImageAlt: "Fiction cover — brand placeholder.",
    heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC,
    heroImageAlt: "Fiction hero — brand placeholder.",
    sort_order: 40,
  },
]

export type SubfeelingTaxonomySeed = {
  slug: string
  feeling_slug: string
  name: string
  blurb: string
  cardImageSrc: string
  cardImageAlt: string
  heroImageSrc: string
  heroImageAlt: string
  sort_order: number
}

export const SUBFEELING_TAXONOMY: SubfeelingTaxonomySeed[] = [
  { slug: "i-care", feeling_slug: "mood", name: "I Care", blurb: "Emotionally open, sincere, and direct.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "I Care cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "I Care hero", sort_order: 0 },
  { slug: "i-dont-care", feeling_slug: "mood", name: "I Don't Care", blurb: "Detached, dry, and intentionally unbothered.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "I Don't Care cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "I Don't Care hero", sort_order: 10 },
  { slug: "overthinking", feeling_slug: "mood", name: "Overthinking", blurb: "Racing thoughts, spirals, and internal monologue energy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Overthinking cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Overthinking hero", sort_order: 20 },
  { slug: "numb", feeling_slug: "mood", name: "Numb", blurb: "Muted reactions and colder emotional distance.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Numb cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Numb hero", sort_order: 30 },
  { slug: "fire-sign", feeling_slug: "zodiac", name: "Fire Sign", blurb: "Bold, expressive, and extroverted sign energy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Fire Sign cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Fire Sign hero", sort_order: 40 },
  { slug: "earth-sign", feeling_slug: "zodiac", name: "Earth Sign", blurb: "Grounded, practical, and steady sign energy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Earth Sign cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Earth Sign hero", sort_order: 50 },
  { slug: "air-sign", feeling_slug: "zodiac", name: "Air Sign", blurb: "Curious, fast-moving, and mentally sharp sign energy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Air Sign cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Air Sign hero", sort_order: 60 },
  { slug: "water-sign", feeling_slug: "zodiac", name: "Water Sign", blurb: "Intuitive, emotional, and symbolic sign energy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Water Sign cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Water Sign hero", sort_order: 70 },
  { slug: "streetwear", feeling_slug: "trends", name: "Streetwear", blurb: "Street references, hype language, and drop culture.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Streetwear cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Streetwear hero", sort_order: 80 },
  { slug: "minimal", feeling_slug: "trends", name: "Minimal", blurb: "Cleaner layouts, quieter graphics, sharper restraint.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Minimal cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Minimal hero", sort_order: 90 },
  { slug: "statement", feeling_slug: "trends", name: "Statement", blurb: "High-contrast graphics built to be noticed.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Statement cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Statement hero", sort_order: 100 },
  { slug: "viral-energy", feeling_slug: "trends", name: "Viral Energy", blurb: "Internet-native references and fast-moving culture cues.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Viral Energy cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Viral Energy hero", sort_order: 110 },
  { slug: "ambition", feeling_slug: "career", name: "Ambition", blurb: "Achievement, drive, and professional hunger.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Ambition cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Ambition hero", sort_order: 120 },
  { slug: "burnout", feeling_slug: "career", name: "Burnout", blurb: "Work fatigue, survival mode, and the cost of hustle.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Burnout cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Burnout hero", sort_order: 130 },
  { slug: "office-humor", feeling_slug: "career", name: "Office Humor", blurb: "Corporate jokes, work sarcasm, and deadline comedy.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Office Humor cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Office Humor hero", sort_order: 140 },
  { slug: "work-mode", feeling_slug: "career", name: "Work Mode", blurb: "Switched on, focused, and performance-driven.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Work Mode cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Work Mode hero", sort_order: 150 },
  { slug: "sci-fi", feeling_slug: "fiction", name: "Sci-Fi", blurb: "Futurism, cyber worlds, and speculative graphics.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Sci-Fi cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Sci-Fi hero", sort_order: 160 },
  { slug: "fantasy", feeling_slug: "fiction", name: "Fantasy", blurb: "Mythic worlds, symbols, and imagined realms.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Fantasy cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Fantasy hero", sort_order: 170 },
  { slug: "gaming", feeling_slug: "fiction", name: "Gaming", blurb: "Game language, references, and player identity.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Gaming cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Gaming hero", sort_order: 180 },
  { slug: "anime", feeling_slug: "fiction", name: "Anime", blurb: "Character-led graphics and fandom-first styling.", cardImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, cardImageAlt: "Anime cover", heroImageSrc: STOREFRONT_BRAND_PLACEHOLDER_SRC, heroImageAlt: "Anime hero", sort_order: 190 },
]
