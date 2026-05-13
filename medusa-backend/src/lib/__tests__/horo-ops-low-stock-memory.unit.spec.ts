import { listHoroLowStockEvents, recordHoroLowStockEvent } from "../horo-ops-low-stock-memory"

describe("horo-ops-low-stock-memory", () => {
  beforeEach(() => {
    // Clear the module-level buffer by requiring fresh
    jest.resetModules()
  })

  it("records and lists events", () => {
    const { recordHoroLowStockEvent, listHoroLowStockEvents } = require("../horo-ops-low-stock-memory")
    const event = { at: "2026-01-01T00:00:00Z", inventoryItemId: "inv_1", stockedQuantity: 3, sku: "TS-001-M" }
    recordHoroLowStockEvent(event)
    expect(listHoroLowStockEvents()).toEqual([event])
  })

  it("returns most recent first", () => {
    const { recordHoroLowStockEvent, listHoroLowStockEvents } = require("../horo-ops-low-stock-memory")
    recordHoroLowStockEvent({ at: "2026-01-01T00:00:00Z", sku: "A" })
    recordHoroLowStockEvent({ at: "2026-01-02T00:00:00Z", sku: "B" })
    const events = listHoroLowStockEvents()
    expect(events[0].sku).toBe("B")
    expect(events[1].sku).toBe("A")
  })

  it("caps at 200 events", () => {
    const { recordHoroLowStockEvent, listHoroLowStockEvents } = require("../horo-ops-low-stock-memory")
    for (let i = 0; i < 250; i++) {
      recordHoroLowStockEvent({ at: new Date().toISOString(), sku: `SKU-${i}` })
    }
    const events = listHoroLowStockEvents()
    expect(events.length).toBe(200)
  })
})
