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
};

export const occasions: Occasion[] = [
  { slug: 'gift-something-real', name: 'Gift Something Real', blurb: 'Curated designs with bundle option.' },
  { slug: 'graduation-season', name: 'Graduation Season', blurb: 'Career pride and achievement themes.' },
  { slug: 'eid-and-ramadan', name: 'Eid & Ramadan', blurb: 'Seasonal capsule for the moments that matter.' },
  { slug: 'birthday-pick', name: 'Birthday Pick', blurb: 'Personality-matched collections.' },
  { slug: 'just-because', name: 'Just Because', blurb: 'Everyday self-treat. No reason needed.' },
];

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

export type Product = {
  slug: string;
  name: string;
  artistSlug: string;
  vibeSlug: string;
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
};

export const products: Product[] = [
  {
    slug: 'the-weight-of-light',
    name: 'The Weight of Light',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'fiction',
    priceEgp: 799,
    story: 'For the one who carries the weight of every feeling and still walks toward the light.',
  },
  {
    slug: 'midnight-compass',
    name: 'Midnight Compass',
    artistSlug: 'omar-hassan',
    vibeSlug: 'zodiac',
    priceEgp: 799,
    story: 'For the one who finds direction in the dark.',
    merchandisingBadge: 'Bestseller',
    fitLabel: 'Regular',
    stockNote: '9 left from this illustration run',
    inventoryHintBySize: { M: 'Only 2 left', L: 'Only 4 left' },
  },
  {
    slug: 'quiet-revolt',
    name: 'Quiet Revolt',
    artistSlug: 'layla-farid',
    vibeSlug: 'emotions',
    priceEgp: 899,
    story: 'For the one who speaks softly and still moves rooms.',
    merchandisingBadge: 'New',
    fitLabel: 'Oversized',
    stockNote: 'Limited run — restock soon',
  },
  {
    slug: 'cairo-thread',
    name: 'Cairo Thread',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'career',
    priceEgp: 799,
    story: 'For the one who wears where they’re from.',
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
];

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
