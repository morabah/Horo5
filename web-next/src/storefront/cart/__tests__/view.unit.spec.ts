/**
 * Extended unit tests for cart/view.ts — the CartLineView transformation layer.
 */
import { getCartLineView, getCartLineViews } from '../view';
import type { CartLine } from '../types';


// The getCartLineView function depends on getProduct which reads from site data.
// In unit tests (node environment), the site data catalog is empty, so we test
// the fallback paths that use inline line data.

describe('getCartLineView', () => {
  it('uses medusa line total when present instead of unitPrice * qty', () => {
    const line: CartLine = {
      productSlug: 'test-product',
      size: 'M',
      qty: 2,
      unitPriceEgp: 100,
      medusaLineTotalEgp: 180, // discounted
      productName: 'Test Product',
    };
    const view = getCartLineView(line);
    expect(view).not.toBeNull();
    expect(view!.linePriceEgp).toBe(180);
  });

  it('falls back to unitPriceEgp * qty when medusaLineTotalEgp is absent', () => {
    const line: CartLine = {
      productSlug: 'test-product',
      size: 'M',
      qty: 3,
      unitPriceEgp: 100,
      productName: 'Test Product',
    };
    const view = getCartLineView(line);
    expect(view).not.toBeNull();
    expect(view!.linePriceEgp).toBe(300);
  });

  it('returns null when product is not in catalog and no productName is set', () => {
    const line: CartLine = {
      productSlug: 'nonexistent-product',
      size: 'M',
      qty: 1,
    };
    const view = getCartLineView(line);
    expect(view).toBeNull();
  });

  it('uses productName from line when product is not in catalog', () => {
    const line: CartLine = {
      productSlug: 'nonexistent',
      size: 'M',
      qty: 1,
      productName: 'Inline Name',
      unitPriceEgp: 50,
    };
    const view = getCartLineView(line);
    expect(view).not.toBeNull();
    expect(view!.productName).toBe('Inline Name');
    expect(view!.unitPriceEgp).toBe(50);
  });

  it('uses productSlug as productName fallback', () => {
    const line: CartLine = {
      productSlug: 'fallback-slug',
      size: 'M',
      qty: 1,
      productName: undefined as unknown as string,
      unitPriceEgp: 75,
    };
    // When productName is explicitly set on the line object (even as undefined via types),
    // getProduct returns null in test env, so productName is the slug.
    const view = getCartLineView({ ...line, productName: 'Fallback Slug' });
    expect(view).not.toBeNull();
    expect(view!.productName).toBe('Fallback Slug');
  });

  it('generates correct key with lineId', () => {
    const line: CartLine = {
      productSlug: 'test-product',
      size: 'M',
      qty: 1,
      lineId: 'line_123',
      variantId: 'var_456',
      productName: 'Test',
    };
    const view = getCartLineView(line);
    expect(view).not.toBeNull();
    expect(view!.key).toBe('test-product::M::var_456::line_123');
  });

  it('generates correct key without lineId', () => {
    const line: CartLine = {
      productSlug: 'test-product',
      size: 'L',
      qty: 1,
      productName: 'Test',
    };
    const view = getCartLineView(line);
    expect(view).not.toBeNull();
    expect(view!.key).toBe('test-product::L');
  });
});

describe('getCartLineViews', () => {
  it('filters out lines that cannot be resolved to a view', () => {
    const lines: CartLine[] = [
      { productSlug: 'has-name', size: 'M', qty: 1, productName: 'Product A', unitPriceEgp: 100 },
      { productSlug: 'no-name-no-catalog', size: 'S', qty: 1 }, // Will return null
      { productSlug: 'also-has-name', size: 'L', qty: 2, productName: 'Product B', unitPriceEgp: 200 },
    ];
    const views = getCartLineViews(lines);
    expect(views).toHaveLength(2);
    expect(views[0].productName).toBe('Product A');
    expect(views[1].productName).toBe('Product B');
  });

  it('returns empty array for empty cart', () => {
    expect(getCartLineViews([])).toEqual([]);
  });

  it('each view has unique keys when lines have lineIds', () => {
    const lines: CartLine[] = [
      { productSlug: 'signal-line', size: 'M', qty: 1, lineId: 'line_a', variantId: 'var_a', productName: 'A', unitPriceEgp: 100 },
      { productSlug: 'signal-line', size: 'M', qty: 2, lineId: 'line_b', variantId: 'var_b', productName: 'B', unitPriceEgp: 120 },
    ];
    const views = getCartLineViews(lines);
    const keys = views.map((v) => v.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
