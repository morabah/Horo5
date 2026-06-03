import type { Product } from '../../data/catalog-types';
import { getProductCardBadges } from '../productCardBadges';

const base: Product = {
  slug: 'zodiac-lunar-pull-men',
  name: 'Lunar Pull',
  artistSlug: 'nada-ibrahim',
  feelingSlug: 'zodiac',
  occasionSlugs: [],
  priceEgp: 799,
  story: 'For the one who feels the moon.',
  launchGroup: 'zodiac_capsule',
  launchDesign: 'cancer',
  zodiacSign: 'cancer',
  launchAudience: 'men',
};

describe('getProductCardBadges', () => {
  it('shows zodiac sign and date range for capsule products', () => {
    const badges = getProductCardBadges(base, 'en');
    expect(badges[0]?.key).toBe('zodiac');
    expect(badges[0]?.label).toContain('Cancer');
    expect(badges[0]?.label).toContain('Jun');
  });

  it('adds gift-ready badge when product is giftable', () => {
    const badges = getProductCardBadges({ ...base, giftable: true }, 'en');
    expect(badges.some((b) => b.key === 'gift' && b.label === 'Gift-ready')).toBe(true);
  });

  it('caps at three badges', () => {
    const badges = getProductCardBadges(
      {
        ...base,
        giftable: true,
        fitLabel: 'Relaxed unisex',
        merchandisingBadge: 'New',
      },
      'en',
    );
    expect(badges.length).toBeLessThanOrEqual(3);
  });
});
