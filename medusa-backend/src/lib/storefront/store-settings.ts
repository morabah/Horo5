import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

/**
 * Admin often stores metadata values as JSON strings — normalize to a plain object for the storefront.
 */
export function parseDeliveryObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

/** Named presets: `{ regular: { measurements, fitModels }, ... }` — may be stringified in Admin. */
export function parseSizeTablesObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

export type StorefrontSettingsDTO = {
  delivery: Record<string, unknown> | null
  sizeTables: Record<string, unknown> | null
  defaultSizeTableKey: string | null
}

/**
 * Public storefront settings subset (no secrets).
 * Operators set `store.metadata.delivery`, `store.metadata.sizeTables`, `store.metadata.defaultSizeTableKey`.
 */
export async function retrieveStorefrontSettingsPayload(scope: MedusaContainer): Promise<StorefrontSettingsDTO> {
  const storeModule = scope.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  const store = stores[0] as { metadata?: Record<string, unknown> | null } | undefined
  const meta = store?.metadata ?? {}
  const delivery = parseDeliveryObject(meta.delivery)
  const sizeTables = parseSizeTablesObject(meta.sizeTables)
  const defaultSizeTableKey =
    typeof meta.defaultSizeTableKey === "string" && meta.defaultSizeTableKey.trim()
      ? meta.defaultSizeTableKey.trim()
      : null

  return { delivery, sizeTables, defaultSizeTableKey }
}
