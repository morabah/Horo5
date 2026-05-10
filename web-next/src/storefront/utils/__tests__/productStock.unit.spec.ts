import type { Product, ProductVariantRecord } from '../../data/site';
import {
  deriveProductStockStatus,
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

  describe('deriveProductStockStatus', () => {
    it('returns null when no stockStatusBySize', () => {
      expect(deriveProductStockStatus({ variantsBySize: {} } as Product)).toBeNull();
    });

    it('returns in_stock when any size is in_stock', () => {
      const product = {
        stockStatusBySize: { M: 'sold_out', L: 'low_stock', XL: 'in_stock' },
      } as Product;
      expect(deriveProductStockStatus(product)).toBe('in_stock');
    });

    it('returns low_stock when no in_stock but some low_stock', () => {
      const product = {
        stockStatusBySize: { M: 'sold_out', L: 'low_stock' },
      } as Product;
      expect(deriveProductStockStatus(product)).toBe('low_stock');
    });

    it('returns preorder when no in_stock or low_stock but some preorder', () => {
      const product = {
        stockStatusBySize: { M: 'sold_out', L: 'preorder' },
      } as Product;
      expect(deriveProductStockStatus(product)).toBe('preorder');
    });

    it('returns sold_out when all sizes are sold_out', () => {
      const product = {
        stockStatusBySize: { M: 'sold_out', L: 'sold_out' },
      } as Product;
      expect(deriveProductStockStatus(product)).toBe('sold_out');
    });
  });
});
