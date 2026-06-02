import { pickHomeCardImageSrc } from '../images';
import type { Product } from '../catalog-types';

function product(partial: Partial<Product> & Pick<Product, 'slug' | 'name'>): Product {
  return {
    occasionSlugs: [],
    priceEgp: 699,
    ...partial,
  } as Product;
}

describe('pickHomeCardImageSrc', () => {
  it('prefers media.card over main', () => {
    const src = pickHomeCardImageSrc(
      product({
        slug: 'calm-inside',
        name: 'Calm Inside',
        media: {
          card: 'https://cdn.example/card-front.jpg',
          main: 'https://cdn.example/back.jpg',
        },
      }),
    );
    expect(src).toBe('https://cdn.example/card-front.jpg');
  });

  it('prefers lifestyle-tagged gallery over flat_lay URL', () => {
    const src = pickHomeCardImageSrc(
      product({
        slug: 'test',
        name: 'Test',
        media: {
          main: 'https://cdn.example/tee-back.jpg',
          gallery: [
            { url: 'https://cdn.example/tee-flat_lay.jpg', tag: 'flat_lay' },
            { url: 'https://cdn.example/on-body.jpg', tag: 'lifestyle' },
          ],
        },
      }),
    );
    expect(src).toBe('https://cdn.example/on-body.jpg');
  });

  it('skips gallery items tagged back even without back in the URL', () => {
    const src = pickHomeCardImageSrc(
      product({
        slug: 'test',
        name: 'Test',
        media: {
          main: 'https://cdn.example/IMG_9968.jpg',
          gallery: [
            { url: 'https://cdn.example/IMG_9968.jpg', tag: 'back' },
            { url: 'https://cdn.example/art-front.jpg', tag: 'artwork_detail' },
          ],
        },
      }),
    );
    expect(src).toBe('https://cdn.example/art-front.jpg');
  });

  it('skips back-like URLs when safer gallery exists', () => {
    const src = pickHomeCardImageSrc(
      product({
        slug: 'test',
        name: 'Test',
        media: {
          main: 'https://cdn.example/product-back.png',
          gallery: [{ url: 'https://cdn.example/product-front.png' }],
        },
      }),
    );
    expect(src).toBe('https://cdn.example/product-front.png');
  });
});
