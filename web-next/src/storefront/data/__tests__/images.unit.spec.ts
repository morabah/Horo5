import {
  imgUrl,
  resolveProductImageSrcForDisplay,
  useNextImageOptimizerForSrc,
} from '../images';

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

  it('leaves root-relative paths when Medusa origin is missing', () => {
    delete process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    expect(resolveProductImageSrcForDisplay('/images/local.png')).toBe('/images/local.png');
  });
});

describe('useNextImageOptimizerForSrc', () => {
  it('uses next/image for same-origin paths and Unsplash only', () => {
    expect(useNextImageOptimizerForSrc('/images/tees/x.png')).toBe(true);
    expect(useNextImageOptimizerForSrc('https://images.unsplash.com/p')).toBe(true);
    expect(useNextImageOptimizerForSrc('https://r2.example.com/obj')).toBe(false);
    expect(useNextImageOptimizerForSrc('http://localhost:9000/static/a.jpg')).toBe(false);
  });
});
