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
  قطون: ['premium cotton', 'cotton', 'graphic tee'],
  'تي شيرت': ['graphic tee', 't shirt', 'tee'],
  سويتشيرت: ['graphic tee', 'hoodie', 'heavyweight'],
  oversized: ['oversized', 'relaxed unisex fit', 'quiet revolt'],
  astrology: ['soft quiet', 'warm romantic'],
  space: ['playful offbeat', 'soft quiet'],
  office: ['grounded everyday', 'work', 'professional'],
  street: ['bold electric', 'streetwear', 'viral'],
};

/** Merged into feeling alias map by slug (must match canonical feeling slugs in Medusa). */
export const ADDITIONAL_FEELING_ALIASES: Record<string, string[]> = {
  mood: ['heartfelt', 'sensitive', 'vulnerable', 'emotions', 'قلب', 'مشاعري'],
  zodiac: ['stars', 'moon', 'romantic', 'gift', 'حب', 'هدية'],
  fiction: ['sci fi', 'scifi', 'novel', 'game', 'fiction', 'ألعاب', 'رواية'],
  career: ['job', 'linkedin', 'promotion', 'career', 'ترقية', 'شغلي'],
  trends: ['tiktok', 'instagram', 'hypebeast', 'trends', 'انستجرام'],
};

/** @deprecated Use ADDITIONAL_FEELING_ALIASES */
export const ADDITIONAL_VIBE_ALIASES = ADDITIONAL_FEELING_ALIASES;

/** Optional extra occasion aliases (slug keys match `occasions` in site). */
export const ADDITIONAL_OCCASION_ALIASES: Record<string, string[]> = {
  'gift-something-real': ['valentine', 'anniversary', 'حب', 'خطوبة'],
  'graduation-season': ['convocation', 'diploma', 'شهادة'],
  'eid-and-ramadan': ['iftar', 'عيدية', 'رمضان كريم'],
  'birthday-pick': ['bday', 'عيد ميلادي'],
  'just-because': ['no reason', 'لنفسي', 'دلع'],
};
