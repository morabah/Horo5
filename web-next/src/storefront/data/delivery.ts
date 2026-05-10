import { z } from 'zod';
import type { PdpDeliveryRules } from '../utils/deliveryEstimate';

/** Partial override from Medusa `store.metadata.delivery` (see medusa-backend README). */
export type StorefrontDeliveryMetadata = Partial<{
  standardMinDays: number;
  standardMaxDays: number;
  expressMinDays: number;
  expressMaxDays: number;
  cutoffHourLocal: number;
  cutoffMinuteLocal: number;
  /** If set, used for “arrives by”; otherwise `standardMaxDays` is used. */
  standardMaxBusinessDays: number;
  /**
   * Optional display-only standard shipping in EGP for Product JSON-LD `OfferShippingDetails`.
   * Must match checkout reality — set in Medusa Admin store metadata `delivery` when operators want Rich Results shipping hints.
   */
  jsonLdStandardShippingEgp: number;
}>;

/** Defaults match previous hard-coded PDP behavior. */
export const PDP_DEFAULT_DELIVERY_RULES: PdpDeliveryRules = {
  cutoffHourLocal: 14,
  cutoffMinuteLocal: 0,
  standardMaxBusinessDays: 5,
  standardMinDays: 3,
  standardMaxDays: 5,
  expressMinDays: 1,
  expressMaxDays: 2,
};

const clampNumericString = (min: number, max: number, fallback: number) =>
  z.union([z.number(), z.string()]).transform(v => Number(v)).refine(n => Number.isFinite(n), "Invalid").transform(n => Math.min(max, Math.max(min, Math.trunc(n)))).catch(fallback).optional().default(fallback);

export const DeliveryRulesSchema = z.object({
  cutoffHourLocal: clampNumericString(0, 23, PDP_DEFAULT_DELIVERY_RULES.cutoffHourLocal),
  cutoffMinuteLocal: clampNumericString(0, 59, PDP_DEFAULT_DELIVERY_RULES.cutoffMinuteLocal),
  standardMaxBusinessDays: clampNumericString(1, 30, PDP_DEFAULT_DELIVERY_RULES.standardMaxBusinessDays),
  standardMinDays: clampNumericString(1, 30, PDP_DEFAULT_DELIVERY_RULES.standardMinDays),
  standardMaxDays: clampNumericString(1, 30, PDP_DEFAULT_DELIVERY_RULES.standardMaxDays),
  expressMinDays: clampNumericString(1, 30, PDP_DEFAULT_DELIVERY_RULES.expressMinDays),
  expressMaxDays: clampNumericString(1, 30, PDP_DEFAULT_DELIVERY_RULES.expressMaxDays),
}).transform(out => {
  if (out.standardMinDays > out.standardMaxDays) {
    [out.standardMinDays, out.standardMaxDays] = [out.standardMaxDays, out.standardMinDays];
  }
  if (out.expressMinDays > out.expressMaxDays) {
    [out.expressMinDays, out.expressMaxDays] = [out.expressMaxDays, out.expressMinDays];
  }
  return out as PdpDeliveryRules;
});

/**
 * Merge Medusa `store.metadata.delivery` into PDP delivery rules. Invalid or missing keys keep defaults.
 */
export function mergePdpDeliveryRules(remote: unknown): PdpDeliveryRules {
  let parsed: unknown = remote;
  if (typeof remote === 'string') {
    try {
      parsed = JSON.parse(remote);
    } catch {
      return PDP_DEFAULT_DELIVERY_RULES;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return PDP_DEFAULT_DELIVERY_RULES;
  }
  return DeliveryRulesSchema.parse(parsed);
}

const optionalShippingPrice = z.union([z.number(), z.string()]).transform(v => Number(v)).refine(n => Number.isFinite(n) && n >= 0, "Invalid").transform(n => Math.min(500000, Math.trunc(n))).optional().catch(undefined);

export const JsonLdShippingSchema = z.object({
  jsonLdStandardShippingEgp: optionalShippingPrice,
  json_ld_standard_shipping_egp: optionalShippingPrice,
}).transform(val => val.jsonLdStandardShippingEgp ?? val.json_ld_standard_shipping_egp ?? null);

/**
 * Reads `jsonLdStandardShippingEgp` from Medusa `store.metadata.delivery` (number or numeric string).
 * Returns null if unset or invalid — callers must not invent a fallback price.
 */
export function parseJsonLdStandardShippingEgpFromStoreDelivery(remote: unknown): number | null {
  let parsed: unknown = remote;
  if (typeof remote === 'string') {
    try {
      parsed = JSON.parse(remote);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  return JsonLdShippingSchema.parse(parsed);
}
