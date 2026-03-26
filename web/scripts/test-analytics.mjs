import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTestModule } from './load-test-module.mjs';

const analytics = await loadTestModule('test-analytics-source-entry.ts');

test('analytics payload builders normalize core ecommerce fields', () => {
  const product = analytics.getProduct('midnight-compass');
  assert.ok(product);

  const item = analytics.buildAnalyticsItem(product, 1);
  const viewItem = analytics.createViewItemPayload(product);
  const addToCart = analytics.createAddToCartPayload(product, 2, 'M');
  const beginCheckout = analytics.createBeginCheckoutPayload(
    [{ productSlug: product.slug, qty: 1, size: 'M' }],
    product.priceEgp,
    200,
  );
  const purchase = analytics.createPurchasePayload({
    transactionId: 'ORDER-1',
    value: product.priceEgp,
    currency: 'EGP',
    lines: [{ productSlug: product.slug, qty: 1, size: 'M' }],
  });

  assert.equal(item.item_id, 'midnight-compass');
  assert.equal(item.item_brand, 'HORO Egypt');
  assert.equal(item.item_category, 'Zodiac');
  assert.equal(viewItem.items[0].item_category, 'Zodiac');
  assert.equal(addToCart.items[0].item_variant, 'M');
  assert.equal(beginCheckout.items.length, 1);
  assert.equal(purchase.transaction_id, 'ORDER-1');
  assert.equal('utm_source' in purchase, false);
});

test('view_item duplicate suppression remains in place for strict-mode safety', () => {
  assert.equal(analytics.shouldSuppressDuplicateEvent('view_item', 'midnight-compass', 1000), false);
  assert.equal(analytics.shouldSuppressDuplicateEvent('view_item', 'midnight-compass', 1500), true);
  assert.equal(analytics.shouldSuppressDuplicateEvent('view_item', 'midnight-compass', 3000), false);
});
