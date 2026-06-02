/** Primary routes — keep header, drawer, and footer shop labels in sync. */
export const NAV_ROUTE = {
  home: { path: '/', end: true },
  products: { path: '/products', end: false },
  shopByMeaning: { path: '/#shop-by-meaning', end: false },
  gifts: { path: '/gifts', end: false },
  zodiac: { path: '/feelings/zodiac', end: false },
  about: { path: '/about', end: false },
  search: { path: '/search', end: false },
  cart: { path: '/cart', end: false },
  sizeGuide: { path: '/size-guide', end: false },

  // Legacy/deeper browse routes kept for later restoration after the catalog grows.
  // collection: { path: '/feelings', end: false },
  // occasions: { path: '/occasions', end: false },
  // gifts: { path: '/gifts', end: false },
  // drops: { path: '/drops', end: false },
} as const;

export const NAV_PRIMARY_ROUTE_KEYS = [
  'products',
  'shopByMeaning',
  'gifts',
  'about',
  'sizeGuide',
] as const;

export type NavRouteKey = keyof typeof NAV_ROUTE;

export const NAV_DRAWER_ROUTE_KEYS = [
  'home',
  'products',
  'shopByMeaning',
  'gifts',
  'about',
  'sizeGuide',
  'search',
] as const;

/** Launch nav keys allowed in header/drawer during founding drop. */
export const LAUNCH_NAV_KEYS = new Set<NavRouteKey>([
  'products',
  'shopByMeaning',
  'gifts',
  'about',
  'sizeGuide',
  'home',
  'search',
]);
