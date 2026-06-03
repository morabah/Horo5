import { mergeLaunchNavWithFallback, resolveLaunchNav, sanitizeLaunchNav } from '../sanitizeLaunchNav';

describe('sanitizeLaunchNav', () => {
  it('drops zodiac nav items but keeps gift links', () => {
    const items = sanitizeLaunchNav(
      [
        {
          key: 'collection',
          label: { en: 'Zodiac' },
          href: '/feelings/zodiac',
          active: true,
          sortOrder: 0,
        },
        {
          key: 'gifts',
          label: { en: 'Gift Ready' },
          href: '/gifts',
          active: true,
          sortOrder: 1,
        },
        {
          key: 'products',
          label: { en: 'Founding Drop' },
          href: '/products',
          active: true,
          sortOrder: 2,
        },
      ],
      'en',
    );

    expect(items.map((item) => item.key)).toEqual(['gifts', 'products']);
    expect(items.map((item) => item.label)).toEqual(['Gifts', 'Shop All']);
  });

  it('drops full feelings hub collection links', () => {
    const items = sanitizeLaunchNav(
      [
        {
          key: 'collection',
          label: { en: 'Shop by Feeling' },
          href: '/feelings',
          active: true,
          sortOrder: 0,
        },
      ],
      'en',
    );

    expect(items).toHaveLength(0);
  });

  it('backfills missing required launch nav links after sanitizing', () => {
    const items = resolveLaunchNav(
      [
        {
          key: 'products',
          label: { en: 'Founding Drop' },
          href: '/products',
          active: true,
          sortOrder: 0,
        },
        {
          key: 'zodiac',
          label: { en: 'Zodiac' },
          href: '/feelings/zodiac',
          active: true,
          sortOrder: 1,
        },
      ],
      'en',
      ['products', 'about', 'sizeGuide'],
      (key) => ({
        key,
        label: key,
        href: `/${key}`,
      }),
    );

    expect(items.map((item) => item.key)).toEqual(['products', 'about', 'sizeGuide']);
    expect(items[0]?.label).toBe('Shop All');
    expect(items[1]?.label).toBe('about');
  });

  it('decodes HTML entities in nav labels', () => {
    const items = sanitizeLaunchNav(
      [
        {
          key: 'size_guide',
          label: { en: 'Size &amp; Help' },
          href: '/size-guide',
          active: true,
          sortOrder: 0,
        },
      ],
      'en',
    );

    expect(items[0]?.label).toBe('Size Guide');
  });

  it('preserves sanitized labels for keys that remain', () => {
    const items = mergeLaunchNavWithFallback(
      [{ key: 'products', label: 'Custom Drop Label', href: '/products' }],
      ['products', 'about'],
      (key) => ({ key, label: `Fallback ${key}`, href: `/${key}` }),
    );

    expect(items).toEqual([
      { key: 'products', label: 'Custom Drop Label', href: '/products' },
      { key: 'about', label: 'Fallback about', href: '/about' },
    ]);
  });
});
