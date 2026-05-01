/**
 * Shared inventory helpers extracted from `enable-variant-stock-tracking.ts` and
 * `backfill-inventory-levels.ts`.  Both scripts share ~70 % identical code for
 * stock-map parsing, size extraction, and quantity resolution.
 */

import fs from "node:fs/promises"
import path from "node:path"

import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { PRODUCT_SIZE_SET } from "../shared/constants"
import { normalizeArgs, readOption } from "../shared/cli-args"

export type StockMap = Record<string, Partial<Record<string, number>>>

export type StockLocationRow = { id: string; name?: string }

export type VariantRow = {
  id: string
  title: string | null
  sku: string | null
  manage_inventory: boolean | null
  allow_backorder?: boolean | null
  product?: { id?: string; handle: string | null } | null
  inventory_items?: Array<{
    inventory?: { id: string } | null
    inventory_item_id?: string | null
  }>
}

export type InventoryLevelRow = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number | null
}

/** Extract the default quantity from CLI args (positional integer). Falls back to `storeDefaultQty` when no positional arg is given. */
export function parseDefaultQty(args: unknown, storeDefaultQty?: number | null): number {
  const arr = normalizeArgs(args)
  const positional = arr.find((arg, index) => {
    const previous = arr[index - 1]
    return (
      arg !== "dryrun" &&
      arg !== "--dry-run" &&
      previous !== "--stock-map" &&
      !arg.startsWith("-")
    )
  })
  if (!positional) {
    if (storeDefaultQty != null && Number.isInteger(storeDefaultQty) && storeDefaultQty >= 0) {
      return storeDefaultQty
    }
    return 50
  }
  const n = Number(positional)
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(
      `Invalid default quantity: ${positional}. Pass a non-negative integer.`,
    )
  }
  return n
}

/** Validate a raw stock-map JSON object. */
export function validateStockMap(raw: unknown): StockMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(
      "--stock-map must point to a JSON object keyed by product handle.",
    )
  }

  const result: StockMap = {}
  for (const [handle, bySize] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!bySize || typeof bySize !== "object" || Array.isArray(bySize)) {
      throw new Error(`stockMap.${handle} must be an object keyed by size.`)
    }

    result[handle] = {}
    for (const [size, qty] of Object.entries(bySize as Record<string, unknown>)) {
      if (!PRODUCT_SIZE_SET.has(size)) {
        throw new Error(`stockMap.${handle}.${size} is not a supported size.`)
      }
      if (!Number.isInteger(qty) || (qty as number) < 0) {
        throw new Error(
          `stockMap.${handle}.${size} must be a non-negative integer.`,
        )
      }
      result[handle][size] = qty as number
    }
  }

  return result
}

/** Read and validate a `--stock-map` JSON file from CLI args. */
export async function parseStockMap(
  args: unknown,
): Promise<StockMap | undefined> {
  const stockMapPath = readOption(normalizeArgs(args), "--stock-map")
  if (!stockMapPath) return undefined

  const absolutePath = path.isAbsolute(stockMapPath)
    ? stockMapPath
    : path.resolve(process.cwd(), stockMapPath)
  return validateStockMap(JSON.parse(await fs.readFile(absolutePath, "utf-8")))
}

/** Derive a canonical size from variant title or SKU suffix. */
export function variantSize(variant: VariantRow): string | undefined {
  const title = variant.title?.toUpperCase()
  if (title && PRODUCT_SIZE_SET.has(title)) return title

  const skuSuffix = variant.sku?.split("-").pop()?.toUpperCase()
  if (skuSuffix && PRODUCT_SIZE_SET.has(skuSuffix)) return skuSuffix

  return undefined
}

/** Resolve the quantity for a single variant given defaults + optional stock map. */
export function stockQtyForVariant(
  variant: VariantRow,
  defaultQty: number,
  stockMap: StockMap | undefined,
): number | undefined {
  const handle = variant.product?.handle ?? ""
  if (!stockMap) return defaultQty
  const bySize = stockMap[handle]
  if (!bySize) return undefined

  const size = variantSize(variant)
  if (!size) return defaultQty

  return bySize[size] ?? defaultQty
}

/** Read the default stock quantity from store metadata. Returns `null` if not set. */
export async function resolveStoreDefaultStockQty(container: MedusaContainer): Promise<number | null> {
  const storeModule = container.resolve(Modules.STORE) as {
    listStores: () => Promise<Array<{ metadata?: Record<string, unknown> | null }>>
  }
  const stores = await storeModule.listStores()
  const meta = stores[0]?.metadata ?? {}
  const raw = meta.defaultStockQty
  const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : null
  if (num !== null && Number.isFinite(num) && num >= 0 && Number.isInteger(num)) {
    return num
  }
  return null
}
