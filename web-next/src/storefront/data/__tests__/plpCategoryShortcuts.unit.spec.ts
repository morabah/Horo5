import {
  isShortcutActive,
  PLP_CATEGORY_SHORTCUTS,
  plpShortcutsForSurface,
} from '../../data/plpCategoryShortcuts';

describe('plpCategoryShortcuts', () => {
  it('keeps small-catalog pill shortcuts product-neutral with New In first', () => {
    const pills = plpShortcutsForSurface('pills');
    expect(pills[0]?.key).toBe('new_in');
    expect(pills.map((shortcut) => shortcut.key)).toEqual(['new_in', 'all', 'gifts']);
  });

  it('marks active shortcut from pathname and query params', () => {
    const walkAlone = PLP_CATEGORY_SHORTCUTS.find((shortcut) => shortcut.key === 'walk_alone');
    expect(walkAlone).toBeDefined();
    const params = new URLSearchParams('category=walk-alone');
    expect(isShortcutActive(walkAlone!, '/products', params)).toBe(true);

    const newIn = PLP_CATEGORY_SHORTCUTS.find((shortcut) => shortcut.key === 'new_in');
    expect(isShortcutActive(newIn!, '/products', new URLSearchParams('sort=new'))).toBe(true);
    expect(isShortcutActive(newIn!, '/products', new URLSearchParams('sort=newest'))).toBe(true);
  });

  it('marks gifts shortcut on gifts route', () => {
    const gifts = PLP_CATEGORY_SHORTCUTS.find((shortcut) => shortcut.key === 'gifts');
    expect(isShortcutActive(gifts!, '/gifts', new URLSearchParams())).toBe(true);
  });
});
