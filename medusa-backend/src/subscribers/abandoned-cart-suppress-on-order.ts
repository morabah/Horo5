import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { STOREFRONT_ABANDONED_CART_MODULE } from "../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../modules/storefront-abandoned-cart/service"

type OrderPlacedPayload = {
  id?: string
  email?: string | null
  customer?: { email?: string | null } | null
}

export default async function abandonedCartSuppressOnOrder({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const email =
    data.email?.trim()?.toLowerCase() ||
    data.customer?.email?.trim()?.toLowerCase() ||
    ""
  if (!email) {
    logger.warn("[abandoned-cart-suppress] order.placed without email; skip.")
    return
  }

  const service = container.resolve<StorefrontAbandonedCartModuleService>(
    STOREFRONT_ABANDONED_CART_MODULE,
  )
  const rows = await service.listStorefrontAbandonedCarts({ email }, { take: 50 })
  if (!rows.length) return

  const now = new Date()
  for (const row of rows) {
    if (row.suppressed_at) continue
    await service.updateStorefrontAbandonedCarts({
      id: row.id,
      suppressed_at: now,
    })
  }
  logger.info(`[abandoned-cart-suppress] Suppressed ${rows.length} lead(s) for ${email}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "abandoned-cart-suppress-on-order",
  },
}
