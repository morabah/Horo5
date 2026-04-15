import {
  classifyOpsOrders,
  friendlyDisplayId,
  isDeliveredFulfillment,
  isPaymentCaptured,
  parseOrderTotalMinor,
  type OpsClassifyConfig,
  type OpsOrderRow,
} from "../horo-ops-classify"

const baseConfig: OpsClassifyConfig = {
  slaDeliveryDays: 3,
  dueSoonHours: 48,
  stalePaymentHours: 48,
  staleFulfillmentHours: 72,
  deliveredRecentDays: 14,
}

describe("friendlyDisplayId", () => {
  it("formats numeric display_id", () => {
    expect(friendlyDisplayId(12)).toBe("HORO-12")
  })
  it("returns null for invalid", () => {
    expect(friendlyDisplayId(null)).toBeNull()
  })
})

describe("parseOrderTotalMinor", () => {
  it("parses number", () => {
    expect(parseOrderTotalMinor(1500)).toBe(1500)
  })
})

describe("isDeliveredFulfillment / isPaymentCaptured", () => {
  it("detects shipped", () => {
    expect(isDeliveredFulfillment("shipped")).toBe(true)
  })
  it("detects captured", () => {
    expect(isPaymentCaptured("captured")).toBe(true)
  })
})

describe("classifyOpsOrders", () => {
  const now = new Date("2026-01-10T12:00:00.000Z")

  it("flags SLA overdue when not fulfilled", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_1",
        display_id: 1,
        created_at: "2026-01-01T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 100,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.alarms.some((a) => a.kind === "sla_overdue")).toBe(true)
    expect(out.today.some((t) => t.order_id === "ord_1")).toBe(true)
  })

  it("puts order in dueSoon when deadline within window", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_2",
        display_id: 2,
        created_at: "2026-01-08T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 50,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.dueSoon.map((r) => r.id)).toContain("ord_2")
  })

  it("aggregates money collected by currency", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "a",
        display_id: 1,
        created_at: "2026-01-09T12:00:00.000Z",
        payment_status: "captured",
        currency_code: "egp",
        total: 100,
      },
      {
        id: "b",
        display_id: 2,
        created_at: "2026-01-09T12:00:00.000Z",
        payment_status: "captured",
        currency_code: "egp",
        total: 200,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.moneyCollectedByCurrency.egp).toBe(300)
    expect(out.moneyCollectedOrders).toHaveLength(2)
  })

  it("lists delivered recently when fulfilled and recent", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_3",
        display_id: 3,
        created_at: "2026-01-01T12:00:00.000Z",
        updated_at: "2026-01-09T12:00:00.000Z",
        fulfillment_status: "shipped",
        payment_status: "captured",
        currency_code: "egp",
        total: 10,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.deliveredRecently).toHaveLength(1)
  })

  it("buckets open orders by SLA deadline UTC day (today / tomorrow / +2–3)", () => {
    const cfg: OpsClassifyConfig = { ...baseConfig, slaDeliveryDays: 3 }
    const rows: OpsOrderRow[] = [
      {
        id: "t0",
        display_id: 10,
        created_at: "2026-01-07T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 1,
      },
      {
        id: "t1",
        display_id: 11,
        created_at: "2026-01-08T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 2,
      },
      {
        id: "t2",
        display_id: 12,
        created_at: "2026-01-09T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 3,
      },
    ]
    const out = classifyOpsOrders(rows, cfg, now)
    expect(out.deliveryScheduleUtcDay).toBe("2026-01-10")
    expect(out.deliveryDueToday.map((r) => r.id)).toContain("t0")
    expect(out.deliveryDueTomorrow.map((r) => r.id)).toContain("t1")
    expect(out.deliveryDueIn2To3Days.map((r) => r.id)).toContain("t2")
  })

  it("excludes fulfilled orders from delivery buckets", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "x",
        display_id: 1,
        created_at: "2026-01-07T10:00:00.000Z",
        fulfillment_status: "shipped",
        payment_status: "captured",
        currency_code: "egp",
        total: 1,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.deliveryDueToday).toHaveLength(0)
  })
})
