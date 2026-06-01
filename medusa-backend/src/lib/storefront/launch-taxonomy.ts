export const HORO_LAUNCH_GROUPS = ['zodiac_capsule', 'mood', 'lifestyle'] as const;

export const HORO_LAUNCH_AUDIENCES = ['men', 'women', 'unisex'] as const;

export const HORO_LAUNCH_DESIGNS = [
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'i-care',
  'i-dont-care',
  'walk-alone',
] as const;

export const HORO_ZODIAC_SIGNS = ['gemini', 'cancer', 'leo', 'virgo'] as const;

export type HoroLaunchGroup = (typeof HORO_LAUNCH_GROUPS)[number];
export type HoroLaunchAudience = (typeof HORO_LAUNCH_AUDIENCES)[number];
export type HoroLaunchDesign = (typeof HORO_LAUNCH_DESIGNS)[number];
export type HoroZodiacSign = (typeof HORO_ZODIAC_SIGNS)[number];

export const HORO_LAUNCH_TAXONOMY_NOTE = `
Launch taxonomy:
- Main customer path: Founding Drop -> Product
- Zodiac remains a direct route because it has Men/Women options (launchAudience).
- Mood/Lifestyle designs remain unisex and should not become deep navigation pages yet.
- Legacy Mood/Lifestyle/Dream/Art taxonomy can be restored when the catalog grows.
`;

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function asLaunchGroup(value: unknown): HoroLaunchGroup | undefined {
  const raw = asTrimmedString(value);
  return raw === 'zodiac_capsule' || raw === 'mood' || raw === 'lifestyle' ? raw : undefined;
}

export function asLaunchAudience(value: unknown): HoroLaunchAudience | undefined {
  const raw = asTrimmedString(value);
  return raw === 'men' || raw === 'women' || raw === 'unisex' ? raw : undefined;
}

export function asLaunchDesign(value: unknown): HoroLaunchDesign | undefined {
  const raw = asTrimmedString(value);
  return (HORO_LAUNCH_DESIGNS as readonly string[]).includes(raw ?? '') ? (raw as HoroLaunchDesign) : undefined;
}

export function asZodiacSign(value: unknown): HoroZodiacSign | undefined {
  const raw = asTrimmedString(value);
  return (HORO_ZODIAC_SIGNS as readonly string[]).includes(raw ?? '') ? (raw as HoroZodiacSign) : undefined;
}
