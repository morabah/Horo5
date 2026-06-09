export type PlpShortcutMatch = 'all' | 'category' | 'gift' | 'sort';

export type PlpCategoryShortcut = {
  key: string;
  label: { en: string; ar: string };
  href: string;
  match: PlpShortcutMatch;
  /** Query param value for category match, e.g. walk-alone */
  categoryValue?: string;
  /** Query param for sort match */
  sortValue?: string;
  /** Highlight as primary pill (e.g. New In) */
  accent?: boolean;
  /** Show in footer shop column */
  showInFooter?: boolean;
  /** Show in home / PLP pill strips */
  showInPills?: boolean;
  /** Show in nav drawer shortcut row */
  showInDrawer?: boolean;
  /** Show in collection trio primary routes */
  showInPrimaryRoutes?: boolean;
};

export const PLP_CATEGORY_SHORTCUTS: readonly PlpCategoryShortcut[] = [
  {
    key: 'new_in',
    label: { en: 'New In', ar: 'جديد' },
    href: '/products?sort=new',
    match: 'sort',
    sortValue: 'new',
    accent: true,
    showInPills: true,
    showInDrawer: true,
  },
  {
    key: 'all',
    label: { en: 'All', ar: 'الكل' },
    href: '/products',
    match: 'all',
    showInPills: true,
    showInDrawer: true,
  },
  {
    key: 'walk_alone',
    label: { en: 'Walk Alone', ar: 'امشي لوحدك' },
    href: '/products?category=walk-alone',
    match: 'category',
    categoryValue: 'walk-alone',
  },
  {
    key: 'i_care',
    label: { en: 'I Care', ar: 'اهتم' },
    href: '/products?category=i-care',
    match: 'category',
    categoryValue: 'i-care',
  },
  {
    key: 'i_dont_care',
    label: { en: "I Don't Care", ar: 'مش فارق' },
    href: '/products?category=i-dont-care',
    match: 'category',
    categoryValue: 'i-dont-care',
  },
  {
    key: 'zodiac',
    label: { en: 'Zodiac', ar: 'الأبراج' },
    href: '/products?category=zodiac',
    match: 'category',
    categoryValue: 'zodiac',
  },
  {
    key: 'gifts',
    label: { en: 'Gifts', ar: 'الهدايا' },
    href: '/gifts',
    match: 'gift',
    showInPills: true,
    showInDrawer: true,
    showInFooter: true,
  },
] as const;

export function plpShortcutsForSurface(
  surface: 'pills' | 'drawer' | 'footer' | 'primaryRoutes',
): PlpCategoryShortcut[] {
  const flag =
    surface === 'pills'
      ? 'showInPills'
      : surface === 'drawer'
        ? 'showInDrawer'
        : surface === 'footer'
          ? 'showInFooter'
          : 'showInPrimaryRoutes';
  return PLP_CATEGORY_SHORTCUTS.filter((shortcut) => shortcut[flag] === true);
}

export function shortcutLabel(shortcut: PlpCategoryShortcut, locale: 'en' | 'ar'): string {
  return locale === 'ar' ? shortcut.label.ar : shortcut.label.en;
}

export function isShortcutActive(
  shortcut: PlpCategoryShortcut,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (shortcut.match === 'gift') {
    return pathname === '/gifts' || pathname.startsWith('/gifts/');
  }
  if (shortcut.match === 'all') {
    return pathname === '/products' && !searchParams.get('category') && !searchParams.get('sort');
  }
  if (shortcut.match === 'sort') {
    const sort = searchParams.get('sort');
    if (pathname !== '/products') return false;
    if (shortcut.sortValue === 'new') {
      return sort === 'new' || sort === 'newest';
    }
    return sort === shortcut.sortValue;
  }
  if (shortcut.match === 'category' && shortcut.categoryValue) {
    return pathname === '/products' && searchParams.get('category') === shortcut.categoryValue;
  }
  return false;
}
