import type { HoroLaunchGroup, Product } from '../data/catalog-types';

export type ResolvedLaunchGroup = HoroLaunchGroup | 'unknown';

export type LaunchCategoryFilter =
  | 'mood-lifestyle'
  | 'mood'
  | 'lifestyle'
  | 'zodiac'
  | 'walk-alone'
  | 'i-care'
  | 'i-dont-care'
  | null;

const DESIGN_CATEGORY_SLUGS = ['walk-alone', 'i-care', 'i-dont-care'] as const;
export type LaunchDesignCategoryFilter = (typeof DESIGN_CATEGORY_SLUGS)[number];

function isDesignCategoryFilter(value: string): value is LaunchDesignCategoryFilter {
  return (DESIGN_CATEGORY_SLUGS as readonly string[]).includes(value);
}

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
  if (
    value === 'mood-lifestyle' ||
    value === 'mood' ||
    value === 'lifestyle' ||
    value === 'zodiac' ||
    isDesignCategoryFilter(value ?? '')
  ) {
    return value as LaunchCategoryFilter;
  }
  return null;
}

export function isLaunchDesignCategoryFilter(
  category: LaunchCategoryFilter,
): category is LaunchDesignCategoryFilter {
  return category === 'walk-alone' || category === 'i-care' || category === 'i-dont-care';
}

export function productMatchesLaunchCategory(product: Product, category: LaunchCategoryFilter): boolean {
  if (!category) return true;
  if (isLaunchDesignCategoryFilter(category)) {
    return product.launchDesign === category;
  }
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
      case 'walk-alone':
        return 'امشي لوحدك';
      case 'i-care':
        return 'اهتم';
      case 'i-dont-care':
        return 'مش فارق';
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
    case 'walk-alone':
      return 'Walk Alone';
    case 'i-care':
      return 'I Care';
    case 'i-dont-care':
      return "I Don't Care";
    default:
      return null;
  }
}

/** Entertainment-only framing — not fortune-telling (audit P3.2). */
export const ZODIAC_SIGN_DATE_RANGES: Record<string, { en: string; ar: string }> = {
  gemini: { en: 'May 21 – Jun 20', ar: '21 مايو – 20 يونيو' },
  cancer: { en: 'Jun 21 – Jul 22', ar: '21 يونيو – 22 يوليو' },
  leo: { en: 'Jul 23 – Aug 22', ar: '23 يوليو – 22 أغسطس' },
  virgo: { en: 'Aug 23 – Sep 22', ar: '23 أغسطس – 22 سبتمبر' },
};

export function zodiacSignDateRangeLabel(sign: string | undefined, locale: 'en' | 'ar'): string | null {
  if (!sign) return null;
  const entry = ZODIAC_SIGN_DATE_RANGES[sign];
  return entry ? entry[locale] : null;
}

export function zodiacEntertainmentDisclaimer(locale: 'en' | 'ar'): string {
  return locale === 'ar'
    ? 'للمرح والشخصية فقط — مش تنبؤات ولا حظ.'
    : 'For fun and personality only — not predictions or fortune-telling.';
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

/** Card badge: sign name + optional date range for zodiac capsule products. */
export function zodiacCardBadgeLabel(product: Product, locale: 'en' | 'ar'): string | null {
  if (getLaunchGroup(product) !== 'zodiac_capsule') return null;
  const sign = product.zodiacSign ?? product.launchDesign;
  const name = sign ? launchDesignLabel(sign as Product['launchDesign']) ?? sign : null;
  if (!name) return null;
  const dates = zodiacSignDateRangeLabel(sign, locale);
  return dates ? `${name} · ${dates}` : name;
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
