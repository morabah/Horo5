/**
 * Launch content seed data — metaobjects, collections, pages.
 * Aligned with HORO launch Admin checklist and shopify-theme/docs/HORO_DATA_CONTRACT.md.
 */

export interface FeelingSeed {
  title: string;
  slug: string;
  sortOrder: number;
  tagline?: string;
  collectionHandle: string;
}

export interface SubfeelingSeed {
  title: string;
  slug: string;
  parentFeelingSlug: string;
  sortOrder: number;
  collectionHandle: string;
}

export interface OccasionSeed {
  title: string;
  slug: string;
  sortOrder: number;
  isGiftOccasion: boolean;
  collectionHandle: string;
  tagline?: string;
}

export interface CollectionSeed {
  handle: string;
  title: string;
  descriptionHtml?: string;
}

/** Homepage hero + founding-drop section — must exist on Shopify. */
export const FOUNDING_DROP_COLLECTION: CollectionSeed = {
  handle: 'founding-drop',
  title: 'Founding Drop',
  descriptionHtml:
    '<p>The first HORO drop — Zodiac, I Care, I Don’t Care, and Walk Alone.</p>',
};

export const ZODIAC_COLLECTION: CollectionSeed = {
  handle: 'zodiac',
  title: 'Zodiac',
  descriptionHtml: '<p>Gemini, Cancer, Leo, and Virgo — with Men and Women options.</p>',
};

export const ZODIAC_MEN_COLLECTION: CollectionSeed = {
  handle: 'zodiac-men',
  title: 'Zodiac — Men',
  descriptionHtml: '<p>Gendered zodiac designs for men.</p>',
};

export const ZODIAC_WOMEN_COLLECTION: CollectionSeed = {
  handle: 'zodiac-women',
  title: 'Zodiac — Women',
  descriptionHtml: '<p>Gendered zodiac designs for women.</p>',
};

export const MOOD_LIFESTYLE_COLLECTION: CollectionSeed = {
  handle: 'mood-lifestyle',
  title: 'Mood & Lifestyle',
  descriptionHtml: '<p>I Care, I Don’t Care, and Walk Alone — unisex launch designs.</p>',
};

/** Shopify product metafield definitions for launch taxonomy (namespace: custom). */
export const LAUNCH_PRODUCT_METAFIELD_DEFINITIONS = [
  { namespace: 'custom', key: 'launch_group', name: 'Launch group', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'launch_audience', name: 'Launch audience', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'launch_design', name: 'Launch design', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'zodiac_sign', name: 'Zodiac sign', type: 'single_line_text_field' },
] as const;

/** Interim product tags when metafields are not yet populated. */
export function launchProductTags(input: {
  launchGroup: string;
  launchAudience?: string;
  launchDesign?: string;
  zodiacSign?: string;
}): string[] {
  const tags = [`launch:${input.launchGroup}`];
  if (input.launchAudience) tags.push(`audience:${input.launchAudience}`);
  if (input.launchDesign) tags.push(`design:${input.launchDesign}`);
  if (input.zodiacSign) tags.push(`zodiac:${input.zodiacSign}`);
  return tags;
}

export interface PageSeed {
  handle: string;
  title: string;
  templateSuffix: string;
  body?: string;
}

export const FEELING_SEEDS: FeelingSeed[] = [
  { title: 'Mood', slug: 'mood', sortOrder: 1, tagline: 'Wear the mood you carry', collectionHandle: 'feeling-mood' },
  { title: 'Zodiac', slug: 'zodiac', sortOrder: 2, tagline: 'Signs you wear', collectionHandle: 'feeling-zodiac' },
  { title: 'Career', slug: 'career', sortOrder: 3, tagline: 'Identity at work', collectionHandle: 'feeling-career' },
  { title: 'Fiction', slug: 'fiction', sortOrder: 4, tagline: 'Stories on cotton', collectionHandle: 'feeling-fiction' },
  { title: 'Trends', slug: 'trends', sortOrder: 5, tagline: 'What moves now', collectionHandle: 'feeling-trends' },
];

export const SUBFEELING_SEEDS: SubfeelingSeed[] = [
  { title: 'Calm', slug: 'calm', parentFeelingSlug: 'mood', sortOrder: 1, collectionHandle: 'feeling-mood-calm' },
  { title: 'Joy', slug: 'joy', parentFeelingSlug: 'mood', sortOrder: 2, collectionHandle: 'feeling-mood-joy' },
  { title: 'Aries', slug: 'aries', parentFeelingSlug: 'zodiac', sortOrder: 1, collectionHandle: 'feeling-zodiac-aries' },
  { title: 'Engineer', slug: 'engineer', parentFeelingSlug: 'career', sortOrder: 1, collectionHandle: 'feeling-career-engineer' },
];

export const OCCASION_SEEDS: OccasionSeed[] = [
  { title: 'Birthday', slug: 'birthday', sortOrder: 1, isGiftOccasion: true, collectionHandle: 'occasion-birthday', tagline: 'Celebrate them' },
  { title: 'Eid', slug: 'eid', sortOrder: 2, isGiftOccasion: true, collectionHandle: 'occasion-eid', tagline: 'Meaningful gifting' },
  { title: 'Graduation', slug: 'graduation', sortOrder: 3, isGiftOccasion: true, collectionHandle: 'occasion-graduation', tagline: 'Mark the milestone' },
  { title: 'Gift', slug: 'gift', sortOrder: 4, isGiftOccasion: true, collectionHandle: 'occasion-gift', tagline: 'Gift by meaning' },
];

/** All collection handles referenced by launch content. */
export function allCollectionSeeds(): CollectionSeed[] {
  const map = new Map<string, CollectionSeed>();

  for (const f of FEELING_SEEDS) {
    map.set(f.collectionHandle, {
      handle: f.collectionHandle,
      title: `Feeling — ${f.title}`,
      descriptionHtml: `<p>Shop HORO designs for the <strong>${f.title}</strong> feeling.</p>`,
    });
  }
  for (const s of SUBFEELING_SEEDS) {
    map.set(s.collectionHandle, {
      handle: s.collectionHandle,
      title: s.title,
      descriptionHtml: `<p>HORO pieces for <strong>${s.title}</strong>.</p>`,
    });
  }
  for (const o of OCCASION_SEEDS) {
    map.set(o.collectionHandle, {
      handle: o.collectionHandle,
      title: `Occasion — ${o.title}`,
      descriptionHtml: `<p>Gift-ready HORO picks for <strong>${o.title}</strong>.</p>`,
    });
  }

  map.set(FOUNDING_DROP_COLLECTION.handle, FOUNDING_DROP_COLLECTION);
  map.set(ZODIAC_COLLECTION.handle, ZODIAC_COLLECTION);
  map.set(ZODIAC_MEN_COLLECTION.handle, ZODIAC_MEN_COLLECTION);
  map.set(ZODIAC_WOMEN_COLLECTION.handle, ZODIAC_WOMEN_COLLECTION);
  map.set(MOOD_LIFESTYLE_COLLECTION.handle, MOOD_LIFESTYLE_COLLECTION);

  return [...map.values()];
}

export const PAGE_SEEDS: PageSeed[] = [
  {
    handle: 'feelings',
    title: 'Shop by Feeling',
    templateSuffix: 'feelings',
    body: '<p>Every HORO design starts with a feeling. Choose yours.</p>',
  },
  {
    handle: 'occasions',
    title: 'Shop by Occasion',
    templateSuffix: 'occasions',
    body: '<p>Find the design that fits the moment.</p>',
  },
  {
    handle: 'gifts-hub',
    title: 'Gifts Hub',
    templateSuffix: 'gifts-hub',
    body: '<p>Meaningful gifts, chosen by occasion and feeling.</p>',
  },
  {
    handle: 'comparison-faq',
    title: 'Why HORO — Comparison FAQ',
    templateSuffix: 'comparison-faq',
    body: '<p>How HORO compares to cheap print, custom print, fashion brands, gift shops, and marketplace sellers.</p>',
  },
  {
    handle: 'why-horo',
    title: 'Why HORO',
    templateSuffix: 'why-horo',
    body: '<p>Why HORO is artist-made wearable art — not an expensive printed tee.</p>',
  },
];
