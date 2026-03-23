/** Mock catalog — wireframe-aligned placeholders */

export type Vibe = {
  slug: string;
  name: string;
  tagline: string;
  accent: string;
};

export const vibes: Vibe[] = [
  { slug: 'emotions', name: 'Emotions', tagline: 'Wear the mood you can’t put into words.', accent: '#6B4C8A' },
  { slug: 'zodiac', name: 'Zodiac', tagline: 'Your sign. Your line. Your look.', accent: '#D4A24E' },
  { slug: 'fictious', name: 'Fictious', tagline: 'Characters, worlds, and stories you can wear.', accent: '#2B7596' },
  { slug: 'career', name: 'Career', tagline: 'Ambition, identity, and the work-in-progress you.', accent: '#3A4A3F' },
  { slug: 'trends', name: 'Trends', tagline: 'What’s moving right now — before it becomes noise.', accent: '#E8593C' },
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

export type Product = {
  slug: string;
  name: string;
  artistSlug: string;
  vibeSlug: string;
  priceEgp: number;
  story: string;
};

export const products: Product[] = [
  {
    slug: 'the-weight-of-light',
    name: 'The Weight of Light',
    artistSlug: 'nada-ibrahim',
    vibeSlug: 'fictious',
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
  },
  {
    slug: 'quiet-revolt',
    name: 'Quiet Revolt',
    artistSlug: 'layla-farid',
    vibeSlug: 'emotions',
    priceEgp: 899,
    story: 'For the one who speaks softly and still moves rooms.',
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
