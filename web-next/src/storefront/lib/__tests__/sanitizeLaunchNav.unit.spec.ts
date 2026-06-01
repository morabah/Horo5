import { sanitizeLaunchNav } from '../sanitizeLaunchNav';

describe('sanitizeLaunchNav', () => {
  it('maps zodiac-specific collection links and drops legacy gifts', () => {
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
          label: { en: 'Gifts' },
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

    expect(items.map((item) => item.key)).toEqual(['zodiac', 'products']);
    expect(items[0]?.href).toBe('/feelings/zodiac');
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
});
