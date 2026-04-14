import { Modules } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function parseSizeTablesKeys(raw: unknown): string[] {
  let obj: Record<string, unknown> | null = null
  if (raw == null) {
    return []
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>
      }
    } catch {
      return []
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>
  }
  if (!obj) {
    return []
  }
  return Object.keys(obj).map((k) => k.trim()).filter(Boolean)
}

/**
 * Lists preset keys from `store.metadata.sizeTables` for the Admin PDP widget dropdown.
 * Authenticated admin session only (same as other `/admin/custom/*` reads).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModule = req.scope.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  const store = stores[0] as { metadata?: Record<string, unknown> | null } | undefined
  const meta = store?.metadata ?? {}
  const presetKeys = parseSizeTablesKeys(meta.sizeTables)
  const defaultSizeTableKey =
    typeof meta.defaultSizeTableKey === "string" && meta.defaultSizeTableKey.trim()
      ? meta.defaultSizeTableKey.trim()
      : null

  res.status(200).json({ presetKeys, defaultSizeTableKey })
}
