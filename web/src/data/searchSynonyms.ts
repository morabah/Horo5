/**
 * Extra search query expansions and aliases (bilingual / colloquial).
 * Merged in `search/view.ts` with built-in maps — keep this file data-only.
 */

export const ADDITIONAL_COMMON_QUERY_EXPANSIONS: Record<string, string[]> = {
  shirt: ['graphic tee', 't shirt', 't-shirt', 'tee'],
  blouses: ['graphic tee', 't shirt'],
  top: ['graphic tee', 't shirt', 'tee'],
  tops: ['graphic tee', 't shirt'],
  black: ['obsidian', 'midnight', 'graphic tee'],
  dark: ['obsidian', 'midnight', 'graphic tee'],
  white: ['papyrus', 'clean white', 'graphic tee'],
  gift: ['gift something real', 'birthday pick', 'هدية'],
  عيد: ['eid and ramadan', 'eid', 'ramadan'],
  قطون: ['220 gsm cotton', 'cotton', 'graphic tee'],
  'تي شيرت': ['graphic tee', 't shirt', 'tee'],
  سويتشيرت: ['graphic tee', 'hoodie', 'heavyweight'],
  oversized: ['oversized', 'relaxed unisex fit', 'quiet revolt'],
  astrology: ['zodiac', 'astro', 'cosmic'],
  space: ['zodiac', 'fiction', 'cosmic'],
  office: ['career', 'work', 'professional'],
  street: ['trends', 'streetwear', 'viral'],
};

/** Merged into vibe alias map by slug (must match `vibes` in site). */
export const ADDITIONAL_VIBE_ALIASES: Record<string, string[]> = {
  emotions: ['heartfelt', 'sensitive', 'vulnerable', 'قلب', 'مشاعري'],
  zodiac: ['stars', 'moon', 'sun sign', 'برجي', 'فلكي'],
  fiction: ['sci fi', 'scifi', 'novel', 'game', 'ألعاب', 'رواية'],
  career: ['job', 'linkedin', 'promotion', 'ترقية', 'شغلي'],
  trends: ['tiktok', 'instagram', 'hypebeast', 'انستجرام'],
};

/** Optional extra occasion aliases (slug keys match `occasions` in site). */
export const ADDITIONAL_OCCASION_ALIASES: Record<string, string[]> = {
  'gift-something-real': ['valentine', 'anniversary', 'حب', 'خطوبة'],
  'graduation-season': ['convocation', 'diploma', 'شهادة'],
  'eid-and-ramadan': ['iftar', 'عيدية', 'رمضان كريم'],
  'birthday-pick': ['bday', 'عيد ميلادي'],
  'just-because': ['no reason', 'لنفسي', 'دلع'],
};
