import type { Product } from '../../data/catalog-types';
import {
  getLaunchGroup,
  productMatchesLaunchCategory,
} from '../launch-taxonomy-display';

const moodProduct: Product = {
  slug: 'i-care-tee',
  name: 'I Care',
  artistSlug: 'nada-ibrahim',
  feelingSlug: 'mood',
  occasionSlugs: [],
  priceEgp: 799,
  story: 'test',
  launchGroup: 'mood',
  launchAudience: 'unisex',
  launchDesign: 'i-care',
};

const lifestyleProduct: Product = {
  slug: 'walk-alone-tee',
  name: 'Walk Alone',
  artistSlug: 'nada-ibrahim',
  feelingSlug: 'mood',
  occasionSlugs: [],
  priceEgp: 799,
  story: 'test',
  launchGroup: 'lifestyle',
  launchAudience: 'unisex',
  launchDesign: 'walk-alone',
};

describe('launch-taxonomy-display', () => {
  it('filters mood-lifestyle category to mood and lifestyle groups', () => {
    expect(productMatchesLaunchCategory(moodProduct, 'mood-lifestyle')).toBe(true);
    expect(productMatchesLaunchCategory(lifestyleProduct, 'mood-lifestyle')).toBe(true);
    expect(productMatchesLaunchCategory(moodProduct, 'lifestyle')).toBe(false);
  });

  it('uses slug fallback for mood products missing launchGroup', () => {
    const fallback: Product = {
      ...moodProduct,
      launchGroup: undefined,
      slug: 'i-care-graphic-tee',
    };
    expect(getLaunchGroup(fallback)).toBe('mood');
  });
});
