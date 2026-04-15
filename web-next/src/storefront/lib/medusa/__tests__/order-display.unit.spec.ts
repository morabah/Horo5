import type { MedusaOrder } from '../types';
import {
  ORDER_DISPLAY_EPSILON,
  orderConfirmationFooterDeltaEgp,
  resolveOrderSnapshotSubtotalEgp,
  sumOrderMerchandiseLineTotalsEgp,
  sumOrderConfirmationDisplayedComponents,
} from '../order-display';

describe('order-display', () => {
  it('sumOrderConfirmationDisplayedComponents matches subtotal + shipping when no extras', () => {
    expect(
      sumOrderConfirmationDisplayedComponents({
        subtotal: 800,
        shipping: 100,
        total: 900,
      }),
    ).toBe(900);
  });

  it('includes gift wrap, tax, and subtracts discount', () => {
    expect(
      sumOrderConfirmationDisplayedComponents({
        subtotal: 800,
        shipping: 100,
        total: 950,
        giftWrapEgp: 200,
        discountEgp: 100,
        taxEgp: 50,
      }),
    ).toBe(800 + 100 + 200 - 100 + 50);
  });

  it('orderConfirmationFooterDeltaEgp is null when totals reconcile', () => {
    expect(
      orderConfirmationFooterDeltaEgp({
        subtotal: 800,
        shipping: 100,
        total: 900,
      }),
    ).toBeNull();
  });

  it('orderConfirmationFooterDeltaEgp returns drift when total does not match components', () => {
    expect(
      orderConfirmationFooterDeltaEgp({
        subtotal: 4100,
        shipping: 100,
        total: 4100,
      }),
    ).toBe(-100);
  });

  it('treats tiny rounding noise as reconciled', () => {
    expect(
      orderConfirmationFooterDeltaEgp({
        subtotal: 100,
        shipping: 50,
        total: 150 + ORDER_DISPLAY_EPSILON / 2,
      }),
    ).toBeNull();
  });
});

describe('resolveOrderSnapshotSubtotalEgp', () => {
  const twoTees: MedusaOrder = {
    id: 'order_test',
    items: [
      { id: 'a', quantity: 1, variant_id: 'v1', total: 800 },
      { id: 'b', quantity: 1, variant_id: 'v2', total: 800 },
    ],
    shipping_total: 80,
    shipping_methods: [{ amount: 80 }],
    subtotal: 1680,
    total: 1680,
  };

  it('uses sum of line totals when API subtotal double-counts shipping vs total', () => {
    expect(sumOrderMerchandiseLineTotalsEgp(twoTees)).toBe(1600);
    expect(resolveOrderSnapshotSubtotalEgp(twoTees)).toBe(1600);
    expect(
      orderConfirmationFooterDeltaEgp({
        subtotal: 1600,
        shipping: 80,
        total: 1680,
      }),
    ).toBeNull();
  });

  it('keeps API subtotal when line totals do not reconcile to order.total', () => {
    const broken: MedusaOrder = {
      ...twoTees,
      subtotal: 1680,
      total: 2000,
    };
    expect(resolveOrderSnapshotSubtotalEgp(broken)).toBe(1680);
  });

  it('uses line sum when API subtotal already matches merchandise', () => {
    const aligned: MedusaOrder = {
      ...twoTees,
      subtotal: 1600,
      total: 1680,
    };
    expect(resolveOrderSnapshotSubtotalEgp(aligned)).toBe(1600);
  });
});
