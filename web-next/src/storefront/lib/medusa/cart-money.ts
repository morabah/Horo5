/**
 * Storefront money rules (single source of truth hierarchy):
 * 1. Medusa cart/order fields (subtotal, shipping_total, total, line unit_price) after coercion.
 * 2. listShippingOptions / selected option when shipping is not yet on the cart.
 * 3. Catalog `site.ts` prices only as fallback when Medusa sends no numeric price (rare).
 */

import type { CartLine } from "../../cart/types"
import { getCartLineViews } from "../../cart/view"
import { medusaAmountToEgpUnknown } from "./egp-amount"
import type { MedusaCart, MedusaShippingOption } from "./types"

export function shippingOptionAmountEgp(option: MedusaShippingOption | null | undefined): number {
  if (!option) return 0
  const raw = option.calculated_price?.calculated_amount ?? option.amount
  return medusaAmountToEgpUnknown(raw)
}

/**
 * Checkout-style shipping display: prefer cart.shipping_total once a method is attached,
 * otherwise the resolved option row (same amounts the API will charge).
 */
export function resolveCheckoutShippingEgp(
  cart: MedusaCart | null | undefined,
  resolvedShippingOption: MedusaShippingOption | null | undefined,
): number {
  if (cart != null) {
    const st = medusaAmountToEgpUnknown(cart.shipping_total)
    if (st > 0) return st
  }
  return shippingOptionAmountEgp(resolvedShippingOption ?? undefined)
}

/**
 * Optional display-only standard shipping (EGP) while Medusa totals are still zero.
 * Set `NEXT_PUBLIC_CHECKOUT_DISPLAY_SHIPPING_EGP` to match your live standard rate; reconciles after save.
 */
export function readCheckoutDisplayShippingFallbackEgpFromEnv(): number | null {
  try {
    const raw = process.env.NEXT_PUBLIC_CHECKOUT_DISPLAY_SHIPPING_EGP?.trim()
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return null
    return Math.round(n)
  } catch {
    return null
  }
}

export function resolveCheckoutShippingEgpWithDisplayFallback(
  cart: MedusaCart | null | undefined,
  resolvedShippingOption: MedusaShippingOption | null | undefined,
): { egp: number; usedDisplayFallback: boolean } {
  const live = resolveCheckoutShippingEgp(cart, resolvedShippingOption)
  if (live > 0) return { egp: live, usedDisplayFallback: false }
  const fb = readCheckoutDisplayShippingFallbackEgpFromEnv()
  if (fb != null && fb > 0) return { egp: fb, usedDisplayFallback: true }
  return { egp: 0, usedDisplayFallback: false }
}

/** Sum of apparel line display totals (matches checkout sidebar / OrderSummary). */
export function merchandiseSubtotalFromCartLines(lines: CartLine[]): number {
  return getCartLineViews(lines).reduce((sum, line) => sum + line.linePriceEgp, 0)
}

/**
 * Cart page estimate: prefer `cart.shipping_total` once Medusa has applied a method; otherwise
 * the quoted option (attached option id when present, else first option).
 */
export function resolveShippingQuoteFromCartAndOptions(
  cart: MedusaCart | null,
  liveOptions: MedusaShippingOption[],
): number {
  if (cart) {
    const st = medusaAmountToEgpUnknown(cart.shipping_total)
    if (st > 0) return st
  }
  if (liveOptions.length === 0) {
    return readCheckoutDisplayShippingFallbackEgpFromEnv() ?? 0
  }
  const attached = cart?.shipping_methods?.[0]
  const opt =
    attached != null
      ? liveOptions.find((o) => o.id === attached.shipping_option_id) ?? liveOptions[0]
      : liveOptions[0]
  const quoted = shippingOptionAmountEgp(opt)
  if (quoted > 0) return quoted
  return readCheckoutDisplayShippingFallbackEgpFromEnv() ?? 0
}
