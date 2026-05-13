import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * HORO promotion context hook for cart-based promotion rules.
 *
 * v2.15.1 feature: updateCartPromotionsWorkflow now supports setPromotionContext
 * hooks, allowing custom business logic to influence promotion eligibility.
 *
 * This hook injects cart-composition context so future promotion rules can target:
 *   - Minimum item count (e.g. "Buy 3+ items, get 10% off")
 *   - Gift-wrap presence (e.g. "Free gift-wrap when cart > 1000 EGP")
 *   - Feeling/category affinity (e.g. "Zodiac items get 15% off")
 */

updateCartPromotionsWorkflow.hooks.setPromotionContext(
  ({ cart }, { container }) => {
    const items = Array.isArray(cart.items) ? cart.items : []

    // Total item count (sum of quantities)
    const itemCount = items.reduce(
      (sum: number, line: Record<string, unknown>) =>
        sum + (typeof line.quantity === "number" ? line.quantity : 0),
      0
    )

    // Detect gift-wrap product presence
    const hasGiftWrap = items.some((line: Record<string, unknown>) => {
      const product = line.product as Record<string, unknown> | undefined
      const handle =
        typeof product?.handle === "string"
          ? product.handle
          : typeof line.product_handle === "string"
            ? line.product_handle
            : ""
      return handle === "gift-wrap"
    })

    // Collect primary feeling slugs from product metadata for feeling-based promos
    const feelingSlugs = new Set<string>()
    for (const line of items) {
      const product = (line.product ?? {}) as Record<string, unknown>
      const meta =
        product && typeof product === "object" && !Array.isArray(product)
          ? (product.metadata as Record<string, unknown> | undefined)
          : undefined
      if (meta && typeof meta.feelingSlug === "string" && meta.feelingSlug) {
        feelingSlugs.add(meta.feelingSlug)
      }
      // Also check line-level metadata
      const lineMeta = line.metadata as Record<string, unknown> | undefined
      if (
        lineMeta &&
        typeof lineMeta.feelingSlug === "string" &&
        lineMeta.feelingSlug
      ) {
        feelingSlugs.add(lineMeta.feelingSlug)
      }
    }

    return new StepResponse({
      item_count: itemCount,
      has_gift_wrap: hasGiftWrap,
      feeling_slugs: Array.from(feelingSlugs),
      // Future: company_id, customer_segment, etc.
    })
  }
)
