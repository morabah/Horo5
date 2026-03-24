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
