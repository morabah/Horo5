import {
  checkoutPaymentProviderSortKey,
  checkoutProvidersIncludeCod,
  isOfflineCheckoutPaymentKind,
  resolveCheckoutPaymentMethodKind,
} from '../checkout-payment';

describe('checkout-payment', () => {
  it('resolveCheckoutPaymentMethodKind maps Medusa provider ids', () => {
    expect(resolveCheckoutPaymentMethodKind('pp_system_default')).toBe('cod');
    expect(resolveCheckoutPaymentMethodKind('pp_instapay_instapay')).toBe('instapay');
    expect(resolveCheckoutPaymentMethodKind('pp_paymob_paymob')).toBe('card');
    expect(resolveCheckoutPaymentMethodKind('pp_someprovider_apple_x')).toBe('wallet');
  });

  it('isOfflineCheckoutPaymentKind is true for cod and instapay only', () => {
    expect(isOfflineCheckoutPaymentKind('cod')).toBe(true);
    expect(isOfflineCheckoutPaymentKind('instapay')).toBe(true);
    expect(isOfflineCheckoutPaymentKind('card')).toBe(false);
    expect(isOfflineCheckoutPaymentKind('wallet')).toBe(false);
  });

  it('checkoutPaymentProviderSortKey orders wallets before paymob before instapay before cod', () => {
    expect(checkoutPaymentProviderSortKey('pp_apple_x')).toBeLessThan(checkoutPaymentProviderSortKey('pp_paymob_paymob'));
    expect(checkoutPaymentProviderSortKey('pp_paymob_paymob')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_instapay_instapay'),
    );
    expect(checkoutPaymentProviderSortKey('pp_instapay_instapay')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_system_default'),
    );
  });

  it('checkoutProvidersIncludeCod detects system_default', () => {
    expect(checkoutProvidersIncludeCod([{ id: 'pp_system_default' }])).toBe(true);
    expect(checkoutProvidersIncludeCod([{ id: 'pp_paymob_paymob' }])).toBe(false);
  });
});
