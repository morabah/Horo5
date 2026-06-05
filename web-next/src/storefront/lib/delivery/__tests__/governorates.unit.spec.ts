import {
  checkoutCityForGovernorateCode,
  normalizeGovernorateCode,
  shippingEgpForGovernorateCode,
} from '../governorates';

describe('governorates', () => {
  it('maps known codes to checkout city select values', () => {
    expect(checkoutCityForGovernorateCode('cairo')).toBe('Cairo');
    expect(checkoutCityForGovernorateCode('giza')).toBe('Giza');
    expect(checkoutCityForGovernorateCode('alexandria')).toBe('Alexandria');
  });

  it('returns null for unknown governorate codes', () => {
    expect(checkoutCityForGovernorateCode('invalid')).toBeNull();
    expect(checkoutCityForGovernorateCode(null)).toBeNull();
  });

  it('does not synthesize a default governorate from blank input', () => {
    expect(normalizeGovernorateCode(null)).toBeNull();
    expect(normalizeGovernorateCode('')).toBeNull();
    expect(normalizeGovernorateCode('   ')).toBeNull();
  });

  it('exposes Cairo shipping fallback for cart estimates', () => {
    expect(shippingEgpForGovernorateCode('cairo')).toBe(70);
  });
});
