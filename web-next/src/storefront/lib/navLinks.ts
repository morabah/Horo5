/** Primary routes — keep header, drawer, and footer shop labels in sync. */
export const NAV_ROUTE = {
  home: { path: '/', end: true },
  products: { path: '/products', end: false },
  collection: { path: '/feelings', end: false },
  occasions: { path: '/occasions', end: false },
  gifts: { path: '/gifts', end: false },
  drops: { path: '/drops', end: false },
  about: { path: '/about', end: false },
  search: { path: '/search', end: false },
  cart: { path: '/cart', end: false },
  sizeGuide: { path: '/size-guide', end: false },
} as const;

export const NAV_PRIMARY_ROUTE_KEYS = ['products', 'collection', 'gifts', 'about', 'sizeGuide'] as const;

export type NavRouteKey = keyof typeof NAV_ROUTE;

export const NAV_DRAWER_ROUTE_KEYS = ['home', 'products', 'collection', 'gifts', 'occasions', 'about', 'sizeGuide', 'search'] as const;
