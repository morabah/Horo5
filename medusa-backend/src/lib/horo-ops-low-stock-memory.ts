export type HoroLowStockEvent = {
  /** ISO timestamp */
  at: string
  /** Inventory item id when present */
  inventoryItemId?: string
  stockedQuantity?: number
  sku?: string
}

const MAX = 200

let events: HoroLowStockEvent[] | undefined

function buffer(): HoroLowStockEvent[] {
  if (!events) {
    events = []
  }
  return events
}

export function recordHoroLowStockEvent(event: HoroLowStockEvent) {
  const b = buffer()
  b.unshift(event)
  if (b.length > MAX) {
    b.length = MAX
  }
}

export function listHoroLowStockEvents(): HoroLowStockEvent[] {
  return [...buffer()]
}
