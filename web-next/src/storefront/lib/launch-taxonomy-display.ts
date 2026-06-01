import type { HoroLaunchGroup, Product } from '../data/catalog-types';

export type ResolvedLaunchGroup = HoroLaunchGroup | 'unknown';

export type LaunchCategoryFilter = 'mood-lifestyle' | 'mood' | 'lifestyle' | 'zodiac' | null;

const ZODIAC_SIGN_ORDER = ['gemini', 'cancer', 'leo', 'virgo'] as const;
const AUDIENCE_ORDER = ['women', 'men', 'unisex'] as const;

/** Resolve launch group with migration fallbacks while metadata is being entered. */
export function getLaunchGroup(product: Product): ResolvedLaunchGroup {
  if (product.launchGroup) return product.launchGroup;
  if (product.feelingSlug === 'zodiac' || product.lineSlug === 'zodiac') return 'zodiac_capsule';
  if (product.slug.includes('care') || product.launchDesign === 'i-care' || product.launchDesign === 'i-dont-care') {
    return 'mood';
  }
  if (product.slug.includes('walk-alone') || product.launchDesign === 'walk-alone') return 'lifestyle';
  return 'unknown';
}

export function parseLaunchCategoryFilter(raw: string | null): LaunchCategoryFilter {
  const value = raw?.trim();
  if (value === 'mood-lifestyle' || value === 'mood' || value === 'lifestyle' || value === 'zodiac') {
    return value;
  }
  return null;
}

export function productMatchesLaunchCategory(product: Product, category: LaunchCategoryFilter): boolean {
  if (!category) return true;
  const group = getLaunchGroup(product);
  switch (category) {
    case 'mood-lifestyle':
      return group === 'mood' || group === 'lifestyle';
    case 'mood':
      return group === 'mood';
    case 'lifestyle':
      return group === 'lifestyle';
    case 'zodiac':
      return group === 'zodiac_capsule';
    default:
      return true;
  }
}

export function launchCategoryFilterLabel(category: LaunchCategoryFilter, locale: 'en' | 'ar'): string | null {
  if (!category) return null;
  if (locale === 'ar') {
    switch (category) {
      case 'mood-lifestyle':
        return 'مزاج ونمط حياة';
      case 'mood':
        return 'مزاج';
      case 'lifestyle':
        return 'نمط حياة';
      case 'zodiac':
        return 'كبسولة الأبراج';
      default:
        return null;
    }
  }
  switch (category) {
    case 'mood-lifestyle':
      return 'Mood & Lifestyle';
    case 'mood':
      return 'Mood';
    case 'lifestyle':
      return 'Lifestyle';
    case 'zodiac':
      return 'Sign Capsule';
    default:
      return null;
  }
}

const DESIGN_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  'i-care': 'I Care',
  'i-dont-care': "I Don't Care",
  'walk-alone': 'Walk Alone',
};

const GROUP_LABELS: Record<HoroLaunchGroup, string> = {
  zodiac_capsule: 'Sign Capsule',
  mood: 'Mood',
  lifestyle: 'Lifestyle',
};

const AUDIENCE_LABELS: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex',
};

export function launchDesignLabel(design: Product['launchDesign']): string | null {
  if (!design) return null;
  return DESIGN_LABELS[design] ?? null;
}

export function launchProductEyebrow(product: Product): string | null {
  const group = getLaunchGroup(product);
  if (group === 'unknown') return null;

  const parts: string[] = [];
  const design = launchDesignLabel(product.launchDesign);
  if (design) parts.push(design);
  parts.push(GROUP_LABELS[group]);
  if (product.launchAudience) {
    parts.push(AUDIENCE_LABELS[product.launchAudience] ?? product.launchAudience);
  } else if (group === 'zodiac_capsule') {
    const slug = product.slug.toLowerCase();
    if (slug.includes('-men') || slug.includes('-male')) parts.push('Men');
    else if (slug.includes('-women') || slug.includes('-female')) parts.push('Women');
  } else if (group === 'mood' || group === 'lifestyle') {
    parts.push('Unisex');
  }
  return parts.join(' · ');
}

export function compareLaunchProducts(a: Product, b: Product): number {
  const groupA = getLaunchGroup(a);
  const groupB = getLaunchGroup(b);
  const groupOrder: Record<ResolvedLaunchGroup, number> = {
    zodiac_capsule: 0,
    mood: 1,
    lifestyle: 2,
    unknown: 3,
  };
  const groupDiff = groupOrder[groupA] - groupOrder[groupB];
  if (groupDiff !== 0) return groupDiff;

  if (groupA === 'zodiac_capsule') {
    const signA = a.zodiacSign ?? a.launchDesign ?? '';
    const signB = b.zodiacSign ?? b.launchDesign ?? '';
    const signDiff =
      ZODIAC_SIGN_ORDER.indexOf(signA as (typeof ZODIAC_SIGN_ORDER)[number]) -
      ZODIAC_SIGN_ORDER.indexOf(signB as (typeof ZODIAC_SIGN_ORDER)[number]);
    if (signDiff !== 0) return signDiff;
    const audA = a.launchAudience ?? (a.slug.includes('-men') ? 'men' : a.slug.includes('-women') ? 'women' : 'unisex');
    const audB = b.launchAudience ?? (b.slug.includes('-men') ? 'men' : b.slug.includes('-women') ? 'women' : 'unisex');
    return (
      AUDIENCE_ORDER.indexOf(audA as (typeof AUDIENCE_ORDER)[number]) -
      AUDIENCE_ORDER.indexOf(audB as (typeof AUDIENCE_ORDER)[number])
    );
  }

  return a.name.localeCompare(b.name);
}

export const LAUNCH_GROUP_SECTION_ORDER: ResolvedLaunchGroup[] = [
  'zodiac_capsule',
  'mood',
  'lifestyle',
  'unknown',
];
