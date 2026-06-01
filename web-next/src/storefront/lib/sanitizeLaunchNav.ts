import { LAUNCH_NAV_KEYS, NAV_ROUTE, type NavRouteKey } from './navLinks';

type LocalizedNavText = string | { en?: string; ar?: string };

export type SettingsNavItem = {
  key: string;
  label: LocalizedNavText;
  href: string;
  badge?: LocalizedNavText;
  active: boolean;
  sortOrder: number;
};

export type RenderedNavItem = {
  key: string;
  label: string;
  href: string;
  badge?: string;
  end?: boolean;
};

function localizedNavText(value: LocalizedNavText | undefined, locale: 'en' | 'ar'): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  const preferred = locale === 'ar' ? value.ar : value.en;
  const fallback = locale === 'ar' ? value.en : value.ar;
  return (preferred || fallback || '').trim() || null;
}

function isZodiacNavItem(item: SettingsNavItem, label: string): boolean {
  const href = item.href.toLowerCase();
  if (href.includes('/feelings/zodiac') || href.includes('/collections/zodiac')) return true;
  const normalizedLabel = label.toLowerCase();
  return normalizedLabel === 'zodiac' || normalizedLabel.includes('your zodiac');
}

function mapLegacyNavItem(item: SettingsNavItem, label: string): RenderedNavItem | null {
  const key = item.key.trim().toLowerCase();
  const href = item.href.trim();

  if (LAUNCH_NAV_KEYS.has(key as NavRouteKey)) {
    const route = NAV_ROUTE[key as NavRouteKey];
    return {
      key,
      label,
      href: route?.path ?? href,
      end: route ? Boolean(route.end) : undefined,
    };
  }

  switch (key) {
    case 'products':
    case 'founding_drop':
      return { key: 'products', label, href: NAV_ROUTE.products.path };
    case 'zodiac':
      return { key: 'zodiac', label, href: NAV_ROUTE.zodiac.path };
    case 'about':
      return { key: 'about', label, href: NAV_ROUTE.about.path };
    case 'size_guide':
    case 'sizeguide':
      return { key: 'sizeGuide', label, href: NAV_ROUTE.sizeGuide.path };
    case 'home':
      return { key: 'home', label, href: NAV_ROUTE.home.path, end: true };
    case 'search':
      return { key: 'search', label, href: NAV_ROUTE.search.path };
    case 'collection':
      if (isZodiacNavItem(item, label)) {
        return { key: 'zodiac', label, href: NAV_ROUTE.zodiac.path };
      }
      return null;
    case 'gifts':
    case 'occasions':
      return null;
    case 'drops':
      return { key: 'products', label, href: NAV_ROUTE.products.path };
    default:
      return null;
  }
}

/** Filter Medusa navigation settings to launch IA; drop legacy deep-browse links. */
export function sanitizeLaunchNav(
  items: SettingsNavItem[] | undefined,
  locale: 'en' | 'ar',
): RenderedNavItem[] {
  return (items ?? [])
    .filter((item) => item.active !== false && item.href.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const label = localizedNavText(item.label, locale);
      if (!label) return null;
      const mapped = mapLegacyNavItem(item, label);
      if (!mapped) return null;
      const badge = localizedNavText(item.badge, locale);
      return badge ? { ...mapped, badge } : mapped;
    })
    .filter((item): item is RenderedNavItem => item !== null);
}
