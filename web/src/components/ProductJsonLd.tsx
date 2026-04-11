import { Helmet } from 'react-helmet-async';
import { getProductPdpGallery, getProductMedia } from '../data/images';
import { getFeeling, getOccasion, getProduct } from '../data/site';
import { getSiteUrl } from '../seo/siteUrl';

function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

type Props = { slug: string };

export function buildProductJsonLd(slug: string) {
  const product = getProduct(slug);
  if (!product) return null;

  const siteUrl = getSiteUrl();
  const media = getProductMedia(product.slug);
  const gallery = getProductPdpGallery(product.name, product.slug);
  const imageUrls = Array.from(
    new Set([media.main, ...gallery.map((view) => view.src)].map((src) => src.split('?')[0])),
  ).map((imagePath) => (siteUrl ? `${siteUrl}${imagePath}` : imagePath));
  const productUrl = siteUrl ? `${siteUrl}/products/${product.slug}` : `/products/${product.slug}`;
  const feeling = getFeeling(product.primaryFeelingSlug ?? product.feelingSlug);
  const occasionNames = product.occasionSlugs
    .map((occasionSlug) => getOccasion(occasionSlug)?.name)
    .filter(Boolean);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.story,
    image: imageUrls,
    sku: product.slug,
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: 'HORO Egypt',
    },
    ...(feeling ? { category: `${feeling.name} graphic tee` } : {}),
    ...(occasionNames.length > 0 ? { keywords: occasionNames.join(', ') } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EGP',
      price: String(product.priceEgp),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return ld;
}

export function ProductJsonLd({ slug }: Props) {
  const ld = buildProductJsonLd(slug);
  if (!ld) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{jsonLdString(ld)}</script>
    </Helmet>
  );
}
