/** Primary routes — keep header, drawer, and footer shop labels in sync. */
export const NAV_ROUTE = {
  collection: { path: '/vibes', label: 'Collection' },
  occasions: { path: '/occasions', label: 'Occasions' },
  about: { path: '/about', label: 'About' },
} as const;

export const NAV_PRIMARY_SHORTCUTS = [
  NAV_ROUTE.collection,
  NAV_ROUTE.occasions,
  NAV_ROUTE.about,
] as const;

export type NavDrawerLink = { path: string; label: string; end?: boolean };

export const NAV_DRAWER_LINKS: readonly NavDrawerLink[] = [
  { path: '/', label: 'Home', end: true },
  NAV_ROUTE.collection,
  NAV_ROUTE.occasions,
  NAV_ROUTE.about,
  { path: '/search', label: 'Search' },
];
