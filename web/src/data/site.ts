/** Mock catalog — wireframe-aligned placeholders */

export type Vibe = {
  slug: string;
  name: string;
  tagline: string;
  accent: string;
  manifesto?: string;
};

export const vibes: Vibe[] = [
  { slug: 'emotions', name: 'Emotions', tagline: 'Wear the mood you can’t put into words.', accent: '#6B4C8A', manifesto: 'For the days when words fail but feelings are loud. Explore designs that capture the unspoken and the unseen.' },
  { slug: 'zodiac', name: 'Zodiac', tagline: 'Your sign. Your line. Your look.', accent: '#D4A24E', manifesto: 'Written in the stars, woven into reality. Find the pieces that align with your cosmic blueprint and personal energy.' },
  { slug: 'fiction', name: 'Fiction', tagline: 'Characters, worlds, and stories you can wear.', accent: '#2B7596', manifesto: 'Step beyond the ordinary. A curated collection for those who carry their favorite distant worlds wherever they go.' },
  { slug: 'career', name: 'Career', tagline: 'Ambition, identity, and the work-in-progress you.', accent: '#3A4A3F', manifesto: 'Dress for the journey, not just the destination. Pieces crafted for the resilient, the ambitious, and the dreamers.' },
  { slug: 'trends', name: 'Trends', tagline: 'What’s moving right now — before it becomes noise.', accent: '#E8593C', manifesto: 'The pulse of the culture, captured in cloth. Stay ahead of the wave with designs that define the current moment.' },
];

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
  vibeSlug: string;
  occasionSlugs: OccasionSlug[];
  priceEgp: number;
  story: string;
  /** Card + quick view merchandising label, e.g. "Bestseller" */
  merchandisingBadge?: string;
  /** Shown as "VIBE / FIT" in quick view */
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
    vibeSlug: 'fiction',
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
    vibeSlug: 'zodiac',
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
    vibeSlug: 'emotions',
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
    vibeSlug: 'career',
    priceEgp: 799,
    story: 'For the one who wears where they’re from.',
    availableSizes: ['M', 'L', 'XL'] satisfies ProductSizeKey[],
  },
  {
    slug: 'signal-line',
    name: 'Signal Line',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'trends',
    priceEgp: 799,
    story: 'For the one who catches the wave before it’s everyone’s feed.',
  },
  // --- Emotions Vibe ---
  {
    slug: 'emotions-silent-scream',
    name: 'Silent Scream',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'emotions',
    priceEgp: 849,
    story: 'For the ones whose silence speaks volumes.',
  },
  {
    slug: 'emotions-deep-waters',
    name: 'Deep Waters',
    artistSlug: 'layla-farid',
    vibeSlug: 'emotions',
    priceEgp: 799,
    story: 'Dive into the uncharted depths of human connection.',
  },
  {
    slug: 'emotions-shattered-peace',
    name: 'Shattered Peace',
    artistSlug: 'omar-hassan',
    vibeSlug: 'emotions',
    priceEgp: 899,
    story: 'Finding beauty in the fragments.',
    merchandisingBadge: 'New',
  },
  {
    slug: 'emotions-raw-nerve',
    name: 'Raw Nerve',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'emotions',
    priceEgp: 799,
    story: 'Wear it inside out.',
    fitLabel: 'Oversized',
  },
  {
    slug: 'emotions-unspoken',
    name: 'Unspoken',
    artistSlug: 'layla-farid',
    vibeSlug: 'emotions',
    priceEgp: 949,
    story: 'When words fail, art speaks.',
  },
  // --- Zodiac Vibe ---
  {
    slug: 'zodiac-astral-body',
    name: 'Astral Body',
    artistSlug: 'layla-farid',
    vibeSlug: 'zodiac',
    priceEgp: 849,
    story: 'A cosmic map tracing your energetic blueprint.',
  },
  {
    slug: 'zodiac-star-alignment',
    name: 'Star Alignment',
    artistSlug: 'omar-hassan',
    vibeSlug: 'zodiac',
    priceEgp: 799,
    story: 'When the universe shifts in your favor.',
    merchandisingBadge: 'Bestseller',
  },
  {
    slug: 'zodiac-lunar-pull',
    name: 'Lunar Pull',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'zodiac',
    priceEgp: 799,
    story: 'Guided by the phases of the moon.',
  },
  {
    slug: 'zodiac-solar-flare',
    name: 'Solar Flare',
    artistSlug: 'omar-hassan',
    vibeSlug: 'zodiac',
    priceEgp: 899,
    story: 'Blazing energy that cannot be contained.',
    fitLabel: 'Regular',
  },
  {
    slug: 'zodiac-cosmic-dust',
    name: 'Cosmic Dust',
    artistSlug: 'layla-farid',
    vibeSlug: 'zodiac',
    priceEgp: 749,
    story: 'We are all made of the same golden starlight.',
  },
  // --- Fiction Vibe ---
  {
    slug: 'fiction-neon-dreams',
    name: 'Neon Dreams',
    artistSlug: 'omar-hassan',
    vibeSlug: 'fiction',
    priceEgp: 899,
    story: 'A cyberpunk reality painted in midnight blue.',
  },
  {
    slug: 'fiction-dragon-scale',
    name: 'Dragon Scale',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'fiction',
    priceEgp: 799,
    story: 'Armour for the modern fantasy seeker.',
    merchandisingBadge: 'Staff Pick',
  },
  {
    slug: 'fiction-distant-suns',
    name: 'Distant Suns',
    artistSlug: 'layla-farid',
    vibeSlug: 'fiction',
    priceEgp: 849,
    story: 'Looking beyond our orbit.',
  },
  {
    slug: 'fiction-cyber-ghost',
    name: 'Cyber Ghost',
    artistSlug: 'omar-hassan',
    vibeSlug: 'fiction',
    priceEgp: 949,
    story: 'Wandering the digital wasteland in style.',
    fitLabel: 'Oversized',
    stockNote: 'Almost gone',
  },
  {
    slug: 'fiction-mythic-realm',
    name: 'Mythic Realm',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'fiction',
    priceEgp: 799,
    story: 'Legends woven into every thread.',
  },
  // --- Career Vibe ---
  {
    slug: 'career-hustle-hard',
    name: 'Hustle Hard',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'career',
    priceEgp: 749,
    story: 'For the endless ambition.',
  },
  {
    slug: 'career-ceo-mindset',
    name: 'CEO Mindset',
    artistSlug: 'omar-hassan',
    vibeSlug: 'career',
    priceEgp: 899,
    story: 'Lead from the front, dress for the top.',
  },
  {
    slug: 'career-climb-the-ladder',
    name: 'Climb The Ladder',
    artistSlug: 'layla-farid',
    vibeSlug: 'career',
    priceEgp: 799,
    story: 'Step by step, defining your own success.',
    merchandisingBadge: 'Trending',
  },
  {
    slug: 'career-office-hours',
    name: 'Office Hours',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'career',
    priceEgp: 849,
    story: 'When the work speaks for itself.',
    fitLabel: 'Regular',
  },
  {
    slug: 'career-boardroom-rebel',
    name: 'Boardroom Rebel',
    artistSlug: 'omar-hassan',
    vibeSlug: 'career',
    priceEgp: 999,
    story: 'Disrupting the status quo intentionally.',
  },
  // --- Trends Vibe ---
  {
    slug: 'trends-viral-moment',
    name: 'Viral Moment',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'trends',
    priceEgp: 799,
    story: 'Catching the algorithm before it changes.',
  },
  {
    slug: 'trends-street-culture',
    name: 'Street Culture',
    artistSlug: 'omar-hassan',
    vibeSlug: 'trends',
    priceEgp: 899,
    story: 'The pavement is the runway.',
    merchandisingBadge: 'Hot',
  },
  {
    slug: 'trends-hype-check',
    name: 'Hype Check',
    artistSlug: 'layla-farid',
    vibeSlug: 'trends',
    priceEgp: 849,
    story: 'Validated by the culture.',
  },
  {
    slug: 'trends-next-wave',
    name: 'Next Wave',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'trends',
    priceEgp: 799,
    story: 'Riding the crest of modern streetwear.',
    fitLabel: 'Oversized',
  },
  {
    slug: 'trends-drop-culture',
    name: 'Drop Culture',
    artistSlug: 'omar-hassan',
    vibeSlug: 'trends',
    priceEgp: 949,
    story: 'Here today, iconic tomorrow.',
  }
].map((product) => ({
  ...product,
  occasionSlugs: PRODUCT_OCCASION_TAGS[product.slug] ?? ['just-because'],
}));

export function getVibe(slug: string) {
  return vibes.find((v) => v.slug === slug);
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

export function productsByVibe(vibeSlug: string) {
  return products.filter((p) => p.vibeSlug === vibeSlug);
}

export function productsByArtist(artistSlug: string) {
  return products.filter((p) => p.artistSlug === artistSlug);
}

export function productsByOccasion(occasionSlug: OccasionSlug) {
  return products.filter((p) => p.occasionSlugs.includes(occasionSlug));
}
