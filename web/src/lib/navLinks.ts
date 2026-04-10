/** Primary routes — keep header, drawer, and footer shop labels in sync. */
export const NAV_ROUTE = {
  home: { path: '/', end: true },
  collection: { path: '/feelings', end: false },
  occasions: { path: '/occasions', end: false },
  about: { path: '/about', end: false },
  search: { path: '/search', end: false },
  cart: { path: '/cart', end: false },
} as const;

export const NAV_PRIMARY_ROUTE_KEYS = ['collection', 'occasions', 'about'] as const;

export type NavRouteKey = keyof typeof NAV_ROUTE;

export const NAV_DRAWER_ROUTE_KEYS = ['home', 'collection', 'occasions', 'about', 'search'] as const;
