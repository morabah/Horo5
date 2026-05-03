/**
 * Extra localized / colloquial tokens merged into `expandQueryVariants` (search/view.ts).
 * Values are expansion phrases scored against catalog text — not SQL column names.
 */
export const SEARCH_SYNONYMS_SCHEMA: Record<string, readonly string[]> = {
  tshirt: ['graphic tee', 't shirt', 't-shirt', 'tee'],
  tee: ['graphic tee', 't shirt'],
  shirt: ['graphic tee', 't shirt'],
  تيشيرت: ['graphic tee', 't shirt', 'tee'],
  تيشرت: ['graphic tee', 't shirt'],
  obsidian: ['black', 'dark', 'midnight'],
  black: ['obsidian', 'midnight', 'dark tee'],
  'أسود': ['obsidian', 'black', 'midnight'],
  papyrus: ['off white', 'cream', 'natural'],
  white: ['papyrus', 'clean white', 'natural tee'],
  egp: ['price', 'egypt', 'cairo'],
  cairo: ['egypt', 'shipping', 'giza'],
  giza: ['cairo', 'egypt'],
  oversized: ['relaxed unisex fit', 'quiet revolt', 'loose fit'],
  birthday: ['birthday pick', 'gift something real'],
  ramadan: ['eid and ramadan', 'eid', 'festive'],
} as const;
