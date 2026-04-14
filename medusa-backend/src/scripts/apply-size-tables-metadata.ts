import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

import defaults from "./data/size-tables-defaults.json"

/**
 * Writes `store.metadata.sizeTables` + `store.metadata.defaultSizeTableKey` for PDP size guide presets.
 * Does not remove `delivery` or other metadata keys.
 *
 * Run from medusa-backend:
 *   npm run apply:size-tables-metadata
 *   npx @railway/cli run npm run apply:size-tables-metadata:public
 */
export default async function applySizeTablesMetadata({ container }: ExecArgs) {
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
  meta.sizeTables = { ...defaults.tables }
  meta.defaultSizeTableKey = defaults.defaultSizeTableKey

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { metadata: meta },
    },
  })

  // eslint-disable-next-line no-console
  console.info(
    "[apply-size-tables-metadata] Updated store.metadata.defaultSizeTableKey:",
    meta.defaultSizeTableKey,
    "keys:",
    Object.keys(meta.sizeTables as object).join(", "),
  )
}
