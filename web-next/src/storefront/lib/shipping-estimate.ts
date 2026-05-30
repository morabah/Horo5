import { readCheckoutDisplayShippingFallbackEgpFromEnv } from './medusa/cart-money';

type ShippingTierMap = Record<string, number>;

function parseDeliveryShippingTiers(delivery: unknown): ShippingTierMap | null {
  let parsed: unknown = delivery;
  if (typeof delivery === 'string') {
    try {
      parsed = JSON.parse(delivery);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const raw =
    (parsed as Record<string, unknown>).shippingByGovernorate ??
    (parsed as Record<string, unknown>).shipping_by_governorate;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const tiers: ShippingTierMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) {
      tiers[key.toLowerCase()] = Math.round(n);
    }
  }
  return Object.keys(tiers).length > 0 ? tiers : null;
}

const DEFAULT_TIERS: ShippingTierMap = {
  cairo: 60,
  giza: 60,
  alexandria: 80,
  'alexandria governorate': 80,
  default: 100,
};

/** Display-only shipping estimate before a Medusa cart has shipping options. */
export function estimateShippingEgpForGovernorate(
  governorateCode: string,
  delivery: unknown,
): number {
  const code = governorateCode.trim().toLowerCase();
  const tiers = parseDeliveryShippingTiers(delivery) ?? DEFAULT_TIERS;
  if (code && tiers[code] != null) return tiers[code];
  const envFallback = readCheckoutDisplayShippingFallbackEgpFromEnv();
  if (envFallback != null && envFallback > 0) return envFallback;
  return tiers.default ?? 100;
}
