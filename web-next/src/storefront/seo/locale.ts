export const SEO_SITE_LOCALES = ['en', 'ar'] as const;

export type SeoSiteLocale = (typeof SEO_SITE_LOCALES)[number];

type LocalizedPathname = {
  locale: SeoSiteLocale;
  pathname: string;
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash !== '/' && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export function stripLocalePrefix(pathname: string): LocalizedPathname {
  const normalizedPathname = normalizePathname(pathname);

  for (const locale of SEO_SITE_LOCALES) {
    if (locale === 'en') continue;
    if (normalizedPathname === `/${locale}`) return { locale, pathname: '/' };
    if (normalizedPathname.startsWith(`/${locale}/`)) {
      return {
        locale,
        pathname: normalizePathname(normalizedPathname.slice(locale.length + 1)),
      };
    }
  }

  return { locale: 'en', pathname: normalizedPathname };
}

export function buildLocalePath(pathname: string, locale: SeoSiteLocale): string {
  const normalizedPathname = normalizePathname(pathname);
  if (locale === 'en') return normalizedPathname;
  if (normalizedPathname === '/') return `/${locale}`;
  return `/${locale}${normalizedPathname}`;
}
