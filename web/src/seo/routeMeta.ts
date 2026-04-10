import { matchPath } from 'react-router-dom';
import { getFeeling, getOccasion, getProduct } from '../data/site';
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from './constants';
import { stripLocalePrefix } from './locale';

export type SeoBreadcrumbItem = {
  name: string;
  path?: string;
};

export type SeoStructuredDataDescriptor = {
  kind: 'breadcrumb';
  items: SeoBreadcrumbItem[];
};

export type RouteSeoMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  indexable: boolean;
  ogType: 'website' | 'product';
  robots?: string;
  structuredData: SeoStructuredDataDescriptor[];
};

function buildBreadcrumb(items: SeoBreadcrumbItem[]): SeoStructuredDataDescriptor[] {
  return items.length > 1 ? [{ kind: 'breadcrumb', items }] : [];
}

function indexablePage(
  canonicalPath: string,
  title: string,
  description: string,
  options?: {
    ogType?: RouteSeoMeta['ogType'];
    structuredData?: SeoStructuredDataDescriptor[];
  },
): RouteSeoMeta {
  return {
    title,
    description,
    canonicalPath,
    indexable: true,
    ogType: options?.ogType ?? 'website',
    structuredData: options?.structuredData ?? [],
  };
}

function nonIndexablePage(
  title: string,
  description: string,
  options?: {
    canonicalPath?: string;
    ogType?: RouteSeoMeta['ogType'];
    robots?: string;
  },
): RouteSeoMeta {
  return {
    title,
    description,
    canonicalPath: options?.canonicalPath,
    indexable: false,
    ogType: options?.ogType ?? 'website',
    robots: options?.robots ?? 'noindex,follow',
    structuredData: [],
  };
}

export function resolveRouteMeta(pathname: string): RouteSeoMeta {
  const { pathname: normalizedPathname } = stripLocalePrefix(pathname);
  const feelingMatch = matchPath({ path: '/feelings/:slug', end: true }, normalizedPathname);
  const productMatch = matchPath({ path: '/products/:slug', end: true }, normalizedPathname);
  const occasionMatch = matchPath({ path: '/occasions/:slug', end: true }, normalizedPathname);

  if (normalizedPathname === '/') {
    return indexablePage('/', DEFAULT_SITE_TITLE, DEFAULT_SITE_DESCRIPTION);
  }
  if (normalizedPathname === '/about') {
    return indexablePage(
      '/about',
      'About HORO Egypt | Graphic Tees & Streetwear',
      'Meet HORO Egypt, where original illustration becomes graphic tees with clear product proof, COD-friendly checkout, and exchange-ready shopping in Egypt.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]),
      },
    );
  }
  if (normalizedPathname === '/feelings') {
    return indexablePage(
      '/feelings',
      'Shop Graphic Tees by Feeling | HORO Egypt',
      'Shop HORO artist-made graphic tees by feeling and moment — soft, bold, warm, grounded, and playful edits with COD and 14-day exchange in Egypt.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Shop by Feeling', path: '/feelings' },
        ]),
      },
    );
  }
  if (feelingMatch?.params.slug) {
    const v = getFeeling(feelingMatch.params.slug);
    if (!v) return nonIndexablePage('Page not found | HORO Egypt', DEFAULT_SITE_DESCRIPTION);
    return indexablePage(
      `/feelings/${v.slug}`,
      `${v.name} Graphic Tees | HORO Egypt`,
      `Shop ${v.name.toLowerCase()} graphic tees from HORO Egypt. ${v.tagline} COD and 14-day exchange available in Egypt.`,
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Shop by Feeling', path: '/feelings' },
          { name: v.name, path: `/feelings/${v.slug}` },
        ]),
      },
    );
  }
  if (normalizedPathname === '/occasions') {
    return indexablePage(
      '/occasions',
      'Shop Graphic Tees by Occasion | HORO Egypt',
      'Shop gift-ready HORO graphic tees by occasion in Egypt. Find birthday, graduation, Eid, Ramadan, and everyday streetwear picks with COD and 14-day exchange.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Shop by Occasion', path: '/occasions' },
        ]),
      },
    );
  }
  if (occasionMatch?.params.slug) {
    const o = getOccasion(occasionMatch.params.slug);
    if (!o) return nonIndexablePage('Page not found | HORO Egypt', DEFAULT_SITE_DESCRIPTION);
    return indexablePage(
      `/occasions/${o.slug}`,
      `${o.name} Graphic Tees | HORO Egypt`,
      `Shop ${o.name} graphic tees and gift-ready streetwear from HORO Egypt. ${o.blurb} COD and 14-day exchange available in Egypt.`,
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Shop by Occasion', path: '/occasions' },
          { name: o.name, path: `/occasions/${o.slug}` },
        ]),
      },
    );
  }
  if (productMatch?.params.slug) {
    const p = getProduct(productMatch.params.slug);
    if (!p) return nonIndexablePage('Page not found | HORO Egypt', DEFAULT_SITE_DESCRIPTION);
    const feeling = getFeeling(p.feelingSlug);
    const fitLabel = p.fitLabel?.toLowerCase() === 'oversized' ? 'oversized t-shirt' : 'graphic tee';
    return indexablePage(
      `/products/${p.slug}`,
      `${p.name} Graphic Tee | HORO Egypt`,
      `Shop ${p.name}, a ${fitLabel} from HORO Egypt${feeling ? ` — ${feeling.name}` : ''}. ${p.priceEgp} EGP streetwear with COD and 14-day exchange in Egypt.`,
      {
        ogType: 'product',
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Shop by Feeling', path: '/feelings' },
          ...(feeling ? [{ name: feeling.name, path: `/feelings/${feeling.slug}` }] : []),
          { name: p.name, path: `/products/${p.slug}` },
        ]),
      },
    );
  }
  if (normalizedPathname === '/cart') {
    return nonIndexablePage(
      'Your Cart | HORO Egypt',
      'Review your HORO bag, gift options, and sizing before moving to checkout.',
      { canonicalPath: '/cart' },
    );
  }
  if (normalizedPathname === '/checkout') {
    return nonIndexablePage(
      'Checkout | HORO Egypt',
      'Complete your HORO order with delivery details, COD, and payment choices for Egypt.',
      { canonicalPath: '/checkout' },
    );
  }
  if (normalizedPathname === '/checkout/success') {
    return nonIndexablePage(
      'Order Confirmed | HORO Egypt',
      'Your HORO order is confirmed. Delivery timing and support details appear here after purchase.',
      { canonicalPath: '/checkout/success' },
    );
  }
  if (normalizedPathname === '/search') {
    return indexablePage(
      '/search',
      'Search Graphic Tees | HORO Egypt',
      'Search HORO graphic tees, feelings, moments, and gift occasions in Egypt.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Search', path: '/search' },
        ]),
      },
    );
  }
  if (normalizedPathname === '/exchange') {
    return indexablePage(
      '/exchange',
      'Exchange Policy | HORO Egypt',
      'Read HORO Egypt exchange terms, sizing guidance, and 14-day exchange details before you shop.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Exchange Policy', path: '/exchange' },
        ]),
      },
    );
  }
  if (normalizedPathname === '/privacy') {
    return indexablePage(
      '/privacy',
      'Privacy Policy | HORO Egypt',
      'Read how HORO Egypt collects, uses, and protects shopper information across browsing, checkout, and support.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ]),
      },
    );
  }
  if (normalizedPathname === '/terms') {
    return indexablePage(
      '/terms',
      'Terms of Service | HORO Egypt',
      'Review the terms for browsing, ordering, delivery, COD, and exchange on HORO Egypt.',
      {
        structuredData: buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Terms of Service', path: '/terms' },
        ]),
      },
    );
  }
  return nonIndexablePage('Page not found | HORO Egypt', DEFAULT_SITE_DESCRIPTION);
}
