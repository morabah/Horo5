import {
  buildProductPdpGalleryFromProduct,
  collectPdpGallerySources,
  imgUrl,
  isBackLikeProductImageSrc,
  isHomepageReferenceImageSrc,
  preferHomeCardDisplaySrc,
  resolveProductImageSrcForDisplay,
  shouldUseConversionReferenceImage,
  useNextImageOptimizerForSrc,
} from '../images';
import type { Product } from '../site';

describe('imgUrl', () => {
  it('appends Unsplash-style params only for Unsplash hosts', () => {
    const unsplash = 'https://images.unsplash.com/photo-1';
    expect(imgUrl(unsplash, 800)).toContain('w=800');
    expect(imgUrl(unsplash, 800)).toContain('fit=crop');
  });

  it('returns Medusa or generic HTTPS URLs unchanged', () => {
    const medusa = 'https://cdn.example.com/files/prod_123.jpg';
    expect(imgUrl(medusa, 800)).toBe(medusa);
  });

  it('returns relative local paths unchanged', () => {
    const local = '/images/hero/horo_vectorized_v2.svg';
    expect(imgUrl(local, 400)).toBe(local);
  });

  it('appends params for unsplash.com root host', () => {
    const u = 'https://unsplash.com/photos/abc';
    expect(imgUrl(u, 200)).toContain('w=200');
  });
});

describe('resolveProductImageSrcForDisplay', () => {
  const prev = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = prev;
    }
  });

  it('leaves absolute URLs unchanged', () => {
    expect(resolveProductImageSrcForDisplay('https://bucket.example/a.jpg')).toBe('https://bucket.example/a.jpg');
  });

  it('normalizes protocol-relative URLs to https', () => {
    expect(resolveProductImageSrcForDisplay('//cdn.example/x.png')).toBe('https://cdn.example/x.png');
  });

  it('prefixes root-relative paths when Medusa origin is set', () => {
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = 'http://localhost:9000/';
    expect(resolveProductImageSrcForDisplay('/static/abc.jpg')).toBe('http://localhost:9000/static/abc.jpg');
  });

  it('leaves local public image paths on the storefront origin even when Medusa origin is set', () => {
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = 'http://localhost:9000/';
    expect(resolveProductImageSrcForDisplay('/images/local.png')).toBe('/images/local.png');
  });
});

describe('useNextImageOptimizerForSrc', () => {
  it('uses next/image for configured storefront image hosts', () => {
    expect(useNextImageOptimizerForSrc('/images/tees/x.png')).toBe(true);
    expect(useNextImageOptimizerForSrc('https://images.unsplash.com/p')).toBe(true);
    expect(useNextImageOptimizerForSrc('https://horo5-production.up.railway.app/store-media/a.png')).toBe(true);
    expect(useNextImageOptimizerForSrc('http://localhost:9000/store-media/a.png')).toBe(false);
    expect(useNextImageOptimizerForSrc('https://r2.example.com/obj')).toBe(false);
  });
});

describe('homepage card display picks', () => {
  const baseProduct = {
    slug: 'quiet-revolt',
    name: 'Quiet Revolt',
    priceEgp: 899,
    launchDesign: 'walk-alone',
  } as Product;

  it('flags back-like catalog URLs for conversion reference', () => {
    expect(isBackLikeProductImageSrc('https://cdn.test/tee-back-view.jpg')).toBe(true);
    expect(isBackLikeProductImageSrc('https://cdn.test/tee-backview.jpg')).toBe(true);
    expect(isBackLikeProductImageSrc('https://cdn.test/product_rear.png')).toBe(true);
    expect(isBackLikeProductImageSrc('https://cdn.test/flat_lay.png')).toBe(true);
    expect(isBackLikeProductImageSrc('https://cdn.test/flat-lay.png')).toBe(true);
    expect(shouldUseConversionReferenceImage('https://cdn.test/tee-back-view.jpg')).toBe(true);
  });

  it('prefers homepage reference art when catalog main is a back photo', () => {
    const src = preferHomeCardDisplaySrc({
      ...baseProduct,
      media: {
        main: 'https://cdn.test/products/quiet-revolt-back.jpg',
        gallery: [],
      },
    });
    expect(src).toBe('/images/homepage-reference/product-walk-alone.png');
  });

  it('keeps tagged card art when it is a safe front image', () => {
    const src = preferHomeCardDisplaySrc({
      ...baseProduct,
      media: {
        card: 'https://cdn.test/products/quiet-revolt-front.jpg',
        main: 'https://cdn.test/products/quiet-revolt-back.jpg',
        gallery: [],
      },
    });
    expect(src).toBe('https://cdn.test/products/quiet-revolt-front.jpg');
  });
});

describe('PDP gallery guards', () => {
  const product = {
    slug: 'i-care',
    name: 'I Care',
    priceEgp: 899,
    media: {
      main: 'https://cdn.test/i-care-front.jpg',
      gallery: [
        { url: '/images/homepage-reference/product-i-care.png', tag: 'lifestyle' },
        { url: 'https://cdn.test/i-care-back.jpg', tag: 'back' },
      ],
    },
  } as Product;

  it('excludes homepage reference paths from PDP sources', () => {
    const sources = collectPdpGallerySources(product);
    expect(sources.every((src) => !isHomepageReferenceImageSrc(src))).toBe(true);
  });

  it('buildProductPdpGalleryFromProduct never returns reference art', () => {
    const gallery = buildProductPdpGalleryFromProduct(product.name, product);
    expect(gallery.every((view) => !isHomepageReferenceImageSrc(view.src))).toBe(true);
    expect(gallery[0]?.src).toBe('https://cdn.test/i-care-front.jpg');
  });

  it('promotes a front image ahead of back when main is back-like', () => {
    const backFirst = {
      ...product,
      media: {
        main: 'https://cdn.test/i-care-back-view.jpg',
        gallery: [{ url: 'https://cdn.test/i-care-lifestyle.jpg', tag: 'lifestyle' }],
      },
    } as Product;
    const gallery = buildProductPdpGalleryFromProduct(backFirst.name, backFirst);
    expect(isBackLikeProductImageSrc(gallery[0]?.src)).toBe(false);
  });
});
