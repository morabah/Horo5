import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

import defaults from "./data/store-delivery-defaults.json"

/**
 * Merges storefront default delivery windows into `store.metadata.delivery`
 * (same values as web-next `PDP_DEFAULT_DELIVERY_RULES`).
 *
 * Run from medusa-backend:
 *   npm run apply:store-delivery-metadata
 *   npx @railway/cli run npm run apply:store-delivery-metadata:public
 */
export default async function applyStoreDeliveryMetadata({ container }: ExecArgs) {
  const storeModule = container.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  const store = stores[0] as { id?: string; metadata?: Record<string, unknown> | null } | undefined

  if (!store?.id) {
    // eslint-disable-next-line no-console
    console.error("No store row found.")
    process.exitCode = 1
    return
  }

  const meta = { ...(store.metadata ?? {}) }
  meta.delivery = { ...defaults }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { metadata: meta },
    },
  })

  // eslint-disable-next-line no-console
  console.info("[apply-store-delivery-metadata] Updated store.metadata.delivery:", JSON.stringify(meta.delivery))
}
