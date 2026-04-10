/** Mock catalog — wireframe-aligned placeholders */

/** Brand Guidelines v2.6 §6.1 — Shop by Feeling pillars */
export type Feeling = {
  slug: string;
  name: string;
  tagline: string;
  accent: string;
  manifesto?: string;
};

export const feelings: Feeling[] = [
  {
    slug: 'soft-quiet',
    name: 'Soft / Quiet',
    tagline: 'For reflective moods, slower days, and calmer styling.',
    accent: '#6A5B76',
    manifesto:
      'Pieces for when you want a quiet statement — understated gifting, slower days, and feelings you do not have to explain loudly.',
  },
  {
    slug: 'bold-electric',
    name: 'Bold / Electric',
    tagline: 'For going out, visible statements, and higher-contrast pieces.',
    accent: '#B77A67',
    manifesto:
      'For nights when you want the graphic to do the talking — social energy, city evenings, and clear presence without noise for noise’s sake.',
  },
  {
    slug: 'warm-romantic',
    name: 'Warm / Romantic',
    tagline: 'For affectionate gifting, birthdays, and emotionally open pieces.',
    accent: '#C5A15C',
    manifesto:
      'Chosen for the person on your mind — birthdays, thoughtful gifts, and pieces that feel intimate without sounding theatrical.',
  },
  {
    slug: 'grounded-everyday',
    name: 'Grounded / Everyday',
    tagline: 'For repeat wear, daily reset, and versatile styling.',
    accent: '#7D8771',
    manifesto:
      'The repeat-wear layer — coffee runs, creative work, and the days you want easy confidence that still feels considered.',
  },
  {
    slug: 'playful-offbeat',
    name: 'Playful / Offbeat',
    tagline: 'For character, humor, niche references, and expressive capsules.',
    accent: '#556F73',
    manifesto:
      'For the designs with personality — story-led references, humor, and capsules that feel specific instead of generic.',
  },
];

/** @deprecated Use Feeling */
export type Vibe = Feeling;

/** @deprecated Use feelings */
export const vibes = feelings;

/** Old storefront URLs `/vibes/:slug` → `/feelings/:slug` */
export const LEGACY_VIBE_SLUG_TO_FEELING_SLUG: Record<string, string> = {
  emotions: 'soft-quiet',
  zodiac: 'warm-romantic',
  fiction: 'playful-offbeat',
  career: 'grounded-everyday',
  trends: 'bold-electric',
};

export type Occasion = {
  slug: string;
  name: string;
  blurb: string;
  cardImageSrc: string;
  cardImageAlt: string;
  heroImageSrc: string;
  heroImageAlt: string;
  isGiftOccasion: boolean;
  priceHint?: string;
};

export const occasions: Occasion[] = [
  {
    slug: 'gift-something-real',
    name: 'Gift Something Real',
    blurb: 'Curated designs with bundle option.',
    cardImageSrc: '/images/tees/bg_tee_friends_tees.png',
    cardImageAlt: 'Gift Something Real occasion — warm lifestyle image of friends in HORO tees.',
    heroImageSrc: '/images/tees/bg_tee_friends_tees.png',
    heroImageAlt: 'Gift Something Real collection hero — warm group styling in HORO graphic tees.',
    isGiftOccasion: true,
    priceHint: 'from 999 EGP (bundle)',
  },
  {
    slug: 'graduation-season',
    name: 'Graduation Season',
    blurb: 'Career pride and achievement themes.',
    cardImageSrc: '/images/tees/bg_vibe_career.png',
    cardImageAlt: 'Graduation Season occasion — career-focused lifestyle tee styling.',
    heroImageSrc: '/images/tees/career_vibe_2_1774374359412.png',
    heroImageAlt: 'Graduation Season collection hero — HORO tee styled with a polished, ambitious look.',
    isGiftOccasion: false,
    priceHint: 'from 799 EGP',
  },
  {
    slug: 'eid-and-ramadan',
    name: 'Eid & Ramadan',
    blurb: 'Seasonal capsule for the moments that matter.',
    cardImageSrc: '/images/tees/zodiac_vibe_2_1774374153203.png',
    cardImageAlt: 'Eid and Ramadan occasion — expressive HORO tee styled for a meaningful seasonal gift.',
    heroImageSrc: '/images/tees/zodiac_vibe_1_1774374128029.png',
    heroImageAlt: 'Eid and Ramadan collection hero — close editorial styling for a seasonal HORO tee.',
    isGiftOccasion: true,
    priceHint: 'Seasonal capsule',
  },
  {
    slug: 'birthday-pick',
    name: 'Birthday Pick',
    blurb: 'Personality-matched collections.',
    cardImageSrc: '/images/tees/bg_tee_man_casual.png',
    cardImageAlt: 'Birthday Pick occasion — casual graphic-tee styling suited for gift ideas.',
    heroImageSrc: '/images/tees/bg_tee_man_casual.png',
    heroImageAlt: 'Birthday Pick collection hero — editorial portrait of a model wearing a HORO tee.',
    isGiftOccasion: true,
    priceHint: 'from 799 EGP',
  },
  {
    slug: 'just-because',
    name: 'Just Because',
    blurb: 'Everyday self-treat. No reason needed.',
    cardImageSrc: '/images/tees/bg_tee_outdoor.png',
    cardImageAlt: 'Just Because occasion — outdoor lifestyle image with a HORO tee.',
    heroImageSrc: '/images/tees/bg_tee_outdoor.png',
    heroImageAlt: 'Just Because collection hero — relaxed self-treat styling in a HORO tee.',
    isGiftOccasion: false,
    priceHint: 'from 799 EGP',
  },
];

export type OccasionSlug = Occasion['slug'];

export type Artist = {
  slug: string;
  name: string;
  style: string;
  designCount: number;
};

export const artists: Artist[] = [
  { slug: 'nada-ibrahim', name: 'Nada Ibrahim', style: 'Bold linework with emotional depth.', designCount: 12 },
  { slug: 'omar-hassan', name: 'Omar Hassan', style: 'Surreal scenes blending Egyptian motifs.', designCount: 8 },
  { slug: 'layla-farid', name: 'Layla Farid', style: 'Soft gradients and cosmic symbolism.', designCount: 15 },
];

export type ProductSizeKey = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type PdpFitModel = {
  heightCm: number;
  heightImperial: string;
  sizeWorn: string;
  fitNote?: string;
};

export type WearerStory = {
  quote: string;
  author: string;
  rating?: 1 | 2 | 3 | 4 | 5;
};

export type Product = {
  slug: string;
  name: string;
  artistSlug: string;
  feelingSlug: string;
  /** Short merchandising cue for featured/home cards */
  useCase?: string;
  /** Recurring capsules (e.g. zodiac) — not top-level browse pillars §6.4 */
  capsuleSlugs?: string[];
  occasionSlugs: OccasionSlug[];
  priceEgp: number;
  story: string;
  /** Card + quick view merchandising label, e.g. "Bestseller" */
  merchandisingBadge?: string;
  /** Shown as "FEELING / FIT" in quick view */
  fitLabel?: string;
  /** Optional scarcity line in quick view */
  stockNote?: string;
  /** Per-size FOMO / inventory hints on PDP, e.g. { M: "Only 2 left" } */
  inventoryHintBySize?: Partial<Record<ProductSizeKey, string>>;
  /** If set, restricts which sizes appear in stock (search filter + PDP). Omit = all non-disabled catalog sizes. */
  availableSizes?: ProductSizeKey[];
  /** Optional on-body copy for PDP (e.g. two models). When absent, PDP uses global template + fitLabel. */
  pdpFitModels?: readonly PdpFitModel[];
  /** Optional studio / design-intent quotes — not customer reviews (no review schema emitted). */
  wearerStories?: readonly WearerStory[];
  /** Merchandising: complementary product slugs for “Style it with”. */
  complementarySlugs?: string[];
  /** Merchandising: co-purchase suggestions (1–2 slugs) for “Frequently bought together”. */
  frequentlyBoughtWithSlugs?: string[];
  /** Merchandising: social-proof style picks (1–2 slugs) for “Customers also bought”. */
  customersAlsoBoughtSlugs?: string[];
  /** Garment/tee body colors for search filtering (display labels, e.g. "Black"). */
  garmentColors?: readonly string[];
};

const PRODUCT_OCCASION_TAGS: Record<string, OccasionSlug[]> = {
  'the-weight-of-light': ['gift-something-real', 'just-because'],
  'midnight-compass': ['gift-something-real', 'graduation-season', 'eid-and-ramadan'],
  'quiet-revolt': ['gift-something-real', 'birthday-pick'],
  'cairo-thread': ['graduation-season', 'eid-and-ramadan'],
  'signal-line': ['graduation-season', 'just-because'],
  'emotions-silent-scream': ['gift-something-real', 'birthday-pick'],
  'emotions-deep-waters': ['birthday-pick'],
  'emotions-shattered-peace': ['just-because'],
  'emotions-raw-nerve': ['just-because'],
  'emotions-unspoken': ['gift-something-real', 'eid-and-ramadan'],
  'zodiac-astral-body': ['gift-something-real', 'eid-and-ramadan', 'birthday-pick'],
  'zodiac-star-alignment': ['gift-something-real', 'eid-and-ramadan'],
  'zodiac-lunar-pull': ['just-because'],
  'zodiac-solar-flare': ['birthday-pick'],
  'zodiac-cosmic-dust': ['eid-and-ramadan'],
  'fiction-neon-dreams': ['birthday-pick'],
  'fiction-dragon-scale': ['just-because'],
  'fiction-distant-suns': ['gift-something-real', 'eid-and-ramadan'],
  'fiction-cyber-ghost': ['just-because'],
  'fiction-mythic-realm': ['birthday-pick'],
  'career-hustle-hard': ['graduation-season'],
  'career-ceo-mindset': ['graduation-season', 'birthday-pick'],
  'career-climb-the-ladder': ['graduation-season'],
  'career-office-hours': ['graduation-season', 'eid-and-ramadan'],
  'career-boardroom-rebel': ['gift-something-real', 'graduation-season'],
  'trends-viral-moment': ['just-because'],
  'trends-street-culture': ['birthday-pick', 'just-because'],
  'trends-hype-check': ['gift-something-real', 'birthday-pick'],
  'trends-next-wave': ['just-because'],
  'trends-drop-culture': ['gift-something-real', 'just-because'],
};

export const products: Product[] = [
  {
    slug: 'the-weight-of-light',
    name: 'The Weight of Light',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'playful-offbeat',
    useCase: 'For quiet gifting and slower nights that still need personality.',
    garmentColors: ['Off-white'],
    priceEgp: 799,
    story: 'For the one who carries the weight of every feeling and still walks toward the light.',
    complementarySlugs: ['fiction-distant-suns', 'midnight-compass', 'emotions-unspoken'],
    frequentlyBoughtWithSlugs: ['midnight-compass'],
    customersAlsoBoughtSlugs: ['fiction-distant-suns', 'fiction-neon-dreams'],
  },
  {
    slug: 'midnight-compass',
    name: 'Midnight Compass',
    artistSlug: 'omar-hassan',
    feelingSlug: 'warm-romantic',
    useCase: 'For birthdays, shared dinners, and gifts that need emotional accuracy.',
    garmentColors: ['Black'],
    priceEgp: 799,
    story: 'For the one who finds direction in the dark.',
    merchandisingBadge: 'Bestseller',
    fitLabel: 'Regular',
    stockNote: '9 left from this illustration run',
    inventoryHintBySize: { M: 'Only 2 left', L: 'Only 4 left' },
    pdpFitModels: [
      { heightCm: 178, heightImperial: "5'10\"", sizeWorn: 'M', fitNote: 'regular fit' },
      {
        heightCm: 165,
        heightImperial: "5'5\"",
        sizeWorn: 'S',
        fitNote: 'relaxed drape on a smaller frame',
      },
    ],
    complementarySlugs: ['quiet-revolt', 'zodiac-star-alignment', 'emotions-silent-scream'],
    frequentlyBoughtWithSlugs: ['the-weight-of-light'],
    customersAlsoBoughtSlugs: ['zodiac-star-alignment', 'emotions-unspoken'],
  },
  {
    slug: 'quiet-revolt',
    name: 'Quiet Revolt',
    artistSlug: 'layla-farid',
    feelingSlug: 'soft-quiet',
    useCase: 'For everyday resets, calmer styling, and understated confidence.',
    garmentColors: ['Black'],
    priceEgp: 899,
    story: 'For the one who speaks softly and still moves rooms.',
    merchandisingBadge: 'New',
    fitLabel: 'Oversized',
    stockNote: 'Limited run — restock soon',
    availableSizes: ['S', 'M', 'L'] satisfies ProductSizeKey[],
    customersAlsoBoughtSlugs: ['cairo-thread', 'emotions-silent-scream'],
  },
  {
    slug: 'cairo-thread',
    name: 'Cairo Thread',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'grounded-everyday',
    useCase: 'For repeat wear, city days, and a gift that still feels chosen.',
    priceEgp: 799,
    story: 'For the one who wears where they’re from.',
    availableSizes: ['M', 'L', 'XL'] satisfies ProductSizeKey[],
  },
  {
    slug: 'signal-line',
    name: 'Signal Line',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'bold-electric',
    priceEgp: 799,
    story: 'For the one who catches the wave before it’s everyone’s feed.',
  },
  // --- Emotions Vibe ---
  {
    slug: 'emotions-silent-scream',
    name: 'Silent Scream',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'soft-quiet',
    priceEgp: 849,
    story: 'For the ones whose silence speaks volumes.',
  },
  {
    slug: 'emotions-deep-waters',
    name: 'Deep Waters',
    artistSlug: 'layla-farid',
    feelingSlug: 'soft-quiet',
    priceEgp: 799,
    story: 'Dive into the uncharted depths of human connection.',
  },
  {
    slug: 'emotions-shattered-peace',
    name: 'Shattered Peace',
    artistSlug: 'omar-hassan',
    feelingSlug: 'soft-quiet',
    priceEgp: 899,
    story: 'Finding beauty in the fragments.',
    merchandisingBadge: 'New',
  },
  {
    slug: 'emotions-raw-nerve',
    name: 'Raw Nerve',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'soft-quiet',
    priceEgp: 799,
    story: 'Wear it inside out.',
    fitLabel: 'Oversized',
  },
  {
    slug: 'emotions-unspoken',
    name: 'Unspoken',
    artistSlug: 'layla-farid',
    feelingSlug: 'soft-quiet',
    priceEgp: 949,
    story: 'When words fail, art speaks.',
  },
  // --- Zodiac Vibe ---
  {
    slug: 'zodiac-astral-body',
    name: 'Astral Body',
    artistSlug: 'layla-farid',
    feelingSlug: 'warm-romantic',
    priceEgp: 849,
    story: 'A cosmic map tracing your energetic blueprint.',
  },
  {
    slug: 'zodiac-star-alignment',
    name: 'Star Alignment',
    artistSlug: 'omar-hassan',
    feelingSlug: 'warm-romantic',
    priceEgp: 799,
    story: 'When the universe shifts in your favor.',
    merchandisingBadge: 'Bestseller',
  },
  {
    slug: 'zodiac-lunar-pull',
    name: 'Lunar Pull',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'warm-romantic',
    priceEgp: 799,
    story: 'Guided by the phases of the moon.',
  },
  {
    slug: 'zodiac-solar-flare',
    name: 'Solar Flare',
    artistSlug: 'omar-hassan',
    feelingSlug: 'warm-romantic',
    priceEgp: 899,
    story: 'Blazing energy that cannot be contained.',
    fitLabel: 'Regular',
  },
  {
    slug: 'zodiac-cosmic-dust',
    name: 'Cosmic Dust',
    artistSlug: 'layla-farid',
    feelingSlug: 'warm-romantic',
    priceEgp: 749,
    story: 'We are all made of the same golden starlight.',
  },
  // --- Fiction Vibe ---
  {
    slug: 'fiction-neon-dreams',
    name: 'Neon Dreams',
    artistSlug: 'omar-hassan',
    feelingSlug: 'playful-offbeat',
    priceEgp: 899,
    story: 'A cyberpunk reality painted in midnight blue.',
  },
  {
    slug: 'fiction-dragon-scale',
    name: 'Dragon Scale',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'playful-offbeat',
    priceEgp: 799,
    story: 'Armour for the modern fantasy seeker.',
    merchandisingBadge: 'Staff Pick',
  },
  {
    slug: 'fiction-distant-suns',
    name: 'Distant Suns',
    artistSlug: 'layla-farid',
    feelingSlug: 'playful-offbeat',
    priceEgp: 849,
    story: 'Looking beyond our orbit.',
  },
  {
    slug: 'fiction-cyber-ghost',
    name: 'Cyber Ghost',
    artistSlug: 'omar-hassan',
    feelingSlug: 'playful-offbeat',
    priceEgp: 949,
    story: 'Wandering the digital wasteland in style.',
    fitLabel: 'Oversized',
    stockNote: 'Almost gone',
  },
  {
    slug: 'fiction-mythic-realm',
    name: 'Mythic Realm',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'playful-offbeat',
    priceEgp: 799,
    story: 'Legends woven into every thread.',
  },
  // --- Career Vibe ---
  {
    slug: 'career-hustle-hard',
    name: 'Hustle Hard',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'grounded-everyday',
    priceEgp: 749,
    story: 'For the endless ambition.',
  },
  {
    slug: 'career-ceo-mindset',
    name: 'CEO Mindset',
    artistSlug: 'omar-hassan',
    feelingSlug: 'grounded-everyday',
    priceEgp: 899,
    story: 'Lead from the front, dress for the top.',
  },
  {
    slug: 'career-climb-the-ladder',
    name: 'Climb The Ladder',
    artistSlug: 'layla-farid',
    feelingSlug: 'grounded-everyday',
    priceEgp: 799,
    story: 'Step by step, defining your own success.',
    merchandisingBadge: 'Trending',
  },
  {
    slug: 'career-office-hours',
    name: 'Office Hours',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'grounded-everyday',
    priceEgp: 849,
    story: 'When the work speaks for itself.',
    fitLabel: 'Regular',
  },
  {
    slug: 'career-boardroom-rebel',
    name: 'Boardroom Rebel',
    artistSlug: 'omar-hassan',
    feelingSlug: 'grounded-everyday',
    priceEgp: 999,
    story: 'Disrupting the status quo intentionally.',
  },
  // --- Trends Vibe ---
  {
    slug: 'trends-viral-moment',
    name: 'Viral Moment',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'bold-electric',
    priceEgp: 799,
    story: 'Catching the algorithm before it changes.',
  },
  {
    slug: 'trends-street-culture',
    name: 'Street Culture',
    artistSlug: 'omar-hassan',
    feelingSlug: 'bold-electric',
    priceEgp: 899,
    story: 'The pavement is the runway.',
    merchandisingBadge: 'Hot',
  },
  {
    slug: 'trends-hype-check',
    name: 'Hype Check',
    artistSlug: 'layla-farid',
    feelingSlug: 'bold-electric',
    priceEgp: 849,
    story: 'Validated by the culture.',
  },
  {
    slug: 'trends-next-wave',
    name: 'Next Wave',
    artistSlug: 'nada-ibrahim',
    feelingSlug: 'bold-electric',
    priceEgp: 799,
    story: 'Riding the crest of modern streetwear.',
    fitLabel: 'Oversized',
  },
  {
    slug: 'trends-drop-culture',
    name: 'Drop Culture',
    artistSlug: 'omar-hassan',
    feelingSlug: 'bold-electric',
    priceEgp: 949,
    story: 'Here today, iconic tomorrow.',
  }
].map((product) => ({
  ...product,
  occasionSlugs: PRODUCT_OCCASION_TAGS[product.slug] ?? ['just-because'],
  ...(product.slug.startsWith('zodiac-') ? { capsuleSlugs: ['zodiac'] as const } : {}),
}));

const resolveFeelingSlug = (slug: string) => LEGACY_VIBE_SLUG_TO_FEELING_SLUG[slug] ?? slug;

export function getFeeling(slug: string) {
  return feelings.find((f) => f.slug === resolveFeelingSlug(slug));
}

/** @deprecated Use getFeeling */
export const getVibe = getFeeling;

export function productsByFeeling(feelingSlug: string) {
  const resolved = resolveFeelingSlug(feelingSlug);
  return products.filter((p) => p.feelingSlug === resolved);
}

export function getOccasion(slug: string) {
  return occasions.find((o) => o.slug === slug);
}

export function getArtist(slug: string) {
  return artists.find((a) => a.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/** @deprecated Use productsByFeeling */
export const productsByVibe = productsByFeeling;

export function productsByArtist(artistSlug: string) {
  return products.filter((p) => p.artistSlug === artistSlug);
}

export function productsByOccasion(occasionSlug: OccasionSlug) {
  return products.filter((p) => p.occasionSlugs.includes(occasionSlug));
}
