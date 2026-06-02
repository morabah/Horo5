import {
  FOUNDING_DROP_LAUNCH_SLUGS,
  buildProductPdpGalleryFromProduct,
  classifyHomepageCardImageSrc,
  collectPdpGallerySources,
  conversionReferenceImageForProduct,
  isBackLikeProductImageSrc,
  isHomepageReferenceImageSrc,
  preferHomeCardDisplaySrc,
} from '../images';
import type { Product } from '../site';

function launchProduct(slug: (typeof FOUNDING_DROP_LAUNCH_SLUGS)[number], overrides: Partial<Product> = {}): Product {
  return {
    slug,
    name: slug,
    priceEgp: 899,
    launchDesign: slug,
    media: { gallery: [] },
    ...overrides,
  } as Product;
}

describe('founding drop launch card display', () => {
  it.each(FOUNDING_DROP_LAUNCH_SLUGS)('%s: homepage card is not back/flat_lay', (slug) => {
    const product = launchProduct(slug, {
      media: {
        main: `https://cdn.test/${slug}-back-view.jpg`,
        gallery: [],
      },
    });
    const cardSrc = preferHomeCardDisplaySrc(product);
    expect(isBackLikeProductImageSrc(cardSrc)).toBe(false);
    expect(['real', 'reference']).toContain(classifyHomepageCardImageSrc(cardSrc));
  });

  it.each(FOUNDING_DROP_LAUNCH_SLUGS)('%s: PDP never uses homepage reference art', (slug) => {
    const product = launchProduct(slug, {
      media: {
        main: `https://cdn.test/${slug}-front.jpg`,
        gallery: [
          { url: `https://cdn.test/${slug}-back.jpg`, tag: 'back' },
          { url: conversionReferenceImageForProduct(launchProduct(slug)), tag: 'lifestyle' },
        ],
      },
    });
    const sources = collectPdpGallerySources(product);
    expect(sources.every((src) => !isHomepageReferenceImageSrc(src))).toBe(true);
    const gallery = buildProductPdpGalleryFromProduct(product.name, product);
    expect(gallery.every((view) => !isHomepageReferenceImageSrc(view.src))).toBe(true);
    if (sources.length > 0) {
      expect(isBackLikeProductImageSrc(gallery[0]?.src)).toBe(false);
    }
  });

  it('documents reference vs real expectation when only back catalog photo exists', () => {
    const product = launchProduct('walk-alone', {
      media: {
        main: 'https://cdn.test/walk-alone-backview.jpg',
        gallery: [],
      },
    });
    const cardSrc = preferHomeCardDisplaySrc(product);
    expect(classifyHomepageCardImageSrc(cardSrc)).toBe('reference');
    expect(cardSrc).toBe('/images/homepage-reference/product-walk-alone.png');
  });
});
