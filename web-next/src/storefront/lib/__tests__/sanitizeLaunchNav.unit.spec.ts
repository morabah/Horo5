import { sanitizeLaunchNav } from '../sanitizeLaunchNav';

describe('sanitizeLaunchNav', () => {
  it('drops zodiac nav items and legacy gifts links', () => {
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

    expect(items.map((item) => item.key)).toEqual(['products']);
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
