export type MerchEventSeed = {
  body: string
  cardImageAlt?: string
  cardImageSrc: string
  endsAt?: string
  heroImageAlt?: string
  heroImageSrc: string
  name: string
  occasionSlug?: string
  productHandles: string[]
  seoDescription?: string
  seoTitle?: string
  slug: string
  sortOrder: number
  startsAt?: string
  status: "draft" | "scheduled" | "active" | "archived"
  teaser: string
  type: string
}

export const merchEvents: MerchEventSeed[] = [
  {
    body: "A time-bound edit for gifting, launches, and sharper seasonal merchandising moments.",
    cardImageAlt: "HORO Eid drop campaign card.",
    cardImageSrc: "/images/tees/zodiac_vibe_2_1774374153203.png",
    endsAt: "2026-04-30T21:00:00.000Z",
    heroImageAlt: "HORO Eid drop campaign hero.",
    heroImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png",
    name: "Eid Gift Edit",
    occasionSlug: "eid-and-ramadan",
    productHandles: [
      "midnight-compass",
      "emotions-unspoken",
      "zodiac-astral-body",
      "zodiac-star-alignment",
      "fiction-distant-suns",
    ],
    seoDescription: "A time-bound HORO edit for Eid and Ramadan gifting moments in Egypt.",
    seoTitle: "Eid Gift Edit | HORO Egypt",
    slug: "eid-gift-edit",
    sortOrder: 10,
    startsAt: "2026-03-01T08:00:00.000Z",
    status: "active",
    teaser: "Gift-ready pieces for the moments that matter.",
    type: "seasonal",
  },
  {
    body: "A launch-led edit for new drops, proofs, and statement tees that should stay easy to browse from home and search.",
    cardImageAlt: "HORO launch week card.",
    cardImageSrc: "/images/hero/hero-model.png",
    heroImageAlt: "HORO launch week hero.",
    heroImageSrc: "/images/hero/hero-model.png",
    name: "Launch Week",
    productHandles: [
      "quiet-revolt",
      "emotions-shattered-peace",
      "fiction-neon-dreams",
      "career-climb-the-ladder",
      "trends-street-culture",
    ],
    seoDescription: "New launches and current drop highlights from HORO Egypt.",
    seoTitle: "Launch Week | HORO Egypt",
    slug: "launch-week",
    sortOrder: 20,
    startsAt: "2026-04-10T08:00:00.000Z",
    status: "active",
    teaser: "New drop momentum, kept browseable across the storefront.",
    type: "drop",
  },
]
