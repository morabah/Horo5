import type { Product, ProductVariantRecord } from '../../data/site';
import {
  getProductSizeStockLimit,
  getVariantStockLimit,
  productVariantCanBeSelected,
} from '../productStock';

function variant(overrides: Partial<ProductVariantRecord> = {}): ProductVariantRecord {
  return {
    allowBackorder: false,
    available: true,
    id: 'var_m',
    inventoryQuantity: 3,
    manageInventory: true,
    priceEgp: 500,
    size: 'M',
    ...overrides,
  };
}

describe('product stock helpers', () => {
  it('caps managed non-backorder variants by Medusa inventory quantity', () => {
    expect(getVariantStockLimit(variant({ inventoryQuantity: 2 }))).toBe(2);
  });

  it('treats unavailable variants as sold out', () => {
    expect(getVariantStockLimit(variant({ available: false, inventoryQuantity: 8 }))).toBe(0);
    expect(productVariantCanBeSelected(variant({ available: false }))).toBe(false);
  });

  it('does not client-cap unmanaged or backorderable variants', () => {
    expect(getVariantStockLimit(variant({ manageInventory: false, inventoryQuantity: 0 }))).toBeNull();
    expect(getVariantStockLimit(variant({ allowBackorder: true, inventoryQuantity: 0 }))).toBeNull();
  });

  it('resolves a size limit from product variants', () => {
    const product: Product = {
      artistSlug: 'artist',
      feelingSlug: 'feeling',
      name: 'Signal Line',
      occasionSlugs: [],
      priceEgp: 500,
      slug: 'signal-line',
      story: '',
      variantsBySize: {
        M: variant({ id: 'var_m', inventoryQuantity: 4 }),
      },
    };

    expect(getProductSizeStockLimit(product, 'M')).toBe(4);
    expect(getProductSizeStockLimit(product, 'M', 'var_m')).toBe(4);
  });
});
