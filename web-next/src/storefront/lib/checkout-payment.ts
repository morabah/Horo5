/** Storefront payment method discriminator (Medusa `payment_providers` ids resolved in checkout). */
export type CheckoutPaymentMethodKind = 'cod' | 'card' | 'wallet' | 'instapay';

/** Persisted on `LastOrderSnapshot` after place order / success. */
export type StorefrontPaymentChoice = 'cod' | 'card' | 'instapay';

export function resolveCheckoutPaymentMethodKind(providerId: string): CheckoutPaymentMethodKind {
  const normalized = providerId.toLowerCase();
  if (normalized.includes('system_default')) return 'cod';
  if (normalized.includes('instapay')) return 'instapay';
  if (normalized.includes('apple') || normalized.includes('google')) return 'wallet';
  return 'card';
}

/** Wallets first, then Paymob card, then other online, Instapay, COD last. */
export function checkoutPaymentProviderSortKey(providerId: string): number {
  const id = providerId.toLowerCase();
  const kind = resolveCheckoutPaymentMethodKind(providerId);
  if (kind === 'wallet') {
    if (id.includes('apple')) return 0;
    if (id.includes('google')) return 1;
    return 2;
  }
  if (id.includes('paymob')) return 10;
  if (kind === 'card') return 20;
  if (kind === 'instapay') return 95;
  if (kind === 'cod') return 100;
  return 50;
}

export function isOfflineCheckoutPaymentKind(kind: CheckoutPaymentMethodKind): boolean {
  return kind === 'cod' || kind === 'instapay';
}

/** True when Medusa returned a COD / system_default provider for this cart region. */
export function checkoutProvidersIncludeCod(providers: readonly { id: string }[]): boolean {
  return providers.some((p) => resolveCheckoutPaymentMethodKind(p.id) === 'cod');
}
