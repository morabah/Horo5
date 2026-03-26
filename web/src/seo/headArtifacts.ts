import { HORO_SUPPORT_CHANNELS } from '../data/domain-config';
import { DEFAULT_OG_IMAGE_PATH } from './constants';
import {
  resolveRouteMeta,
  type SeoBreadcrumbItem,
  type SeoStructuredDataDescriptor,
} from './routeMeta';
import { absoluteUrl, getSiteUrl } from './siteUrl';

type MetaTagDescriptor = {
  name?: string;
  property?: string;
  content: string;
};

type LinkTagDescriptor = {
  rel: string;
  href: string;
};

export type SeoHeadArtifacts = {
  title: string;
  metaTags: MetaTagDescriptor[];
  linkTags: LinkTagDescriptor[];
  jsonLd: unknown[];
};

function buildBreadcrumbJsonLd(items: SeoBreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

function resolveStructuredData(structuredData: SeoStructuredDataDescriptor[]) {
  return structuredData
    .map((entry) => {
      switch (entry.kind) {
        case 'breadcrumb':
          return buildBreadcrumbJsonLd(entry.items);
        default:
          return null;
      }
    })
    .filter(Boolean);
}

export function buildSeoHeadArtifacts(pathname: string): SeoHeadArtifacts {
  const meta = resolveRouteMeta(pathname);
  const siteUrl = getSiteUrl();
  const canonical =
    meta.canonicalPath && siteUrl ? `${siteUrl}${meta.canonicalPath === '/' ? '/' : meta.canonicalPath}` : undefined;
  const ogImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const robots = meta.robots ?? (meta.indexable ? undefined : 'noindex,follow');

  const sameAs = [HORO_SUPPORT_CHANNELS.instagramUrl].filter(Boolean) as string[];
  const routeStructuredData = resolveStructuredData(meta.structuredData);

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HORO Egypt',
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const websiteLd = siteUrl
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'HORO Egypt',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'HORO Egypt',
      };

  return {
    title: meta.title,
    metaTags: [
      { name: 'description', content: meta.description },
      ...(robots ? [{ name: 'robots', content: robots }] : []),
      { property: 'og:site_name', content: 'HORO Egypt' },
      { property: 'og:locale', content: 'en' },
      { property: 'og:type', content: meta.ogType },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      ...(ogImage ? [{ name: 'twitter:image', content: ogImage }] : []),
    ],
    linkTags: canonical ? [{ rel: 'canonical', href: canonical }] : [],
    jsonLd: [organizationLd, websiteLd, ...routeStructuredData],
  };
}
