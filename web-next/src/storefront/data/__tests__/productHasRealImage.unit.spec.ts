import { productHasRealImage } from '../catalog-queries';
import type { Product } from '../catalog-types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: 'test-tee',
    name: 'Test Tee',
    artistSlug: 'artist-a',
    occasionSlugs: [],
    feelingSlug: 'mood',
    priceEgp: 800,
    story: '',
    variantsBySize: {},
    ...overrides,
  } as Product;
}

describe('productHasRealImage', () => {
  it('returns true when card image is present', () => {
    const product = makeProduct({ media: { card: 'https://cdn.horo.eg/card.jpg' } });
    expect(productHasRealImage(product)).toBe(true);
  });

  it('returns true when main image is present', () => {
    const product = makeProduct({ media: { main: 'https://cdn.horo.eg/main.jpg' } });
    expect(productHasRealImage(product)).toBe(true);
  });

  it('returns true when gallery has a valid entry', () => {
    const product = makeProduct({
      media: { gallery: [{ url: 'https://cdn.horo.eg/gallery.jpg' }] },
    });
    expect(productHasRealImage(product)).toBe(true);
  });

  it('returns false when media is empty', () => {
    const product = makeProduct({ media: {} });
    expect(productHasRealImage(product)).toBe(false);
  });

  it('returns false when media is undefined', () => {
    const product = makeProduct();
    expect(productHasRealImage(product)).toBe(false);
  });

  it('returns false when gallery entries have no url', () => {
    const product = makeProduct({
      media: { gallery: [{ url: '' }, { url: null as unknown as string }] },
    });
    expect(productHasRealImage(product)).toBe(false);
  });
});
