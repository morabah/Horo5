import { HOME_DEFAULT_SECTIONS } from '@/storefront/pages/Home';

describe('Home default sections', () => {
  it('uses editorial hybrid section order', () => {
    expect([...HOME_DEFAULT_SECTIONS]).toEqual([
      'hero',
      'primary_routes',
      'trust_ribbon',
      'founding_drop',
      'feeling_grid',
      'editorial_feature',
      'our_story',
      'seen_on_you',
      'recently_viewed',
    ]);
  });
});
