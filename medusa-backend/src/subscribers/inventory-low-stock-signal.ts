import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { recordHoroLowStockEvent } from "../lib/horo-ops-low-stock-memory"

type InventoryLevelPayload = {
  id?: string
  stocked_quantity?: number
  inventory_item_id?: string
}

function parseThreshold(): number {
  const raw = String(process.env.HORO_LOW_STOCK_THRESHOLD ?? "3").trim()
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 3
}

export default async function inventoryLowStockSignalHandler({
  event: { data },
  container,
}: SubscriberArgs<InventoryLevelPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const row = data && typeof data === "object" ? (data as InventoryLevelPayload) : {}
  const qty =
    typeof row.stocked_quantity === "number" && Number.isFinite(row.stocked_quantity)
      ? row.stocked_quantity
      : null
  if (qty === null) {
    return
  }
  const threshold = parseThreshold()
  if (qty > threshold) {
    return
  }

  recordHoroLowStockEvent({
    at: new Date().toISOString(),
    inventoryItemId: typeof row.inventory_item_id === "string" ? row.inventory_item_id : undefined,
    stockedQuantity: qty,
  })
  logger.info(
    `[horo-ops] low stock signal qty=${qty} threshold=${threshold} item=${row.inventory_item_id ?? "?"}`,
  )
}

export const config: SubscriberConfig = {
  event: "inventory.inventory-level.updated",
  context: {
    subscriberId: "horo-inventory-low-stock-signal",
  },
}
