import type { Product } from '../../data/catalog-types';
import {
  getLaunchGroup,
  parseLaunchCategoryFilter,
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

const dontCareProduct: Product = {
  slug: 'i-dont-care-tee',
  name: "I Don't Care",
  artistSlug: 'nada-ibrahim',
  feelingSlug: 'mood',
  occasionSlugs: [],
  priceEgp: 799,
  story: 'test',
  launchGroup: 'mood',
  launchAudience: 'unisex',
  launchDesign: 'i-dont-care',
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

  it('parses design collection category filters', () => {
    expect(parseLaunchCategoryFilter('walk-alone')).toBe('walk-alone');
    expect(parseLaunchCategoryFilter('i-care')).toBe('i-care');
    expect(parseLaunchCategoryFilter('i-dont-care')).toBe('i-dont-care');
    expect(parseLaunchCategoryFilter('unknown')).toBeNull();
  });

  it('filters design categories by launchDesign', () => {
    expect(productMatchesLaunchCategory(lifestyleProduct, 'walk-alone')).toBe(true);
    expect(productMatchesLaunchCategory(moodProduct, 'i-care')).toBe(true);
    expect(productMatchesLaunchCategory(dontCareProduct, 'i-dont-care')).toBe(true);
    expect(productMatchesLaunchCategory(moodProduct, 'walk-alone')).toBe(false);
  });
});
