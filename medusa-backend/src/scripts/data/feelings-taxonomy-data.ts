/** Shared feeling / subfeeling taxonomy used by seed and migration scripts. */

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
    cardImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png",
    cardImageAlt: "Mood cover — emotional graphic tee styling.",
    heroImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png",
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
    cardImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png",
    cardImageAlt: "Zodiac cover — cosmic graphic tee styling.",
    heroImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png",
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
    cardImageSrc: "/images/tees/bg_vibe_trends.png",
    cardImageAlt: "Trends cover — bold streetwear tee styling.",
    heroImageSrc: "/images/tees/bg_vibe_trends.png",
    heroImageAlt: "Trends hero — HORO trends graphic tee.",
    sort_order: 20,
  },
  {
    slug: "career",
    accent: "#7D8771",
    name: "Career",
    blurb: "For ambition, office humor, and work-life identity.",
    tagline: "For ambition, office humor, and work-life identity.",
    manifesto: "Built for the work mode and the jokes about it.",
    cardImageSrc: "/images/tees/career_vibe_1_1774374340994.png",
    cardImageAlt: "Career cover — professional graphic tee styling.",
    heroImageSrc: "/images/tees/career_vibe_1_1774374340994.png",
    heroImageAlt: "Career hero — HORO career graphic tee.",
    sort_order: 30,
  },
  {
    slug: "fiction",
    accent: "#6A5B76",
    name: "Fiction",
    blurb: "For fandoms, story worlds, and reference-heavy graphics.",
    tagline: "For fandoms, story worlds, and reference-heavy graphics.",
    manifesto: "Specific stories beat generic graphics.",
    cardImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png",
    cardImageAlt: "Fiction cover — playful graphic tee styling.",
    heroImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png",
    heroImageAlt: "Fiction hero — HORO fiction graphic tee.",
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
  { slug: "i-care", feeling_slug: "mood", name: "I Care", blurb: "Emotionally open, sincere, and direct.", cardImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png", cardImageAlt: "I Care cover", heroImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png", heroImageAlt: "I Care hero", sort_order: 0 },
  { slug: "i-dont-care", feeling_slug: "mood", name: "I Don't Care", blurb: "Detached, dry, and intentionally unbothered.", cardImageSrc: "/images/tees/emotions_vibe_4_1774374088034.png", cardImageAlt: "I Don't Care cover", heroImageSrc: "/images/tees/emotions_vibe_4_1774374088034.png", heroImageAlt: "I Don't Care hero", sort_order: 10 },
  { slug: "overthinking", feeling_slug: "mood", name: "Overthinking", blurb: "Racing thoughts, spirals, and internal monologue energy.", cardImageSrc: "/images/tees/emotions_vibe_2_1774374055078.png", cardImageAlt: "Overthinking cover", heroImageSrc: "/images/tees/emotions_vibe_2_1774374055078.png", heroImageAlt: "Overthinking hero", sort_order: 20 },
  { slug: "numb", feeling_slug: "mood", name: "Numb", blurb: "Muted reactions and colder emotional distance.", cardImageSrc: "/images/tees/emotions_vibe_5_1774374107073.png", cardImageAlt: "Numb cover", heroImageSrc: "/images/tees/emotions_vibe_5_1774374107073.png", heroImageAlt: "Numb hero", sort_order: 30 },
  { slug: "fire-sign", feeling_slug: "zodiac", name: "Fire Sign", blurb: "Bold, expressive, and extroverted sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png", cardImageAlt: "Fire Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png", heroImageAlt: "Fire Sign hero", sort_order: 40 },
  { slug: "earth-sign", feeling_slug: "zodiac", name: "Earth Sign", blurb: "Grounded, practical, and steady sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_2_1774374153203.png", cardImageAlt: "Earth Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_2_1774374153203.png", heroImageAlt: "Earth Sign hero", sort_order: 50 },
  { slug: "air-sign", feeling_slug: "zodiac", name: "Air Sign", blurb: "Curious, fast-moving, and mentally sharp sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_3_1774374174567.png", cardImageAlt: "Air Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_3_1774374174567.png", heroImageAlt: "Air Sign hero", sort_order: 60 },
  { slug: "water-sign", feeling_slug: "zodiac", name: "Water Sign", blurb: "Intuitive, emotional, and symbolic sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_5_1774374214170.png", cardImageAlt: "Water Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_5_1774374214170.png", heroImageAlt: "Water Sign hero", sort_order: 70 },
  { slug: "streetwear", feeling_slug: "trends", name: "Streetwear", blurb: "Street references, hype language, and drop culture.", cardImageSrc: "/images/tees/bg_vibe_trends.png", cardImageAlt: "Streetwear cover", heroImageSrc: "/images/tees/bg_vibe_trends.png", heroImageAlt: "Streetwear hero", sort_order: 80 },
  { slug: "minimal", feeling_slug: "trends", name: "Minimal", blurb: "Cleaner layouts, quieter graphics, sharper restraint.", cardImageSrc: "/images/tees/bg_tee_studio_tee.png", cardImageAlt: "Minimal cover", heroImageSrc: "/images/tees/bg_tee_studio_tee.png", heroImageAlt: "Minimal hero", sort_order: 90 },
  { slug: "statement", feeling_slug: "trends", name: "Statement", blurb: "High-contrast graphics built to be noticed.", cardImageSrc: "/images/tees/bg_tee_outdoor.png", cardImageAlt: "Statement cover", heroImageSrc: "/images/tees/bg_tee_outdoor.png", heroImageAlt: "Statement hero", sort_order: 100 },
  { slug: "viral-energy", feeling_slug: "trends", name: "Viral Energy", blurb: "Internet-native references and fast-moving culture cues.", cardImageSrc: "/images/tees/tee_walking_street.png", cardImageAlt: "Viral Energy cover", heroImageSrc: "/images/tees/tee_walking_street.png", heroImageAlt: "Viral Energy hero", sort_order: 110 },
  { slug: "ambition", feeling_slug: "career", name: "Ambition", blurb: "Achievement, drive, and professional hunger.", cardImageSrc: "/images/tees/career_vibe_1_1774374340994.png", cardImageAlt: "Ambition cover", heroImageSrc: "/images/tees/career_vibe_1_1774374340994.png", heroImageAlt: "Ambition hero", sort_order: 120 },
  { slug: "burnout", feeling_slug: "career", name: "Burnout", blurb: "Work fatigue, survival mode, and the cost of hustle.", cardImageSrc: "/images/tees/career_vibe_2_1774374359412.png", cardImageAlt: "Burnout cover", heroImageSrc: "/images/tees/career_vibe_2_1774374359412.png", heroImageAlt: "Burnout hero", sort_order: 130 },
  { slug: "office-humor", feeling_slug: "career", name: "Office Humor", blurb: "Corporate jokes, work sarcasm, and deadline comedy.", cardImageSrc: "/images/tees/bg_tee_man_casual.png", cardImageAlt: "Office Humor cover", heroImageSrc: "/images/tees/bg_tee_man_casual.png", heroImageAlt: "Office Humor hero", sort_order: 140 },
  { slug: "work-mode", feeling_slug: "career", name: "Work Mode", blurb: "Switched on, focused, and performance-driven.", cardImageSrc: "/images/tees/bg_vibe_career.png", cardImageAlt: "Work Mode cover", heroImageSrc: "/images/tees/bg_vibe_career.png", heroImageAlt: "Work Mode hero", sort_order: 150 },
  { slug: "sci-fi", feeling_slug: "fiction", name: "Sci-Fi", blurb: "Futurism, cyber worlds, and speculative graphics.", cardImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png", cardImageAlt: "Sci-Fi cover", heroImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png", heroImageAlt: "Sci-Fi hero", sort_order: 160 },
  { slug: "fantasy", feeling_slug: "fiction", name: "Fantasy", blurb: "Mythic worlds, symbols, and imagined realms.", cardImageSrc: "/images/tees/fiction_vibe_2_1774374267156.png", cardImageAlt: "Fantasy cover", heroImageSrc: "/images/tees/fiction_vibe_2_1774374267156.png", heroImageAlt: "Fantasy hero", sort_order: 170 },
  { slug: "gaming", feeling_slug: "fiction", name: "Gaming", blurb: "Game language, references, and player identity.", cardImageSrc: "/images/tees/fiction_vibe_4_1774374302082.png", cardImageAlt: "Gaming cover", heroImageSrc: "/images/tees/fiction_vibe_4_1774374302082.png", heroImageAlt: "Gaming hero", sort_order: 180 },
  { slug: "anime", feeling_slug: "fiction", name: "Anime", blurb: "Character-led graphics and fandom-first styling.", cardImageSrc: "/images/tees/fiction_vibe_5_1774374319387.png", cardImageAlt: "Anime cover", heroImageSrc: "/images/tees/fiction_vibe_5_1774374319387.png", heroImageAlt: "Anime hero", sort_order: 190 },
]
