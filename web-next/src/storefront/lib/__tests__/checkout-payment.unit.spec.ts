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
    expect(resolveCheckoutPaymentMethodKind('pp_paymob_fawry')).toBe('fawry');
  });

  it('isOfflineCheckoutPaymentKind is true for cod, instapay, and fawry', () => {
    expect(isOfflineCheckoutPaymentKind('cod')).toBe(true);
    expect(isOfflineCheckoutPaymentKind('instapay')).toBe(true);
    expect(isOfflineCheckoutPaymentKind('fawry')).toBe(true);
    expect(isOfflineCheckoutPaymentKind('card')).toBe(false);
    expect(isOfflineCheckoutPaymentKind('wallet')).toBe(false);
  });

  it('checkoutPaymentProviderSortKey orders cod before instapay before fawry before paymob before wallets', () => {
    expect(checkoutPaymentProviderSortKey('pp_system_default')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_instapay_instapay'),
    );
    expect(checkoutPaymentProviderSortKey('pp_instapay_instapay')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_paymob_fawry'),
    );
    expect(checkoutPaymentProviderSortKey('pp_paymob_fawry')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_paymob_paymob'),
    );
    expect(checkoutPaymentProviderSortKey('pp_paymob_paymob')).toBeLessThan(
      checkoutPaymentProviderSortKey('pp_apple_x'),
    );
  });

  it('checkoutProvidersIncludeCod detects system_default', () => {
    expect(checkoutProvidersIncludeCod([{ id: 'pp_system_default' }])).toBe(true);
    expect(checkoutProvidersIncludeCod([{ id: 'pp_paymob_paymob' }])).toBe(false);
  });
});
